import React from 'react';
import { Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EditTitleButtonProps {
  boardId: string;
  currentTitle: string;
  onSuccess: () => void;
}

export const EditTitleButton: React.FC<EditTitleButtonProps> = ({ 
  boardId, 
  currentTitle, 
  onSuccess 
}) => {
  
  const handleEditTitle = async () => {
    
    const newTitle = prompt('Digite o novo título:', currentTitle);
    
    if (!newTitle || newTitle.trim() === '' || newTitle === currentTitle) {
      console.log('❌ Título cancelado ou igual');
      return;
    }
    
    try {
      console.log('🔄 Editando título...');
      
      const { data, error } = await supabase.rpc('update_board_title', {
        board_id: boardId,
        new_title: newTitle.trim()
      });
      
      if (error) {
        console.error('❌ Erro na RPC:', error);
        throw error;
      }
      
      if (data === true) {
        console.log('✅ TÍTULO EDITADO COM SUCESSO!');
        alert('✅ Título atualizado com sucesso!');
        onSuccess();
        return;
      }
      
      throw new Error('RPC retornou false');
      
    } catch (error: any) {
      console.error('💥 Erro ao editar título:', error);
      alert(`❌ Erro ao editar título: ${error.message}`);
    }
  };
  
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleEditTitle();
      }}
      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
    >
      <div className="p-1 bg-blue-100 rounded-lg">
        <Edit2 className="w-4 h-4 text-blue-600" />
      </div>
      <span className="font-medium">Editar Título</span>
    </button>
  );
};