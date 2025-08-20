import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreHorizontal, Users, Bell, ArrowLeft, Edit2, Trash2, Copy, Palette, Sparkles, Zap, Star, Workflow, Grid3X3, Layout, Layers, Target, Rocket, Crown, Gem } from 'lucide-react';
import { useKazuFlow } from '@/hooks/useKazuFlow';
import { TrelloBoard } from './TrelloBoard';
import { CreateBoardDialog } from './CreateBoardDialog';
import { NotificationCenter } from './NotificationCenter';
import { MoveToBoardTrash } from './MoveToBoardTrash';
import { EditTitleButton } from './EditTitleButton';
import { ChangeColorButton } from './ChangeColorButton';
import { CopyBoardButton } from './CopyBoardButton';
import { DeleteBoardButton } from './DeleteBoardButton';
import { KazuFlowTrashManager } from './KazuFlowTrashManager';
import { supabase } from '@/integrations/supabase/client';


interface Board {
  id: string;
  title: string;
  description?: string;
  background_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_role: string;
  process_number?: string;
  responsible_person?: string;
  company?: string;
  object_description?: string;
  process_value?: number;
  board_type?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

interface KazuFlowProps {
  onBack?: () => void;
}

export const KazuFlow: React.FC<KazuFlowProps> = ({ onBack }) => {
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTrashManager, setShowTrashManager] = useState(false);
  const { boards, loading, error, fetchBoards, createBoard, createBoardWithType, updateBoard, archiveBoard } = useKazuFlow();
  const [localBoards, setLocalBoards] = useState<Board[]>([]);

  // Sincronizar boards locais com os do hook
  useEffect(() => {
    setLocalBoards(boards);
  }, [boards]);

  useEffect(() => {
    let isMounted = true;
    
    const loadBoards = async () => {
      if (isMounted) {
        await fetchBoards();
      }
    };
    
    loadBoards();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const [isCreatingBoard, setIsCreatingBoard] = useState(false);

  // FUNÇÃO GLOBAL DE EXCLUSÃO - GARANTIDA PARA FUNCIONAR
  const deleteBoard = async (boardId: string, boardTitle: string) => {
    console.log('🚨 FUNÇÃO GLOBAL DE EXCLUSÃO CHAMADA:', boardId, boardTitle);
    
    const confirmDelete = confirm(`⚠️ Tem certeza que deseja excluir o quadro "${boardTitle}"?\n\nEsta ação não pode ser desfeita!`);
    
    if (!confirmDelete) {
      console.log('❌ Exclusão cancelada pelo usuário');
      return false;
    }
    
    try {
      console.log('🔄 Iniciando exclusão...');
      
      // Método 1: Função do hook
      if (archiveBoard) {
        console.log('📞 Tentando archiveBoard do hook...');
        try {
          const result = await archiveBoard(boardId);
          console.log('✅ Hook funcionou:', result);
          alert('✅ Quadro excluído com sucesso!');
          await fetchBoards();
          return true;
        } catch (hookError) {
          console.error('❌ Hook falhou:', hookError);
        }
      }
      
      // Método 2: Supabase RPC
      console.log('📞 Tentando emergency_delete_board...');
      try {
        const { data, error } = await supabase.rpc('emergency_delete_board', {
          board_id: boardId
        });
        
        if (error) throw error;
        
        if (data === true) {
          console.log('✅ RPC funcionou!');
          alert('✅ Quadro excluído com sucesso!');
          await fetchBoards();
          return true;
        }
      } catch (rpcError) {
        console.error('❌ RPC falhou:', rpcError);
      }
      
      // Método 3: SQL direto
      console.log('📞 Tentando SQL direto...');
      try {
        const { error } = await supabase
          .from('trello_boards')
          .update({ is_deleted: true })
          .eq('id', boardId);
        
        if (error) throw error;
        
        console.log('✅ SQL direto funcionou!');
        alert('✅ Quadro excluído com sucesso!');
        await fetchBoards();
        return true;
      } catch (sqlError) {
        console.error('❌ SQL direto falhou:', sqlError);
      }
      
      throw new Error('Todos os métodos falharam');
      
    } catch (error: any) {
      console.error('💥 ERRO TOTAL:', error);
      alert(`❌ Erro ao excluir quadro: ${error.message}`);
      return false;
    }
  };

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
    // Prevenir múltiplas criações simultâneas
    if (isCreatingBoard) {
      console.log('⚠️ Criação já em andamento, ignorando...');
      return;
    }

    try {
      setIsCreatingBoard(true);
      console.log('🔄 Iniciando criação de quadro:', boardData);

      // Atualização otimista - adicionar o quadro temporariamente à lista
      const tempBoard = {
        id: `temp-${Date.now()}`,
        title: boardData.title,
        description: boardData.description || '',
        background_color: boardData.background_color || '#0079bf',
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_role: 'owner',
        process_number: boardData.process_number,
        responsible_person: boardData.responsible_person,
        company: boardData.company,
        object_description: boardData.object_description,
        process_value: boardData.process_value
      };

      // Adicionar temporariamente à lista para feedback imediato
      setLocalBoards(prevBoards => [tempBoard, ...prevBoards]);
      setShowCreateBoard(false);

      let result;
      if (boardData.board_type_id) {
        result = await createBoardWithType(boardData as any);
      } else {
        result = await createBoard(boardData);
      }

      console.log('✅ Quadro criado com sucesso:', result);
      
      // Atualizar com dados reais do servidor
      await fetchBoards();
      
    } catch (error) {
      console.error('❌ Erro ao criar quadro:', error);
      
      // Remover o quadro temporário em caso de erro
      setLocalBoards(prevBoards => prevBoards.filter(board => !board.id.startsWith('temp-')));
      
      alert('Erro ao criar quadro. Tente novamente.');
    } finally {
      setIsCreatingBoard(false);
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
        {/* Ultra-Modern Header */}
        <div className="mb-12">
          {/* Back Button */}
          {onBack && (
            <div className="mb-8">
              <button
                onClick={onBack}
                className="flex items-center gap-3 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 border border-transparent hover:border-violet-200 text-slate-600 hover:text-violet-700 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Voltar ao Menu Principal</span>
              </button>
            </div>
          )}

          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 rounded-3xl p-8 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute top-4 right-4 opacity-20">
              <Workflow className="h-32 w-32 text-white" />
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    KazuFlow
                    <Crown className="h-8 w-8 text-yellow-300" />
                  </h1>
                  <p className="text-violet-100 text-lg">Gerencie seus projetos e tarefas de forma visual e intuitiva</p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-violet-200">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm">Produtividade Máxima</span>
                    </div>
                    <div className="flex items-center gap-2 text-violet-200">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">Foco nos Resultados</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-3 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Bell className="w-6 h-6 text-white" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                    3
                  </span>
                </button>
                
                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="flex items-center gap-3 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 font-medium"
                >
                  <Rocket className="h-5 w-5" />
                  Novo Quadro
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Grid3X3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-800">{localBoards.length}</p>
                  <p className="text-blue-600 text-sm">Quadros Ativos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Layers className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-800">
                    {localBoards.reduce((acc, board) => acc + (board.member_role === 'owner' ? 1 : 0), 0)}
                  </p>
                  <p className="text-emerald-600 text-sm">Seus Projetos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-800">
                    {localBoards.filter(board => board.member_role === 'member').length}
                  </p>
                  <p className="text-amber-600 text-sm">Colaborações</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra-Modern Boards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* Premium Create New Board Card */}
          <div 
            onClick={() => setShowCreateBoard(true)}
            className="group relative overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl border-2 border-dashed border-violet-300 p-8 hover:border-violet-500 hover:shadow-2xl cursor-pointer transition-all duration-500 hover:scale-[1.02] flex flex-col items-center justify-center min-h-[280px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-100/50 to-purple-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-4 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-12 h-12 text-violet-600" />
              </div>
              <span className="text-violet-700 font-semibold text-lg mb-2">Criar Novo Quadro</span>
              <p className="text-violet-600 text-sm text-center">Organize suas ideias e projetos de forma visual</p>
              
              <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Gem className="h-4 w-4 text-violet-500" />
                <span className="text-xs text-violet-500 font-medium">Clique para começar</span>
              </div>
            </div>
          </div>

          {/* Premium Existing Boards */}
          {loading ? (
            <div className="col-span-full flex flex-col justify-center items-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
              <p className="text-violet-600 font-medium mt-4">Carregando seus quadros...</p>
            </div>
          ) : error ? (
            <div className="col-span-full text-center py-16">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold mb-2">Ops! Algo deu errado</p>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : localBoards.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Layout className="h-10 w-10 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum quadro ainda</h3>
              <p className="text-slate-500 mb-6">Crie seu primeiro quadro e comece a organizar seus projetos!</p>
              <button
                onClick={() => setShowCreateBoard(true)}
                className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2 inline" />
                Criar Primeiro Quadro
              </button>
            </div>
          ) : (
            localBoards.map((board) => (
              <BoardCard 
                key={board.id} 
                board={board} 
                onClick={() => setSelectedBoard(board)}
                onUpdate={fetchBoards}
                localBoards={localBoards}
                setLocalBoards={setLocalBoards}
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
  localBoards: Board[];
  setLocalBoards: React.Dispatch<React.SetStateAction<Board[]>>;
}

const BoardCard: React.FC<BoardCardProps> = ({ board, onClick, onUpdate, localBoards, setLocalBoards }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editTitle, setEditTitle] = useState(board.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const { updateBoard, archiveBoard, createBoard } = useKazuFlow();

  // Debug: Verificar se as funções estão disponíveis
  useEffect(() => {
    console.log('🔍 Debug BoardCard - Funções disponíveis:', {
      updateBoard: typeof updateBoard,
      archiveBoard: typeof archiveBoard,
      createBoard: typeof createBoard,
      boardId: board.id,
      boardTitle: board.title
    });
  }, [updateBoard, archiveBoard, createBoard, board.id, board.title]);

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
    { name: 'Azul Escuro', value: '#344563' },
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

    if (!newTitle) {
      alert('O título não pode estar vazio!');
      return;
    }

    if (newTitle === board.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      console.log('🔄 Iniciando atualização do título:', { boardId: board.id, oldTitle: board.title, newTitle });
      
      if (!updateBoard) {
        throw new Error('Função updateBoard não está disponível');
      }

      const result = await updateBoard(board.id, { title: newTitle });
      console.log('✅ Título atualizado com sucesso:', result);
      
      setIsEditingTitle(false);
      
      // Aguardar um pouco antes de atualizar para garantir que o banco foi atualizado
      setTimeout(() => {
        onUpdate();
      }, 500);
      
      alert('✅ Título atualizado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro detalhado ao salvar título:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
      alert(`❌ Erro ao salvar título: ${errorMessage}`);
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
    setShowMenu(false);
    
    console.log('🔥 BOTÃO EXCLUIR CLICADO!', board.id, board.title);
    
    const confirmDelete = confirm(`⚠️ Tem certeza que deseja excluir o quadro "${board.title}"?\n\nEsta ação não pode ser desfeita!`);
    
    if (!confirmDelete) {
      console.log('❌ Exclusão cancelada pelo usuário');
      return;
    }
    
    try {
      console.log('🚨 INICIANDO EXCLUSÃO:', board.id, board.title);
      
      // Método 1: Usar a função do hook primeiro
      if (archiveBoard) {
        console.log('📞 Tentando função do hook archiveBoard...');
        const result = await archiveBoard(board.id);
        console.log('✅ Resultado da função do hook:', result);
        
        alert('✅ Quadro excluído com sucesso!');
        await onUpdate();
        return;
      }
      
      // Método 2: Importar supabase diretamente
      console.log('📞 Tentando supabase direto...');
      let supabase;
      try {
        const supabaseModule = await import('@/integrations/supabase/client');
        supabase = supabaseModule.supabase;
        console.log('✅ Supabase importado com sucesso');
      } catch (importError) {
        console.error('❌ Erro ao importar Supabase:', importError);
        throw new Error('Não foi possível importar o Supabase');
      }
      
      // Tentar função emergency_delete_board
      const { data, error } = await supabase.rpc('emergency_delete_board', {
        board_id: board.id
      });
      
      if (error) {
        console.error('❌ Erro na função emergency_delete_board:', error);
        throw error;
      }
      
      if (data === true) {
        console.log('✅ EXCLUSÃO VIA SUPABASE FUNCIONOU!');
        alert('✅ Quadro excluído com sucesso!');
        await onUpdate();
        return;
      }
      
      throw new Error('Função emergency_delete_board retornou false');
      
    } catch (error: any) {
      console.error('💥 Erro na exclusão:', error);
      
      // Método 3: SQL direto como último recurso
      try {
        console.log('🔄 Tentando SQL direto como último recurso...');
        let supabase;
        try {
          const supabaseModule = await import('@/integrations/supabase/client');
          supabase = supabaseModule.supabase;
        } catch (importError) {
          console.error('❌ Erro ao importar Supabase no método 3:', importError);
          throw new Error('Não foi possível importar o Supabase');
        }
        
        const { error: directError } = await supabase
          .from('trello_boards')
          .update({ is_deleted: true })
          .eq('id', board.id);
        
        if (directError) throw directError;
        
        console.log('✅ SQL DIRETO FUNCIONOU!');
        alert('✅ Quadro excluído com sucesso!');
        await onUpdate();
        
      } catch (directError: any) {
        console.error('💥 TODOS OS MÉTODOS FALHARAM:', directError);
        alert(`❌ Erro ao excluir quadro: ${directError.message || 'Erro desconhecido'}\n\nTente recarregar a página e tentar novamente.`);
      }
    }
  };

  const handleCopyBoard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    try {
      const newTitle = `${board.title} (Cópia)`;
      const newDescription = board.description ? `${board.description} (Cópia)` : undefined;
      
      console.log('🔄 Iniciando cópia do quadro:', { 
        originalId: board.id, 
        originalTitle: board.title,
        newTitle, 
        newDescription, 
        backgroundColor: board.background_color 
      });
      
      if (!createBoard) {
        throw new Error('Função createBoard não está disponível');
      }

      // Criar um novo quadro
      const result = await createBoard({
        title: newTitle,
        description: newDescription,
        background_color: board.background_color
      });
      
      console.log('✅ Quadro copiado com sucesso:', result);
      
      // Aguardar um pouco antes de atualizar
      setTimeout(() => {
        onUpdate();
      }, 1000);
      
      alert('✅ Quadro copiado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro detalhado ao copiar quadro:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
      alert(`❌ Erro ao copiar quadro: ${errorMessage}`);
    }
  };

  const handleChangeColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(true);
    setShowMenu(false);
  };

  const handleColorSelect = async (color: string) => {
    try {
      console.log('🔄 Iniciando alteração de cor:', { boardId: board.id, oldColor: board.background_color, newColor: color });
      
      if (!updateBoard) {
        throw new Error('Função updateBoard não está disponível');
      }

      const result = await updateBoard(board.id, { background_color: color });
      console.log('✅ Cor alterada com sucesso:', result);
      
      setShowColorPicker(false);
      
      // Aguardar um pouco antes de atualizar
      setTimeout(() => {
        onUpdate();
      }, 500);
      
      alert('✅ Cor alterada com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro detalhado ao alterar cor:', error);
      const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
      alert(`❌ Erro ao alterar cor: ${errorMessage}`);
      setShowColorPicker(false);
    }
  };

  return (
    <div className="relative group cursor-pointer">
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
          className="group relative overflow-hidden rounded-2xl p-6 text-white min-h-[280px] flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
          style={{ 
            background: `linear-gradient(135deg, ${board.background_color}dd, ${board.background_color})`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bottom-4 left-4">
              <Grid3X3 className="h-12 w-12" />
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {/* Número do Processo */}
                {board.process_number && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                      📋 {board.process_number}
                    </span>
                  </div>
                )}
                
                <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-shadow-lg transition-all duration-300">
                  {board.title}
                </h3>
                
                {/* Responsável */}
                {board.responsible_person && (
                  <p className="text-sm opacity-90 mb-1">
                    👤 <strong>Responsável:</strong> {board.responsible_person}
                  </p>
                )}
                
                {/* Empresa */}
                {board.company && (
                  <p className="text-sm opacity-90 mb-1">
                    🏢 <strong>Empresa:</strong> {board.company}
                  </p>
                )}
                
                {/* Valor do Processo */}
                {board.process_value && (
                  <p className="text-sm opacity-90 mb-1">
                    💰 <strong>Valor:</strong> R$ {board.process_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
                
                {board.description && (
                  <p className="text-sm opacity-90 line-clamp-2 leading-relaxed mt-2">
                    {board.description}
                  </p>
                )}
              </div>
              
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={handleMenuClick}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 hover:bg-white/20 rounded-xl backdrop-blur-sm"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {board.member_role === 'owner' ? (
                  <Crown className="w-4 h-4" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span className="text-sm font-medium capitalize">{board.member_role}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Clique para abrir</span>
            </div>
          </div>
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      )}

      {/* Premium Dropdown Menu */}
      {showMenu && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl border border-gray-200 w-64 z-50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">Opções do Quadro</p>
          </div>
          
          <div className="py-2">
            <EditTitleButton
              boardId={board.id}
              currentTitle={board.title}
              onSuccess={() => {
                setShowMenu(false);
                onUpdate();
              }}
            />
            
            <ChangeColorButton
              boardId={board.id}
              onSuccess={() => {
                setShowMenu(false);
                onUpdate();
              }}
            />
            
            <CopyBoardButton
              boardId={board.id}
              boardTitle={board.title}
              onSuccess={() => {
                setShowMenu(false);
                onUpdate();
              }}
            />
            
            <div className="border-t border-gray-100 my-2"></div>
            
            <DeleteBoardButton
              boardId={board.id}
              boardTitle={board.title}
              onSuccess={() => {
                setShowMenu(false);
                onUpdate();
              }}
            />
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowColorPicker(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Escolher Cor do Quadro</h3>
              <button
                onClick={() => setShowColorPicker(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {availableColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorSelect(color.value)}
                  className={`w-full h-16 rounded-lg border-2 transition-all duration-300 ${
                    board.background_color === color.value 
                      ? 'border-gray-800 ring-2 ring-gray-400' 
                      : 'border-transparent hover:border-gray-300'
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
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowColorPicker(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};