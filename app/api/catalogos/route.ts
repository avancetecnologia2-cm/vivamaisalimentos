import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/catalogos - Listar catálogos ativos (público)
export async function GET() {
  const { data, error } = await supabase
    .from('catalogos')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
