import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jwtVerify } from 'jose';

async function verificarAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('admin_token')?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!token || !adminPassword) return false;

  try {
    const secret = new TextEncoder().encode(adminPassword);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

// GET /api/admin/storage?prefix=pasta/ - Listar arquivos e pastas
export async function GET(request: NextRequest) {
  if (!(await verificarAuth(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') || '';

  try {
    const { data, error } = await supabaseAdmin.storage
      .from('pdfs')
      .list(prefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Separar pastas (que terminam com /) de arquivos
    const pastas = data.filter((item) => item.id === null);
    const arquivos = data.filter((item) => item.id !== null);

    return NextResponse.json({ pastas, arquivos, prefix });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/storage/upload - Upload de arquivo
export async function POST(request: NextRequest) {
  if (!(await verificarAuth(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pasta = (formData.get('pasta') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar que é um PDF
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Apenas arquivos PDF são permitidos' }, { status: 400 });
    }

    // Criar caminho do arquivo
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = pasta ? `${pasta}/${fileName}` : fileName;

    // Converter File para ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Fazer upload
    const { data, error } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obter URL pública
    const { data: urlData } = supabaseAdmin.storage.from('pdfs').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/storage/folder - Criar pasta
export async function PUT(request: NextRequest) {
  if (!(await verificarAuth(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { nome, parent } = await request.json();

    if (!nome) {
      return NextResponse.json({ error: 'Nome da pasta obrigatório' }, { status: 400 });
    }

    // No Supabase Storage, criamos um arquivo vazio com o nome da pasta + /
    const folderPath = parent ? `${parent}/${nome}/.folder` : `${nome}/.folder`;

    const { error } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(folderPath, new Uint8Array(0), {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: parent ? `${parent}/${nome}/` : `${nome}/`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/storage - Deletar arquivo ou pasta
export async function DELETE(request: NextRequest) {
  if (!(await verificarAuth(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Caminho obrigatório' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage.from('pdfs').remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
