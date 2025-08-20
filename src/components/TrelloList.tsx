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
      console.log('🔄 Criando cartão:', cardData);
      
      // ATUALIZAÇÃO OTIMISTA - Adicionar cartão imediatamente na UI
      const tempCard = {
        id: `temp-${Date.now()}`,
        title: cardData.title,
        description: cardData.description,
        position: (list.cards?.length || 0),
        created_by: 'current-user',
        list_id: list.id
      };
      
      // Atualizar lista local imediatamente
      list.cards = [...(list.cards || []), tempCard];
      
      setShowCreateCard(false);
      
      // Criar cartão no servidor em background
      const newCard = await createCard(list.id, cardData.title, cardData.description);
      console.log('✅ Cartão criado no servidor:', newCard);
      
      // Atualizar com dados reais do servidor
      await fetchBoardDetails(boardId);
      console.log('✅ Quadro sincronizado com servidor');
    } catch (error) {
      console.error('❌ Erro ao criar cartão:', error);
      // Reverter mudança otimista em caso de erro
      await fetchBoardDetails(boardId);
      alert('Erro ao criar cartão. Tente novamente.');
    }
  };

  const handleQuickAdd = async () => {
    if (quickTitle.trim()) {
      try {
        console.log('🔄 Criação rápida de cartão:', quickTitle.trim());
        
        // ATUALIZAÇÃO OTIMISTA - Adicionar cartão imediatamente na UI
        const tempCard = {
          id: `temp-${Date.now()}`,
          title: quickTitle.trim(),
          position: (list.cards?.length || 0),
          created_by: 'current-user',
          list_id: list.id
        };
        
        // Atualizar lista local imediatamente
        list.cards = [...(list.cards || []), tempCard];
        
        setQuickTitle('');
        setShowQuickAdd(false);
        
        // Criar cartão no servidor em background
        const newCard = await createCard(list.id, quickTitle.trim());
        console.log('✅ Cartão criado rapidamente no servidor:', newCard);
        
        // Sincronizar com servidor
        await fetchBoardDetails(boardId);
        console.log('✅ Quadro sincronizado após criação rápida');
      } catch (error) {
        console.error('❌ Erro ao criar cartão rapidamente:', error);
        // Reverter mudança otimista em caso de erro
        await fetchBoardDetails(boardId);
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
    <div className="group bg-gradient-to-br from-slate-800/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl border-2 border-cyan-400/30 rounded-3xl p-8 w-96 flex-shrink-0 h-fit max-h-[calc(100vh-250px)] flex flex-col shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:border-cyan-300/50 transition-all duration-500 hover:scale-105">
      {/* List Header NEON */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse"></div>
          {isEditingTitle ? (
            <div className="flex-1">
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
                className="w-full font-bold text-white text-xl bg-slate-800/50 border-2 border-cyan-400 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300"
                autoFocus
              />
            </div>
          ) : (
            <h3 className="font-bold text-white text-lg flex-1 leading-tight break-words hyphens-auto drop-shadow-lg pr-2" 
                title={list.title}
                style={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: '1.3',
                  maxHeight: '3.9em',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
              {list.title}
            </h3>
          )}
          <span className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-bold border border-cyan-400/30 shadow-lg">
            {list.cards?.length || 0}
          </span>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowListMenu(!showListMenu)}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 hover:bg-cyan-500/20 rounded-2xl text-cyan-300 hover:text-cyan-100 border border-transparent hover:border-cyan-400/50"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>

          {/* Dropdown Menu Moderno */}
          {showListMenu && (
            <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 w-56 z-50 animate-in slide-in-from-top-2 duration-300">
              <div className="px-4 py-2 border-b border-gray-100 mb-2">
                <p className="text-sm font-semibold text-gray-700">Opções da Lista</p>
              </div>
              
              <button
                onClick={handleEditListTitle}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="p-1 bg-blue-100 rounded-lg">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">Editar título</span>
              </button>
              
              <button
                onClick={handleToggleComments}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="p-1 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium">{showComments ? 'Ocultar comentários' : 'Mostrar comentários'}</span>
              </button>
              
              <button
                onClick={handleCopyList}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="p-1 bg-green-100 rounded-lg">
                  <Copy className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium">Copiar lista</span>
              </button>
              
              <div className="border-t border-gray-100 my-2"></div>
              
              <button
                onClick={handleArchiveList}
                className="w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="p-1 bg-red-100 rounded-lg">
                  <Archive className="w-4 h-4 text-red-600" />
                </div>
                <span className="font-medium">Arquivar lista</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards Area Moderna */}
      <div className="flex-1 overflow-y-auto mb-6 min-h-[120px] max-h-[500px]" 
           style={{
             scrollbarWidth: 'thin',
             scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent'
           }}>
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

      {/* Botão Adicionar Cartão NEON EXTREMO */}
      {showQuickAdd ? (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl p-6 shadow-2xl border-2 border-cyan-400/50 backdrop-blur-xl">
          <textarea
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Insira um título para este cartão..."
            className="w-full text-white text-lg resize-none border-2 border-cyan-400/50 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-300 bg-slate-800/50 placeholder-cyan-300/70"
            rows={4}
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
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleQuickAdd}
                disabled={!quickTitle.trim()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-lg rounded-2xl font-bold shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
              >
                Adicionar cartão
              </button>
              <button
                onClick={handleCancelQuickAdd}
                className="p-3 text-cyan-300 hover:text-cyan-100 hover:bg-slate-700/50 rounded-2xl transition-all duration-300 border border-cyan-400/30 hover:border-cyan-300/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => {
                setShowQuickAdd(false);
                setShowCreateCard(true);
              }}
              className="text-sm text-cyan-400 hover:text-cyan-200 font-bold hover:underline transition-colors duration-300"
            >
              Mais opções
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowQuickAdd(true)}
          className="group/btn w-full flex items-center justify-between p-6 bg-gradient-to-r from-slate-800/80 via-slate-900/80 to-gray-900/80 hover:from-cyan-900/50 hover:to-purple-900/50 border-2 border-dashed border-cyan-400/40 hover:border-cyan-300 rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl group-hover/btn:from-cyan-400/30 group-hover/btn:to-purple-400/30 transition-all duration-300 border border-cyan-400/30">
              <Plus className="h-6 w-6 text-cyan-300" />
            </div>
            <span className="text-cyan-200 group-hover/btn:text-cyan-100 font-bold text-lg transition-colors duration-300">
              Adicionar um cartão
            </span>
          </div>
          <div className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
          </div>
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