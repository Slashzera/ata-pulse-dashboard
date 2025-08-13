import React, { useState } from 'react';
import { Calendar, MessageSquare, Paperclip, CheckSquare, User, Tag, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { CardDetailModal } from './CardDetailModal';
import { useTrellinho } from '@/hooks/useTrellinho';

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  due_date?: string;
  created_by: string;
}

interface TrelloCardProps {
  card: Card;
  boardId: string;
  listId: string;
  onUpdate?: () => void;
  isDragging?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
}

export const TrelloCard: React.FC<TrelloCardProps> = ({ card, boardId, listId, onUpdate, isDragging = false, onEditingChange }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const { archiveCard, updateCardTitle } = useTrellinho();

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    
    return {
      formatted: date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short' 
      }),
      isOverdue
    };
  };

  const dueDate = formatDueDate(card.due_date);

  const handleEditCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetail(true);
  };

  const handleQuickEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    setEditTitle(card.title);
    // Notificar o componente pai que está editando
    if (onEditingChange) {
      onEditingChange(true);
    }
  };

  const handleSaveTitle = async () => {
    const newTitle = editTitle.trim();
    
    // Se o título não mudou ou está vazio, apenas cancela a edição
    if (!newTitle || newTitle === card.title) {
      setIsEditingTitle(false);
      setEditTitle(card.title);
      // Notificar que parou de editar
      if (onEditingChange) {
        onEditingChange(false);
      }
      return;
    }

    try {
      console.log('Salvando título:', { cardId: card.id, oldTitle: card.title, newTitle });
      
      const result = await updateCardTitle(card.id, newTitle);
      console.log('Título salvo com sucesso:', result);
      
      // Atualizar o estado local imediatamente
      card.title = newTitle;
      
      // Chamar callback de atualização
      if (onUpdate) {
        onUpdate();
      }
      
      setIsEditingTitle(false);
      // Notificar que parou de editar
      if (onEditingChange) {
        onEditingChange(false);
      }
    } catch (error) {
      console.error('Erro detalhado ao salvar título:', error);
      alert(`Erro ao salvar título: ${error.message || 'Erro desconhecido'}`);
      
      // Reverter para o título original em caso de erro
      setEditTitle(card.title);
      setIsEditingTitle(false);
      // Notificar que parou de editar
      if (onEditingChange) {
        onEditingChange(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditTitle(card.title);
    // Notificar que parou de editar
    if (onEditingChange) {
      onEditingChange(false);
    }
  };

  const handleDeleteCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este cartão?')) {
      try {
        await archiveCard(card.id);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Erro ao excluir cartão:', error);
        alert('Erro ao excluir cartão. Tente novamente.');
      }
    }
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg p-2 shadow-sm hover:shadow-md cursor-pointer transition-all border border-gray-200 relative group ${
          isDragging ? 'shadow-lg scale-105' : ''
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Card Actions - Visible on Hover */}
        {showActions && !isDragging && !isEditingTitle && (
          <div className="absolute top-1 right-1 flex space-x-1 bg-white rounded shadow-md border">
            <button
              onClick={handleQuickEditTitle}
              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Editar título"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={handleEditCard}
              className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Editar cartão completo"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
            <button
              onClick={handleDeleteCard}
              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Excluir cartão"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Labels placeholder */}
        <div className="flex flex-wrap gap-1 mb-2">
          {/* Aqui serão renderizadas as etiquetas quando implementadas */}
        </div>

        {/* Card Title */}
        <div>
          {isEditingTitle ? (
            <div className="mb-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTitle();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelEdit();
                  }
                }}
                onBlur={handleSaveTitle}
                className="w-full text-sm font-medium text-gray-800 bg-white border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end space-x-1 mt-1">
                <button
                  onClick={handleSaveTitle}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Salvar
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div onClick={() => !isDragging && setShowDetail(true)}>
              <h4 className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 hover:bg-gray-50 rounded px-1 py-1 cursor-pointer">
                {card.title}
              </h4>
            </div>
          )}
        </div>

        {/* Card Badges - Compacto */}
        {(dueDate || card.description) && (
          <div onClick={() => !isDragging && setShowDetail(true)} className="mt-1">
            <div className="flex items-center space-x-1">
              {/* Due Date */}
              {dueDate && (
                <div className={`flex items-center space-x-1 text-xs px-1 py-0.5 rounded ${
                  dueDate.isOverdue 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <Calendar className="w-2 h-2" />
                  <span className="text-xs">{dueDate.formatted}</span>
                </div>
              )}

              {/* Description indicator */}
              {card.description && (
                <div className="text-gray-500">
                  <MessageSquare className="w-2 h-2" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {showDetail && (
        <CardDetailModal
          card={card}
          boardId={boardId}
          listId={listId}
          onClose={() => setShowDetail(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};