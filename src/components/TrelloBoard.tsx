import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MoreHorizontal, Users, Settings } from 'lucide-react';
import { useKazuFlow } from '@/hooks/useKazuFlow';
import { TrelloList } from './TrelloList';
import { CreateListDialog } from './CreateListDialog';
import { TrelloDragDropContext } from './dnd/DragDropContext';

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
      console.log('🔄 Iniciando movimentação de cartão:', { cardId, sourceListId, targetListId, newPosition });
      
      const result = await moveCardToList(cardId, targetListId, newPosition);
      
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          console.log('✅ Cartão movido com sucesso:', result);
        } else {
          console.error('❌ Erro na movimentação:', result.message || result.error);
          throw new Error(result.message || 'Erro desconhecido na movimentação');
        }
      }
      
      // Refresh board data após um pequeno delay
      setTimeout(() => {
        console.log('🔄 Atualizando dados do quadro...');
        fetchBoardDetails(board.id);
      }, 200);
      
    } catch (error) {
      console.error('❌ Erro ao mover cartão:', error);
      // Refresh imediato em caso de erro para reverter mudanças visuais
      fetchBoardDetails(board.id);
      
      // Opcional: mostrar notificação de erro para o usuário
      // toast.error('Erro ao mover cartão. Tente novamente.');
    }
  };

  const handleCardReorder = async (listId: string, cardId: string, newPosition: number) => {
    try {
      console.log('🔄 Iniciando reordenação de cartão:', { listId, cardId, newPosition });
      
      const result = await moveCardToList(cardId, listId, newPosition);
      
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          console.log('✅ Cartão reordenado com sucesso:', result);
        } else {
          console.error('❌ Erro na reordenação:', result.message || result.error);
          throw new Error(result.message || 'Erro desconhecido na reordenação');
        }
      }
      
      // Refresh board data após um pequeno delay
      setTimeout(() => {
        console.log('🔄 Atualizando dados do quadro...');
        fetchBoardDetails(board.id);
      }, 200);
      
    } catch (error) {
      console.error('❌ Erro ao reordenar cartão:', error);
      // Refresh imediato em caso de erro
      fetchBoardDetails(board.id);
      
      // Opcional: mostrar notificação de erro para o usuário
      // toast.error('Erro ao reordenar cartão. Tente novamente.');
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
    <div className="min-h-screen" style={{ backgroundColor: board.background_color }}>
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-white hover:bg-white/20 p-2 rounded-md transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-white">{boardData?.title || board.title}</h1>
                {boardData?.description && (
                  <p className="text-white/80 text-sm">{boardData.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="text-white hover:bg-white/20 p-2 rounded-md transition-colors">
                <Users className="w-5 h-5" />
              </button>
              <button className="text-white hover:bg-white/20 p-2 rounded-md transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="text-white hover:bg-white/20 p-2 rounded-md transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Board Content with Drag and Drop */}
      <div className="p-6 h-[calc(100vh-120px)]">
        <TrelloDragDropContext
          lists={lists}
          onCardMove={handleCardMove}
          onCardReorder={handleCardReorder}
        >
          {/* Layout Horizontal com Scroll - Baseado na Imagem */}
          <div className="flex space-x-4 h-full overflow-x-auto pb-4">
            {/* Lists */}
            {lists.map((list: any) => (
              <TrelloList 
                key={list.id} 
                list={list} 
                boardId={board.id}
              />
            ))}

            {/* Add List Button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowCreateList(true)}
                className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg w-64 flex items-center justify-center space-x-2 transition-colors h-fit min-h-[60px]"
              >
                <Plus className="w-5 h-5" />
                <span>Adicionar uma lista</span>
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
    </div>
  );
};