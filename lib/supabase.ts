import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin para operações no servidor (com service role key)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

export type Catalogo = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  preco: string | null;
  cta_label: string;
  cta_url: string | null;
  pdf_url: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};
