'use client';

import { useState, useRef, useCallback } from 'react';

interface ImagePriceEditorProps {
  imagemUrl: string | null;
  preco: string;
  posicaoX: number;
  posicaoY: number;
  tamanho: number;
  cor: string;
  orientacao: 'retrato' | 'paisagem';
  paginaTamanho: string;
  onPrecoChange: (value: string) => void;
  onPosicaoChange: (x: number, y: number) => void;
  onTamanhoChange: (value: number) => void;
  onCorChange: (value: string) => void;
  onOrientacaoChange: (value: 'retrato' | 'paisagem') => void;
  onPaginaTamanhoChange: (value: string) => void;
  onImagemUpload: (file: File) => void;
}

const TAMANHOS_PAGINA = [
  { value: 'A4', label: 'A4 (210×297mm)', width: 794, height: 1123 },
  { value: 'A3', label: 'A3 (297×420mm)', width: 1123, height: 1588 },
  { value: 'A2', label: 'A2 (420×594mm)', width: 1588, height: 2245 },
  { value: 'A5', label: 'A5 (148×210mm)', width: 559, height: 794 },
  { value: 'Letter', label: 'Letter (216×279mm)', width: 816, height: 1056 },
];

export default function ImagePriceEditor({
  imagemUrl,
  preco,
  posicaoX,
  posicaoY,
  tamanho,
  cor,
  orientacao,
  paginaTamanho,
  onPrecoChange,
  onPosicaoChange,
  onTamanhoChange,
  onCorChange,
  onOrientacaoChange,
  onPaginaTamanhoChange,
  onImagemUpload,
}: ImagePriceEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const tamanhoInfo = TAMANHOS_PAGINA.find((t) => t.value === paginaTamanho) || TAMANHOS_PAGINA[0];
  
  const canvasWidth = orientacao === 'retrato' ? tamanhoInfo.width : tamanhoInfo.height;
  const canvasHeight = orientacao === 'retrato' ? tamanhoInfo.height : tamanhoInfo.width;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left - posicaoX,
      y: e.clientY - rect.top - posicaoY,
    });
  }, [posicaoX, posicaoY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(canvasWidth - 50, e.clientX - rect.left - dragStart.x));
    const newY = Math.max(0, Math.min(canvasHeight - 30, e.clientY - rect.top - dragStart.y));
    onPosicaoChange(newX, newY);
  }, [isDragging, dragStart, canvasWidth, canvasHeight, onPosicaoChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
      onImagemUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho da Página</label>
            <select
              value={paginaTamanho}
              onChange={(e) => onPaginaTamanhoChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {TAMANHOS_PAGINA.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientação</label>
            <select
              value={orientacao}
              onChange={(e) => onOrientacaoChange(e.target.value as 'retrato' | 'paisagem')}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="retrato">Retrato</option>
              <option value="paisagem">Paisagem</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
            <input
              type="text"
              value={preco}
              onChange={(e) => onPrecoChange(e.target.value)}
              placeholder="R$ 99,90"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho Fonte</label>
            <input
              type="number"
              value={tamanho}
              onChange={(e) => onTamanhoChange(Number(e.target.value))}
              min="8"
              max="72"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cor}
                onChange={(e) => onCorChange(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{cor}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload de Imagem (JPEG/PNG)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600 flex items-center justify-between">
          <span>Arraste o preço para posicionar na imagem</span>
          <span className="text-xs">Pos: {Math.round(posicaoX)}, {Math.round(posicaoY)}</span>
        </div>
        <div
          ref={containerRef}
          className="relative overflow-auto"
          style={{ maxHeight: '600px' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative bg-white"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              backgroundImage: imagemUrl ? `url(${imagemUrl})` : 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
              backgroundSize: imagemUrl ? 'contain' : '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          >
            {!imagemUrl && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span className="text-lg">Faça upload de uma imagem JPEG</span>
              </div>
            )}
            
            {/* Preço arrastável */}
            <div
              className="absolute cursor-move select-none font-bold shadow-lg px-2 py-1 rounded"
              style={{
                left: posicaoX,
                top: posicaoY,
                fontSize: tamanho,
                color: cor,
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: isDragging ? '2px solid #3b82f6' : '1px solid transparent',
              }}
              onMouseDown={handleMouseDown}
            >
              {preco || 'R$ 0,00'}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        💡 Dica: Clique e arraste o preço na imagem para posicionar. Ajuste o tamanho e cor conforme necessário.
      </p>
    </div>
  );
}
