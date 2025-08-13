import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreHorizontal, Users, Bell, ArrowLeft, Edit2, Trash2, Copy, Palette } from 'lucide-react';
import { useTrellinho } from '@/hooks/useTrellinho';
import { TrelloBoard } from './TrelloBoard';
import { CreateBoardDialog } from './CreateBoardDialog';
import { NotificationCenter } from './NotificationCenter';

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

interface TrellinhoProps {
  onBack?: () => void;
}

export const Trellinho: React.FC<TrellinhoProps> = ({ onBack }) => {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { boards, loading, error, fetchBoards, createBoard, createBoardWithType, updateBoard, archiveBoard } = useTrellinho();

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (boardData: { 
    title: string; 
    description?: string; 
    background_color?: string;
    board_type_id?: string;
    process_number?: string;
    responsible_person?: string;
    company?: string;
    object_description?: string;
    process_value?: number;
  }) => {
    try {
      if (boardData.board_type_id) {
        await createBoardWithType(boardData as any);
      } else {
        await createBoard(boardData);
      }
      setShowCreateBoard(false);
      fetchBoards();
    } catch (error) {
      console.error('Erro ao criar quadro:', error);
    }
  };

  if (selectedBoard) {
    return (
      <TrelloBoard 
        board={selectedBoard} 
        onBack={() => setSelectedBoard(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Voltar</span>
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Trellinho</h1>
                <p className="text-gray-600">Gerencie seus projetos e tarefas de forma visual</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>

        {/* Boards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create New Board Card */}
          <div 
            onClick={() => setShowCreateBoard(true)}
            className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[200px]"
          >
            <Plus className="w-12 h-12 text-gray-400 mb-3" />
            <span className="text-gray-600 font-medium">Criar novo quadro</span>
          </div>

          {/* Existing Boards */}
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-12">
              <p className="text-red-600">Erro ao carregar quadros: {error}</p>
            </div>
          ) : (
            boards.map((board) => (
              <BoardCard 
                key={board.id} 
                board={board} 
                onClick={() => setSelectedBoard(board)}
                onUpdate={fetchBoards}
              />
            ))
          )}
        </div>

        {/* Create Board Dialog */}
        {showCreateBoard && (
          <CreateBoardDialog
            onClose={() => setShowCreateBoard(false)}
            onSubmit={handleCreateBoard}
          />
        )}

        {/* Notification Center */}
        {showNotifications && (
          <NotificationCenter
            onClose={() => setShowNotifications(false)}
          />
        )}
      </div>
    </div>
  );
};

interface BoardCardProps {
  board: Board;
  onClick: () => void;
  onUpdate: () => void;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onClick, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const { updateBoard, archiveBoard } = useTrellinho();

  // Cores disponíveis para os quadros
  const availableColors = [
    { name: 'Azul', value: '#0079bf' },
    { name: 'Verde', value: '#61bd4f' },
    { name: 'Laranja', value: '#ff9f1a' },
    { name: 'Vermelho', value: '#eb5a46' },
    { name: 'Roxo', value: '#c377e0' },
    { name: 'Rosa', value: '#ff78cb' },
    { name: 'Verde Claro', value: '#51e898' },
    { name: 'Azul Claro', value: '#00c2e0' },
    { name: 'Cinza', value: '#c4c9cc' },
    { name: 'Amarelo', value: '#f2d600' },
    { name: 'Marrom', value: '#8b4513' },
    { name: 'Azul Escuro', value: '#344563' }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    setEditTitle(board.title);
    setShowMenu(false);
  };

  const handleSaveTitle = async () => {
    const newTitle = editTitle.trim();
    
    if (!newTitle || newTitle === board.title) {
      setIsEditingTitle(false);
      setEditTitle(board.title);
      return;
    }

    try {
      await updateBoard(board.id, { title: newTitle });
      setIsEditingTitle(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar título do quadro:', error);
      alert('Erro ao salvar título. Tente novamente.');
      setEditTitle(board.title);
      setIsEditingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditTitle(board.title);
  };

  const handleArchiveBoard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.')) {
      try {
        console.log('Iniciando exclusão do quadro:', board.id);
        await archiveBoard(board.id);
        console.log('Quadro excluído com sucesso');
        setShowMenu(false);
        onUpdate();
      } catch (error: any) {
        console.error('Erro detalhado ao excluir quadro:', error);
        const errorMessage = error?.message || 'Erro desconhecido';
        alert(`Erro ao excluir quadro: ${errorMessage}`);
      }
    }
  };

  const handleCopyBoard = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert('Funcionalidade de copiar quadro será implementada em breve.');
    setShowMenu(false);
  };

  const handleChangeColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(true);
    setShowMenu(false);
  };

  const handleColorSelect = async (color: string) => {
    try {
      await updateBoard(board.id, { background_color: color });
      setShowColorPicker(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao alterar cor do quadro:', error);
      alert('Erro ao alterar cor. Tente novamente.');
    }
  };

  return (
    <div className="relative group cursor-pointer transform hover:scale-105 transition-all duration-200">
      {isEditingTitle ? (
        <div className="bg-white rounded-lg p-6 min-h-[200px] flex flex-col justify-center shadow-lg border-2 border-blue-500">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Quadro
            </label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleSaveTitle}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={onClick}
          className="rounded-lg p-6 text-white min-h-[200px] flex flex-col justify-between shadow-lg"
          style={{ backgroundColor: board.background_color }}
        >
          <div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{board.title}</h3>
            {board.description && (
              <p className="text-sm opacity-90 line-clamp-3">{board.description}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2 text-sm opacity-90">
              <Users className="w-4 h-4" />
              <span className="capitalize">{board.member_role}</span>
            </div>
            
            <div className="relative" ref={menuRef}>
              <button 
                onClick={handleMenuClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48 z-50">
                  <button
                    onClick={handleEditTitle}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar título</span>
                  </button>
                  
                  <button
                    onClick={handleChangeColor}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Alterar cor</span>
                  </button>
                  
                  <button
                    onClick={handleCopyBoard}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar quadro</span>
                  </button>
                  
                  <hr className="my-2" />
                  
                  <button
                    onClick={handleArchiveBoard}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir quadro</span>
                  </button>
                </div>
              )}

              {/* Color Picker Modal */}
              {showColorPicker && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowColorPicker(false)}>
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Alterar Cor do Quadro</h3>
                      <button
                        onClick={() => setShowColorPicker(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3">
                      {availableColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleColorSelect(color.value)}
                          className={`w-full h-16 rounded-lg border-2 transition-all hover:scale-105 ${
                            board.background_color === color.value 
                              ? 'border-gray-800 ring-2 ring-gray-400' 
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        >
                          {board.background_color === color.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setShowColorPicker(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};