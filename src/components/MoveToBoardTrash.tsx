import React from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MoveToBoardTrashProps {
  boardId: string;
  boardTitle: string;
  onSuccess: () => void;
}

export const MoveToBoardTrash: React.FC<MoveToBoardTrashProps> = ({ 
  boardId, 
  boardTitle, 
  onSuccess 
}) => {
  
  const handleMoveToTrash = async () => {
    console.log('🗑️ MOVENDO QUADRO PARA LIXEIRA!', boardId, boardTitle);
    
    const confirmDelete = confirm(
      `🗑️ Mover quadro "${boardTitle}" para a lixeira?\n\n` +
      `O quadro poderá ser restaurado posteriormente na seção Lixeira.`
    );
    
    if (!confirmDelete) {
      console.log('❌ Operação cancelada');
      return;
    }
    
    try {
      console.log('🔄 Movendo para lixeira...');
      
      // Método 1: Tentar função de lixeira
      console.log('📞 Tentando move_board_to_trash...');
      const { data, error } = await supabase.rpc('move_board_to_trash', {
        board_id: boardId
      });
      
      if (error) {
        console.error('❌ Erro na RPC lixeira:', error);
        throw error;
      }
      
      if (data === true) {
        console.log('✅ QUADRO MOVIDO PARA LIXEIRA!');
        alert('🗑️ Quadro movido para a lixeira com sucesso!\n\nVocê pode restaurá-lo na seção Lixeira.');
        onSuccess();
        return;
      }
      
      throw new Error('Função move_board_to_trash retornou false');
      
    } catch (error: any) {
      console.error('💥 Erro ao mover para lixeira:', error);
      
      // Método 2: Fallback para exclusão simples
      try {
        console.log('🔄 Tentando exclusão simples como fallback...');
        
        const { error: directError } = await supabase
          .from('trello_boards')
          .update({ is_deleted: true })
          .eq('id', boardId);
        
        if (directError) throw directError;
        
        console.log('✅ EXCLUSÃO SIMPLES FUNCIONOU!');
        alert('✅ Quadro excluído com sucesso!');
        onSuccess();
        
      } catch (directError: any) {
        console.error('💥 Fallback falhou:', directError);
        alert(`❌ Erro ao excluir quadro: ${directError.message}`);
      }
    }
  };
  
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔥 CLIQUE NO BOTÃO LIXEIRA!');
        handleMoveToTrash();
      }}
      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors"
    >
      <div className="p-1 bg-red-100 rounded-lg">
        <Trash2 className="w-4 h-4 text-red-600" />
      </div>
      <span className="font-medium">🗑️ Mover para Lixeira</span>
    </button>
  );
};