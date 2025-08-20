import React from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DeleteBoardButtonProps {
  boardId: string;
  boardTitle: string;
  onSuccess: () => void;
}

export const DeleteBoardButton: React.FC<DeleteBoardButtonProps> = ({
  boardId,
  boardTitle,
  onSuccess
}) => {

  const handleDelete = async () => {
    console.log('🚨 BOTÃO DELETE CLICADO!', boardId, boardTitle);

    const confirmDelete = confirm(
      `⚠️ Tem certeza que deseja excluir o quadro "${boardTitle}"?\n\n` +
      `Esta ação não pode ser desfeita!`
    );

    if (!confirmDelete) {
      console.log('❌ Exclusão cancelada');
      return;
    }

    try {
      console.log('🔄 Iniciando exclusão...');

      // Método 1: Tentar emergency_delete_board
      console.log('📞 Tentando emergency_delete_board...');
      const { data, error } = await supabase.rpc('emergency_delete_board', {
        board_id: boardId
      });

      if (error) {
        console.error('❌ Erro na RPC:', error);
        throw error;
      }

      if (data === true) {
        console.log('✅ RPC FUNCIONOU!');
        alert('✅ Quadro excluído com sucesso!');
        onSuccess();
        return;
      }

      throw new Error('RPC retornou false');

    } catch (error: any) {
      console.error('💥 Erro na exclusão:', error);

      // Método 2: SQL direto
      try {
        console.log('🔄 Tentando SQL direto...');

        const { error: sqlError } = await supabase
          .from('trello_boards')
          .update({ is_deleted: true })
          .eq('id', boardId);

        if (sqlError) throw sqlError;

        console.log('✅ SQL DIRETO FUNCIONOU!');
        alert('✅ Quadro excluído com sucesso!');
        onSuccess();

      } catch (sqlError: any) {
        console.error('💥 SQL direto falhou:', sqlError);
        alert(`❌ Erro ao excluir quadro: ${sqlError.message}`);
      }
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      }}
      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors"
    >
      <div className="p-1 bg-red-100 rounded-lg">
        <Trash2 className="w-4 h-4 text-red-600" />
      </div>
      <span className="font-medium">🗑️ Excluir Quadro</span>
    </button>
  );
};