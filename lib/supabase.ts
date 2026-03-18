import { createClient } from '@supabase/supabase-js';

// Lazy initialization - clients are created only when first accessed
let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY sao obrigatorios');
      }

      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_supabase as any)[prop];
  },
});

// Cliente admin para operacoes no servidor (com service role key)
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL e obrigatorio');
      }

      if (supabaseServiceKey) {
        _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      } else {
        // Fallback to anon client if no service role key
        if (!_supabase) {
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (!supabaseAnonKey) {
            throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY e obrigatorio');
          }
          _supabase = createClient(supabaseUrl, supabaseAnonKey);
        }
        _supabaseAdmin = _supabase;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (_supabaseAdmin as any)[prop];
  },
});

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
