'use client';

import { useState, useEffect, useCallback } from 'react';

interface StorageItem {
  name: string;
  id: string | null;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface FileManagerProps {
  onSelect: (url: string, path: string) => void;
  selectedUrl?: string;
}

export default function FileManager({ onSelect, selectedUrl }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [pastas, setPastas] = useState<StorageItem[]>([]);
  const [arquivos, setArquivos] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [criandoPasta, setCriandoPasta] = useState(false);
  const [nomeNovaPasta, setNomeNovaPasta] = useState('');
  const [error, setError] = useState('');

  const carregarArquivos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/storage?prefix=${currentPath}`);
      if (response.ok) {
        const data = await response.json();
        setPastas(data.pastas || []);
        setArquivos(data.arquivos || []);
      } else {
        setError('Erro ao carregar arquivos');
      }
    } catch {
      setError('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    carregarArquivos();
  }, [carregarArquivos]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar PDF
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Apenas arquivos PDF são permitidos');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pasta', currentPath);

      const response = await fetch('/api/admin/storage', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onSelect(data.url, data.path);
        carregarArquivos();
      } else {
        const err = await response.json();
        setError(err.error || 'Erro no upload');
      }
    } catch {
      setError('Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  async function handleCriarPasta(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeNovaPasta.trim()) return;

    try {
      const response = await fetch('/api/admin/storage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeNovaPasta.trim(), parent: currentPath }),
      });

      if (response.ok) {
        setNomeNovaPasta('');
        setCriandoPasta(false);
        carregarArquivos();
      } else {
        const err = await response.json();
        setError(err.error || 'Erro ao criar pasta');
      }
    } catch {
      setError('Erro ao criar pasta');
    }
  }

  function navegarParaPasta(nomePasta: string) {
    setCurrentPath(currentPath ? `${currentPath}/${nomePasta}` : nomePasta);
  }

  function voltar() {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  }

  function getFileUrl(arquivo: StorageItem) {
    const path = currentPath ? `${currentPath}/${arquivo.name}` : arquivo.name;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${path}`;
  }

  return (
    <div className="border rounded-lg bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-white rounded-t-lg">
        <div className="flex items-center gap-2">
          {currentPath && (
            <button
              onClick={voltar}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Voltar
            </button>
          )}
          <span className="text-sm text-gray-600">
            {currentPath || 'Raiz'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCriandoPasta(true)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            📁 Nova Pasta
          </button>
          <label className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded cursor-pointer">
            {uploading ? '⏳...' : '📤 Upload PDF'}
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-2 bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Modal criar pasta */}
      {criandoPasta && (
        <div className="p-3 border-b bg-white">
          <form onSubmit={handleCriarPasta} className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da pasta"
              value={nomeNovaPasta}
              onChange={(e) => setNomeNovaPasta(e.target.value)}
              className="flex-1 px-3 py-1 border rounded text-sm"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 bg-green-600 text-white rounded text-sm"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setCriandoPasta(false)}
              className="px-3 py-1 bg-gray-300 rounded text-sm"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="max-h-64 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-4 text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-sm mt-2">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Pastas */}
            {pastas.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 uppercase px-2 mb-1">Pastas</p>
                {pastas.map((pasta) => (
                  <button
                    key={pasta.name}
                    onClick={() => navegarParaPasta(pasta.name)}
                    className="w-full text-left px-2 py-1.5 hover:bg-gray-200 rounded flex items-center gap-2"
                  >
                    📁 <span className="text-sm">{pasta.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Arquivos */}
            {arquivos.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase px-2 mb-1">PDFs</p>
                {arquivos.map((arquivo) => {
                  const url = getFileUrl(arquivo);
                  const isSelected = selectedUrl === url;

                  return (
                    <div
                      key={arquivo.name}
                      onClick={() => onSelect(url, currentPath ? `${currentPath}/${arquivo.name}` : arquivo.name)}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between cursor-pointer ${
                        isSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        📄 <span className="text-sm truncate">{arquivo.name}</span>
                      </div>
                      {isSelected && <span className="text-blue-600 text-xs">✓ Selecionado</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {pastas.length === 0 && arquivos.length === 0 && (
              <p className="text-center py-4 text-gray-400 text-sm">
                Pasta vazia. Faça upload de um PDF ou crie uma pasta.
              </p>
            )}
          </>
        )}
      </div>

      {/* Footer com URL selecionada */}
      {selectedUrl && (
        <div className="p-2 border-t bg-blue-50">
          <p className="text-xs text-gray-600">Selecionado:</p>
          <p className="text-xs text-blue-600 truncate">{selectedUrl}</p>
        </div>
      )}
    </div>
  );
}
