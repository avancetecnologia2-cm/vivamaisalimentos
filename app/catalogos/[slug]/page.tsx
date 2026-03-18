'use client';

import { useState, useEffect } from 'react';
import { supabase, Catalogo } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CatalogoPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      carregarCatalogo();
    }
  }, [slug]);

  async function carregarCatalogo() {
    try {
      const { data, error } = await supabase
        .from('catalogos')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Catálogo não encontrado');

      setCatalogo(data);
    } catch (err) {
      setError('Catálogo não encontrado ou inativo');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !catalogo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || 'Catálogo não encontrado'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Voltar para os catálogos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{catalogo.titulo}</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Voltar
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            {catalogo.descricao && (
              <p className="text-gray-600 mb-4">{catalogo.descricao}</p>
            )}
            {catalogo.preco && (
              <p className="text-2xl font-bold text-green-600">
                {catalogo.preco}
              </p>
            )}
          </div>

          {catalogo.cta_url && (
            <div className="mb-6">
              <a
                href={catalogo.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {catalogo.cta_label || 'Saiba mais'}
              </a>
            </div>
          )}

          {catalogo.pdf_url && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">Catálogo PDF</h3>
                <a
                  href={catalogo.pdf_url}
                  download
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  📥 Baixar PDF
                </a>
              </div>

              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <iframe
                  src={catalogo.pdf_url}
                  className="w-full h-[600px]"
                  title={`Catálogo ${catalogo.titulo}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
