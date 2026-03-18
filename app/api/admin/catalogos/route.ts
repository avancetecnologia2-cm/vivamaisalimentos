import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
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

// GET - Listar todos os catálogos (admin vê todos)
export async function GET(request: NextRequest) {
  if (!(await verificarAuth(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('catalogos')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Criar novo catálogo
export async function POST(request: NextRequest) {
  if (!(await verificarAuth(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabaseAdmin
    .from('catalogos')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH - Atualizar ordem
export async function PATCH(request: NextRequest) {
  if (!(await verificarAuth(request))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  const { data, error } = await supabaseAdmin
    .from('catalogos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
