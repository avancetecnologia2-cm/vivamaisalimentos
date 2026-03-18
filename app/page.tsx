'use client';

import { useState, useEffect } from 'react';
import { supabase, Catalogo } from '@/lib/supabase';

export default function Home() {
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [catalogoAtivo, setCatalogoAtivo] = useState<Catalogo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarCatalogos();
  }, []);

  async function carregarCatalogos() {
    try {
      const { data, error } = await supabase
        .from('catalogos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;

      setCatalogos(data || []);
      if (data && data.length > 0) {
        setCatalogoAtivo(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar catálogos:', error);
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

  if (catalogos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Nenhum catálogo disponível no momento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Catálogos</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex flex-wrap gap-2 border-b">
          {catalogos.map((catalogo) => (
            <button
              key={catalogo.id}
              onClick={() => setCatalogoAtivo(catalogo)}
              className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                catalogoAtivo?.id === catalogo.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {catalogo.titulo}
            </button>
          ))}
        </div>

        {catalogoAtivo && (
          <div className="bg-white rounded-b-lg shadow-sm p-6 mt-0">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {catalogoAtivo.titulo}
              </h2>
              {catalogoAtivo.descricao && (
                <p className="text-gray-600 mb-4">{catalogoAtivo.descricao}</p>
              )}
              {catalogoAtivo.preco && (
                <p className="text-2xl font-bold text-green-600">
                  {catalogoAtivo.preco}
                </p>
              )}
            </div>

            {catalogoAtivo.cta_url && (
              <div className="mb-6">
                <a
                  href={catalogoAtivo.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {catalogoAtivo.cta_label || 'Saiba mais'}
                </a>
              </div>
            )}

            {catalogoAtivo.pdf_url && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-800">Catálogo PDF</h3>
                  <a
                    href={catalogoAtivo.pdf_url}
                    download
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    📥 Baixar PDF
                  </a>
                </div>

                <div className="border rounded-lg overflow-hidden bg-gray-100">
                  <iframe
                    src={catalogoAtivo.pdf_url}
                    className="w-full h-[600px]"
                    title={`Catálogo ${catalogoAtivo.titulo}`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-12 py-6 text-center text-gray-500 text-sm">
        <a href="/admin" className="text-gray-400 hover:text-gray-600">
          Área Administrativa
        </a>
      </footer>
    </div>
  );
}
