'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Catalogo } from '@/lib/supabase';
import FileManager from '@/app/components/FileManager';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({
  catalogo,
  onEdit,
  onDelete,
}: {
  catalogo: Catalogo;
  onEdit: (c: Catalogo) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: catalogo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-4 mb-2 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
        >
          ⋮⋮
        </button>
        <div>
          <h3 className="font-semibold">{catalogo.titulo}</h3>
          <p className="text-sm text-gray-500">/{catalogo.slug}</p>
          <p className="text-sm text-gray-600">
            {catalogo.ativo ? '🟢 Ativo' : '🔴 Inativo'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(catalogo)}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(catalogo.id)}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const [editingCatalogo, setEditingCatalogo] = useState<Catalogo | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    slug: '',
    descricao: '',
    preco: '',
    cta_label: 'Saiba mais',
    cta_url: '',
    pdf_url: '',
    ativo: true,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const response = await fetch('/api/admin/catalogos');
    if (response.status === 401) {
      router.push('/admin');
    } else {
      setIsAuthenticated(true);
      carregarCatalogos();
    }
  }

  async function carregarCatalogos() {
    try {
      const response = await fetch('/api/admin/catalogos');
      if (response.ok) {
        const data = await response.json();
        setCatalogos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar catálogos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  function openModal(catalogo?: Catalogo) {
    if (catalogo) {
      setEditingCatalogo(catalogo);
      setFormData({
        titulo: catalogo.titulo,
        slug: catalogo.slug,
        descricao: catalogo.descricao || '',
        preco: catalogo.preco || '',
        preco_posicao_x: catalogo.preco_posicao_x || 50,
        preco_posicao_y: catalogo.preco_posicao_y || 50,
        preco_tamanho: catalogo.preco_tamanho || 24,
        preco_cor: catalogo.preco_cor || '#000000',
        cta_label: catalogo.cta_label,
        cta_url: catalogo.cta_url || '',
        imagem_url: catalogo.imagem_url || '',
        pagina_tamanho: catalogo.pagina_tamanho || 'A4',
        orientacao: catalogo.orientacao || 'retrato',
        ativo: catalogo.ativo,
      });
    } else {
      setEditingCatalogo(null);
      setFormData({
        titulo: '',
        slug: '',
        descricao: '',
        preco: '',
        preco_posicao_x: 50,
        preco_posicao_y: 50,
        preco_tamanho: 24,
        preco_cor: '#000000',
        cta_label: 'Saiba mais',
        cta_url: '',
        imagem_url: '',
        pagina_tamanho: 'A4',
        orientacao: 'retrato',
        ativo: true,
      });
    }
    setModalOpen(true);
    setShowFileManager(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingCatalogo
      ? `/api/admin/catalogos/${editingCatalogo.id}`
      : '/api/admin/catalogos';
    const method = editingCatalogo ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setModalOpen(false);
      carregarCatalogos();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este catálogo?')) return;

    const response = await fetch(`/api/admin/catalogos/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      carregarCatalogos();
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = catalogos.findIndex((c) => c.id === active.id);
      const newIndex = catalogos.findIndex((c) => c.id === over.id);
      const newCatalogos = arrayMove(catalogos, oldIndex, newIndex);

      setCatalogos(newCatalogos);

      await Promise.all(
        newCatalogos.map((catalogo, index) =>
          fetch('/api/admin/catalogos', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: catalogo.id, ordem: index }),
          })
        )
      );
    }
  }

  function handleSelectImagem(url: string, path: string) {
    setFormData({ ...formData, imagem_url: url });
    setShowFileManager(false);
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
          <div className="flex gap-4">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              Ver site →
            </a>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Catálogos</h2>
          <button
            onClick={() => openModal()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Novo Catálogo
          </button>
        </div>

        {/* Lista com Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={catalogos.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {catalogos.map((catalogo) => (
              <SortableItem
                key={catalogo.id}
                catalogo={catalogo}
                onEdit={openModal}
                onDelete={handleDelete}
              />
            ))}
          </SortableContext>
        </DndContext>

        {catalogos.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Nenhum catálogo cadastrado. Clique em &quot;Novo Catálogo&quot; para começar.
          </p>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCatalogo ? 'Editar Catálogo' : 'Novo Catálogo'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="ex: catalogo-pascoa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço
                  </label>
                  <input
                    type="text"
                    value={formData.preco}
                    onChange={(e) =>
                      setFormData({ ...formData, preco: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="ex: R$ 99,90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.cta_label}
                    onChange={(e) =>
                      setFormData({ ...formData, cta_label: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Saiba mais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link do Botão
                  </label>
                  <input
                    type="url"
                    value={formData.cta_url}
                    onChange={(e) =>
                      setFormData({ ...formData, cta_url: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Imagem com FileManager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagem do Catálogo
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.imagem_url}
                    onChange={(e) =>
                      setFormData({ ...formData, imagem_url: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowFileManager(!showFileManager)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📁 {showFileManager ? 'Fechar' : 'Selecionar'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cole a URL da imagem ou clique em Selecionar para fazer upload
                </p>
              </div>

              {/* FileManager */}
              {showFileManager && (
                <div className="mt-4">
                  <FileManager
                    onSelect={handleSelectImagem}
                    selectedUrl={formData.imagem_url}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) =>
                    setFormData({ ...formData, ativo: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Catálogo ativo
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
