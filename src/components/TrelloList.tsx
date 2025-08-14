import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreHorizontal, X, Edit2, Trash2, MessageSquare, Copy, Archive } from 'lucide-react';
import { TrelloCard } from './TrelloCard';
import { CreateCardDialog } from './CreateCardDialog';
import { useKazuFlow } from '@/hooks/useKazuFlow';
import { DroppableList } from './dnd/DroppableList';

interface List {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  due_date?: string;
  created_by: string;
}

interface TrelloListProps {
  list: List;
  boardId: string;
}

export const TrelloList: React.FC<TrelloListProps> = ({ list, boardId }) => {
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [showListMenu, setShowListMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [showComments, setShowComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { createCard, fetchBoardDetails, updateList, archiveList } = useKazuFlow();

  const handleCreateCard = async (cardData: { title: string; description?: string }) => {
    try {
      await createCard(list.id, cardData.title, cardData.description);
      setShowCreateCard(false);
      // Refresh board data
      await fetchBoardDetails(boardId);
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      alert('Erro ao criar cartão. Tente novamente.');
    }
  };

  const handleQuickAdd = async () => {
    if (quickTitle.trim()) {
      try {
        await createCard(list.id, quickTitle.trim());
        setQuickTitle('');
        setShowQuickAdd(false);
        await fetchBoardDetails(boardId);
      } catch (error) {
        console.error('Erro ao criar cartão:', error);
        alert('Erro ao criar cartão. Tente novamente.');
      }
    }
  };

  const handleCancelQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickTitle('');
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowListMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEditListTitle = () => {
    setIsEditingTitle(true);
    setEditTitle(list.title);
    setShowListMenu(false);
  };

  const handleSaveListTitle = async () => {
    if (editTitle.trim() && editTitle.trim() !== list.title) {
      try {
        await updateList(list.id, { title: editTitle.trim() });
        await fetchBoardDetails(boardId);
      } catch (error) {
        console.error('Erro ao salvar título da lista:', error);
        alert('Erro ao salvar título. Tente novamente.');
      }
    }
    setIsEditingTitle(false);
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditTitle(list.title);
  };

  const handleArchiveList = async () => {
    if (confirm('Tem certeza que deseja arquivar esta lista? Todos os cartões serão arquivados também.')) {
      try {
        await archiveList(list.id);
        await fetchBoardDetails(boardId);
        setShowListMenu(false);
      } catch (error) {
        console.error('Erro ao arquivar lista:', error);
        alert('Erro ao arquivar lista. Tente novamente.');
      }
    }
  };

  const handleCopyList = async () => {
    try {
      // Implementar cópia da lista
      alert('Funcionalidade de copiar lista será implementada em breve.');
      setShowListMenu(false);
    } catch (error) {
      console.error('Erro ao copiar lista:', error);
    }
  };

  const handleToggleComments = () => {
    setShowComments(!showComments);
    setShowListMenu(false);
  };

  return (
    <div className="bg-gray-100 rounded-lg p-3 w-64 flex-shrink-0 h-fit max-h-[calc(100vh-200px)] flex flex-col">
      {/* List Header */}
      <div className="flex items-center justify-between mb-2">
        {isEditingTitle ? (
          <div className="flex-1 mr-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveListTitle();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEditTitle();
                }
              }}
              onBlur={handleSaveListTitle}
              className="w-full font-semibold text-gray-800 bg-white border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        ) : (
          <h3 className="font-semibold text-gray-800 px-2 flex-1 truncate" title={list.title}>{list.title}</h3>
        )}
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowListMenu(!showListMenu)}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showListMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-50">
              <button
                onClick={handleEditListTitle}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Editar título</span>
              </button>
              
              <button
                onClick={handleToggleComments}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{showComments ? 'Ocultar comentários' : 'Mostrar comentários'}</span>
              </button>
              
              <button
                onClick={handleCopyList}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar lista</span>
              </button>
              
              <hr className="my-2" />
              
              <button
                onClick={handleArchiveList}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Archive className="w-4 h-4" />
                <span>Arquivar lista</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards with Drag and Drop - Scroll Vertical */}
      <div className="flex-1 overflow-y-auto mb-3 min-h-[50px] max-h-[400px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <DroppableList
          list={list}
          boardId={boardId}
          onUpdate={() => fetchBoardDetails(boardId)}
        />
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-white rounded-lg p-2 mb-2 border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-800">Comentários da Lista</h4>
          </div>
          
          {/* Add Comment */}
          <div className="mb-3">
            <textarea
              placeholder="Adicionar um comentário..."
              className="w-full text-sm border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                Comentar
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                U
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-800">Usuário</span>
                    <span className="text-xs text-gray-600">há 2 horas</span>
                  </div>
                  <p className="text-sm text-gray-700">Esta lista precisa de revisão antes do final da semana.</p>
                </div>
              </div>
            </div>
            
            <div className="text-center py-2">
              <span className="text-xs text-gray-500">Fim dos comentários</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Card */}
      {showQuickAdd ? (
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 mb-1">
          <textarea
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Insira um título para este cartão..."
            className="w-full text-sm resize-none border-none focus:outline-none focus:ring-0 p-1"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuickAdd();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                handleCancelQuickAdd();
              }
            }}
            autoFocus
          />
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={handleQuickAdd}
              disabled={!quickTitle.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar cartão
            </button>
            <button
              onClick={handleCancelQuickAdd}
              className="p-1 text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowQuickAdd(false);
                setShowCreateCard(true);
              }}
              className="text-xs text-gray-600 hover:text-gray-800 underline"
            >
              Mais opções
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="w-full text-left text-gray-600 hover:text-gray-800 hover:bg-gray-200 p-2 rounded-md transition-colors flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar um cartão</span>
        </button>
      )}

      {/* Create Card Dialog */}
      {showCreateCard && (
        <CreateCardDialog
          onClose={() => setShowCreateCard(false)}
          onSubmit={handleCreateCard}
          listTitle={list.title}
        />
      )}
    </div>
  );
};