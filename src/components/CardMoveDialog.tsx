import React, { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useKazuFlow } from '@/hooks/useKazuFlow';

interface List {
  id: string;
  title: string;
  board_id: string;
}

interface Board {
  id: string;
  title: string;
  lists: List[];
}

interface CardMoveDialogProps {
  cardId: string;
  currentListId: string;
  currentBoardId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const CardMoveDialog: React.FC<CardMoveDialogProps> = ({
  cardId,
  currentListId,
  currentBoardId,
  onClose,
  onUpdate
}) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState(currentBoardId);
  const [selectedListId, setSelectedListId] = useState('');
  const [position, setPosition] = useState<number>(0);

  const { fetchBoards, fetchBoardDetails, moveCardToList, loading } = useKazuFlow();

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (selectedBoardId) {
      loadBoardLists(selectedBoardId);
    }
  }, [selectedBoardId]);

  const loadBoards = async () => {
    try {
      const userBoards = await fetchBoards();
      const boardsWithLists = await Promise.all(
        userBoards.map(async (board: any) => {
          const details = await fetchBoardDetails(board.id);
          return {
            id: board.id,
            title: board.title,
            lists: details?.lists || []
          };
        })
      );
      setBoards(boardsWithLists);
    } catch (error) {
      console.error('Erro ao carregar quadros:', error);
    }
  };

  const loadBoardLists = async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (!board) {
      try {
        const details = await fetchBoardDetails(boardId);
        setBoards(prev => prev.map(b => 
          b.id === boardId 
            ? { ...b, lists: details?.lists || [] }
            : b
        ));
      } catch (error) {
        console.error('Erro ao carregar listas:', error);
      }
    }
  };

  const handleMove = async () => {
    if (selectedListId && selectedListId !== currentListId) {
      try {
        await moveCardToList(cardId, selectedListId, position);
        onUpdate();
        onClose();
      } catch (error) {
        console.error('Erro ao mover cartão:', error);
      }
    }
  };

  const selectedBoard = boards.find(b => b.id === selectedBoardId);
  const selectedList = selectedBoard?.lists.find(l => l.id === selectedListId);
  const currentList = boards
    .find(b => b.id === currentBoardId)
    ?.lists.find(l => l.id === currentListId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Mover Cartão
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Localização Atual */}
          <div className="bg-gray-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Localização Atual</h4>
            <p className="text-sm text-gray-600">
              {boards.find(b => b.id === currentBoardId)?.title} → {currentList?.title}
            </p>
          </div>

          {/* Selecionar Quadro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quadro de Destino
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => {
                setSelectedBoardId(e.target.value);
                setSelectedListId('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.title}
                </option>
              ))}
            </select>
          </div>

          {/* Selecionar Lista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lista de Destino
            </label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedBoard?.lists.length}
            >
              <option value="">Selecione uma lista</option>
              {selectedBoard?.lists.map((list) => (
                <option 
                  key={list.id} 
                  value={list.id}
                  disabled={list.id === currentListId}
                >
                  {list.title} {list.id === currentListId ? '(atual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Posição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posição
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedListId}
            >
              <option value={0}>Início da lista</option>
              {selectedList && Array.from({ length: (selectedList as any).cards?.length || 0 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Posição {i + 1}
                </option>
              ))}
              <option value={999}>Final da lista</option>
            </select>
          </div>

          {/* Preview */}
          {selectedListId && selectedListId !== currentListId && (
            <div className="bg-blue-50 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Nova Localização</h4>
              <p className="text-sm text-blue-700">
                {selectedBoard?.title} → {selectedList?.title}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedListId || selectedListId === currentListId || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Movendo...' : 'Mover Cartão'}
          </button>
        </div>
      </div>
    </div>
  );
};