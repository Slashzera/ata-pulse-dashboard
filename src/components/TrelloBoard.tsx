import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MoreHorizontal, Users, Settings } from 'lucide-react';
import { useKazuFlow } from '@/hooks/useKazuFlow';
import { TrelloList } from './TrelloList';
import { CreateListDialog } from './CreateListDialog';
import { TrelloDragDropContext } from './dnd/DragDropContext';
import { Footer } from './Footer';

interface Board {
  id: string;
  title: string;
  description?: string;
  background_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_role: string;
}

interface TrelloBoardProps {
  board: Board;
  onBack: () => void;
}

export const TrelloBoard: React.FC<TrelloBoardProps> = ({ board, onBack }) => {
  const [showCreateList, setShowCreateList] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const { currentBoard, loading, error, fetchBoardDetails, createList, moveCardToList } = useKazuFlow();

  useEffect(() => {
    fetchBoardDetails(board.id);
  }, [board.id, fetchBoardDetails]);

  const handleCreateList = async (title: string) => {
    try {
      await createList(board.id, title);
      setShowCreateList(false);
      // Refresh board data
      fetchBoardDetails(board.id);
    } catch (error) {
      console.error('Erro ao criar lista:', error);
    }
  };

  const handleCardMove = async (cardId: string, sourceListId: string, targetListId: string, newPosition: number) => {
    try {
      console.log('🚀 MOVIMENTAÇÃO ULTRA-RÁPIDA de cartão:', { cardId, sourceListId, targetListId, newPosition });
      
      // Executar movimentação no servidor (a UI já foi atualizada otimisticamente)
      const result = await moveCardToList(cardId, targetListId, newPosition);
      
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          console.log('✅ Cartão movido no servidor:', result);
          // Sincronização leve em background (sem bloquear UI)
          setTimeout(() => fetchBoardDetails(board.id), 1000);
        } else {
          console.error('❌ Erro na movimentação:', result.message || result.error);
          throw new Error(result.message || 'Erro desconhecido na movimentação');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao mover cartão:', error);
      // Refresh imediato em caso de erro para reverter mudanças visuais
      await fetchBoardDetails(board.id);
    }
  };

  const handleCardReorder = async (listId: string, cardId: string, newPosition: number) => {
    try {
      console.log('🚀 REORDENAÇÃO ULTRA-RÁPIDA de cartão:', { listId, cardId, newPosition });
      
      // Executar reordenação no servidor (a UI já foi atualizada otimisticamente)
      const result = await moveCardToList(cardId, listId, newPosition);
      
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          console.log('✅ Cartão reordenado no servidor:', result);
          // Sincronização leve em background (sem bloquear UI)
          setTimeout(() => fetchBoardDetails(board.id), 1000);
        } else {
          console.error('❌ Erro na reordenação:', result.message || result.error);
          throw new Error(result.message || 'Erro desconhecido na reordenação');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao reordenar cartão:', error);
      // Refresh imediato em caso de erro
      await fetchBoardDetails(board.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: board.background_color }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: board.background_color }}>
        <div className="text-white text-center">
          <p className="text-xl mb-4">Erro ao carregar quadro</p>
          <p className="mb-4">{error}</p>
          <button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const boardData = currentBoard?.board;
  const lists = currentBoard?.lists || [];

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, 
          ${board.background_color}dd 0%, 
          ${board.background_color}aa 25%, 
          ${board.background_color}88 50%, 
          ${board.background_color}66 75%, 
          ${board.background_color}44 100%
        )`
      }}
    >
      {/* Header Ultra Moderno */}
      <div 
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, 
            ${board.background_color}ee 0%, 
            ${board.background_color}cc 25%, 
            ${board.background_color}aa 50%, 
            ${board.background_color}88 75%, 
            ${board.background_color}66 100%
          )`,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)
          `
        }}
      >
        <div className="absolute inset-0 backdrop-blur-sm"></div>
        <div className="relative z-10 max-w-full mx-auto px-8 py-6">
          {/* Breadcrumb Moderno */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Voltar ao KazuFlow</span>
            </button>
          </div>
          
          {/* Título Principal Moderno */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {boardData?.title || board.title}
                </h1>
                <div className="flex items-center gap-4 text-white/90">
                  {boardData?.description && (
                    <>
                      <span className="text-lg font-medium">{boardData.description}</span>
                      <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                    </>
                  )}
                  <span className="text-sm font-medium">
                    {lists.length} {lists.length === 1 ? 'lista' : 'listas'} • 
                    {lists.reduce((acc, list) => acc + (list.cards?.length || 0), 0)} cartões
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions Modernos */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert('Funcionalidade de membros será implementada em breve!')}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
                title="Gerenciar Membros"
              >
                <Users className="h-6 w-6 text-white" />
              </button>
              <button 
                onClick={() => setShowBoardSettings(!showBoardSettings)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
                title="Configurações do Quadro"
              >
                <Settings className="h-6 w-6 text-white" />
              </button>
              <button 
                onClick={() => setShowBoardMenu(!showBoardMenu)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
                title="Menu do Quadro"
              >
                <MoreHorizontal className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content Ultra Moderno - FUNDO ROXO ESCURO */}
      <div 
        className="p-8 h-[calc(100vh-200px)]"
        style={{
          background: `linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #4338ca 75%, #4f46e5 100%)`,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      >
        <TrelloDragDropContext
          lists={lists}
          onCardMove={handleCardMove}
          onCardReorder={handleCardReorder}
        >
          {/* Layout Horizontal Moderno */}
          <div 
            className="flex gap-8 h-full overflow-x-auto pb-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent'
            }}
          >
            {/* Lists Modernizadas */}
            {lists.map((list: any, index: number) => (
              <div
                key={list.id}
                className="animate-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TrelloList 
                  list={list} 
                  boardId={board.id}
                />
              </div>
            ))}

            {/* Add List Button NEON MODERNO */}
            <div className="flex-shrink-0 animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${lists.length * 0.1}s` }}>
              <button
                onClick={() => setShowCreateList(true)}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90 backdrop-blur-xl border-2 border-dashed border-purple-400/50 hover:border-cyan-400 p-8 rounded-3xl w-80 min-h-[250px] flex flex-col items-center justify-center gap-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-3xl group-hover:scale-110 transition-transform duration-300 shadow-2xl border border-cyan-400/30">
                    <Plus className="w-10 h-10 text-cyan-300" />
                  </div>
                  <div className="text-center">
                    <span className="text-white font-bold text-xl block mb-2 drop-shadow-lg">Adicionar Lista</span>
                    <span className="text-cyan-200 text-sm font-medium">Organize suas tarefas</span>
                  </div>
                  
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
                    <span className="text-sm text-cyan-300 font-semibold">Clique para criar</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </TrelloDragDropContext>
      </div>

      {/* Create List Dialog */}
      {showCreateList && (
        <CreateListDialog
          onClose={() => setShowCreateList(false)}
          onSubmit={handleCreateList}
        />
      )}

      {/* Board Settings Modal */}
      {showBoardSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBoardSettings(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-600" />
                Configurações do Quadro
              </h3>
              <button
                onClick={() => setShowBoardSettings(false)}
                className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-700 mb-2">Informações do Quadro</h4>
                <p className="text-sm text-gray-600 mb-1"><strong>Título:</strong> {boardData?.title || board.title}</p>
                <p className="text-sm text-gray-600 mb-1"><strong>Descrição:</strong> {boardData?.description || 'Sem descrição'}</p>
                <p className="text-sm text-gray-600"><strong>Listas:</strong> {lists.length}</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-blue-700 mb-2">Ações Rápidas</h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setShowBoardSettings(false);
                      alert('Funcionalidade de editar quadro será implementada em breve!');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    📝 Editar Informações do Quadro
                  </button>
                  <button 
                    onClick={() => {
                      setShowBoardSettings(false);
                      alert('Funcionalidade de arquivar quadro será implementada em breve!');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    🗑️ Arquivar Quadro
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBoardSettings(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Board Menu Modal */}
      {showBoardMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBoardMenu(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <MoreHorizontal className="h-6 w-6 text-purple-600" />
                Menu do Quadro
              </h3>
              <button
                onClick={() => setShowBoardMenu(false)}
                className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowBoardMenu(false);
                  alert('Funcionalidade de atividade será implementada em breve!');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600">📊</span>
                </div>
                <div>
                  <span className="font-medium">Ver Atividade</span>
                  <p className="text-sm text-gray-500">Histórico de mudanças no quadro</p>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setShowBoardMenu(false);
                  alert('Funcionalidade de filtros será implementada em breve!');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600">🔍</span>
                </div>
                <div>
                  <span className="font-medium">Filtrar Cartões</span>
                  <p className="text-sm text-gray-500">Buscar e filtrar cartões</p>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setShowBoardMenu(false);
                  alert('Funcionalidade de automação será implementada em breve!');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600">⚡</span>
                </div>
                <div>
                  <span className="font-medium">Automação</span>
                  <p className="text-sm text-gray-500">Configurar regras automáticas</p>
                </div>
              </button>
              
              <div className="border-t border-gray-200 my-3"></div>
              
              <button 
                onClick={() => {
                  setShowBoardMenu(false);
                  alert('Funcionalidade de exportar será implementada em breve!');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-orange-600">📤</span>
                </div>
                <div>
                  <span className="font-medium">Exportar Quadro</span>
                  <p className="text-sm text-gray-500">Baixar dados em PDF/Excel</p>
                </div>
              </button>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBoardMenu(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer com informações de patente */}
      <Footer />
    </div>
  );
};