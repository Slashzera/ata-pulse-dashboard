// 🔧 CORREÇÃO SIMPLES - BOTÃO DE EXCLUSÃO KAZUFLOW

// Adicione este código no final do arquivo KazuFlow.tsx, antes do export

// Função de exclusão simplificada
const handleDeleteBoard = async (boardId: string, boardTitle: string) => {
  console.log('🚨 TENTANDO EXCLUIR QUADRO:', { boardId, boardTitle });
  
  // Confirmação
  const confirmDelete = confirm(
    `⚠️ Tem certeza que deseja excluir o quadro "${boardTitle}"?\n\n` +
    `Esta ação não pode ser desfeita e irá remover:\n` +
    `- Todas as listas\n` +
    `- Todos os cartões\n` +
    `- Todos os dados do quadro`
  );
  
  if (!confirmDelete) {
    console.log('❌ Exclusão cancelada pelo usuário');
    return;
  }
  
  try {
    console.log('🔄 Iniciando exclusão...');
    
    // Método 1: Tentar função principal
    console.log('📞 Tentando emergency_delete_board...');
    const { data, error } = await supabase.rpc('emergency_delete_board', {
      board_id: boardId
    });
    
    if (error) {
      console.error('❌ Erro na função:', error);
      throw error;
    }
    
    if (data === true) {
      console.log('✅ QUADRO EXCLUÍDO COM SUCESSO!');
      alert('✅ Quadro excluído com sucesso!');
      
      // Recarregar a página para atualizar a lista
      window.location.reload();
      return;
    }
    
    throw new Error('Função retornou false');
    
  } catch (error) {
    console.error('💥 ERRO AO EXCLUIR:', error);
    
    // Tentar método alternativo
    try {
      console.log('🔄 Tentando método alternativo...');
      
      const { error: directError } = await supabase
        .from('trello_boards')
        .update({ is_deleted: true })
        .eq('id', boardId);
      
      if (directError) throw directError;
      
      console.log('✅ EXCLUSÃO ALTERNATIVA FUNCIONOU!');
      alert('✅ Quadro excluído com sucesso!');
      window.location.reload();
      
    } catch (alternativeError) {
      console.error('💥 MÉTODO ALTERNATIVO FALHOU:', alternativeError);
      alert(`❌ Erro ao excluir quadro: ${alternativeError.message}`);
    }
  }
};

// Componente de botão simplificado
const SimpleDeleteButton = ({ board, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className="relative">
      {/* Botão dos 3 pontos */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 hover:bg-white/20 rounded-xl backdrop-blur-sm"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      
      {/* Menu dropdown */}
      {showMenu && (
        <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-lg w-64 z-20">
          <div className="px-4 py-2 border-b border-gray-100 mb-2">
            <p className="text-sm font-medium text-gray-700">Opções do Quadro</p>
          </div>
          
          {/* Botão de exclusão */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              setShowMenu(false);
              await handleDeleteBoard(board.id, board.title);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors"
          >
            <div className="p-1 bg-red-100 rounded-lg">
              <Trash2 className="w-4 h-4 text-red-600" />
            </div>
            <span className="font-medium">Excluir Quadro</span>
          </button>
        </div>
      )}
    </div>
  );
};

// INSTRUÇÕES DE USO:
// 1. Copie a função handleDeleteBoard
// 2. Copie o componente SimpleDeleteButton  
// 3. Substitua o botão atual pelos 3 pontos por este componente
// 4. Importe o supabase se necessário: import { supabase } from '@/integrations/supabase/client';

// EXEMPLO DE USO NO CARD:
/*
<div className="card-header">
  <h3>{board.title}</h3>
  <SimpleDeleteButton board={board} onUpdate={fetchBoards} />
</div>
*/