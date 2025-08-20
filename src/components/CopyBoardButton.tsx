import React from 'react';
import { Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CopyBoardButtonProps {
  boardId: string;
  boardTitle: string;
  onSuccess: () => void;
}

export const CopyBoardButton: React.FC<CopyBoardButtonProps> = ({ 
  boardId, 
  boardTitle, 
  onSuccess 
}) => {
  
  const handleCopyBoard = async () => {
    
    const newTitle = `${boardTitle} (Cópia)`;
    
    const confirmCopy = confirm(`Copiar quadro "${boardTitle}"?\n\nNovo título: "${newTitle}"`);
    
    if (!confirmCopy) {
      console.log('❌ Cópia cancelada');
      return;
    }
    
    try {
      console.log('🔄 Copiando quadro...');
      
      const { data, error } = await supabase.rpc('copy_board', {
        source_board_id: boardId,
        new_title: newTitle
      });
      
      if (error) {
        console.error('❌ Erro na RPC:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ QUADRO COPIADO COM SUCESSO!', data);
        alert('✅ Quadro copiado com sucesso!');
        onSuccess();
        return;
      }
      
      throw new Error('RPC retornou null');
      
    } catch (error: any) {
      console.error('💥 Erro ao copiar quadro:', error);
      alert(`❌ Erro ao copiar quadro: ${error.message}`);
    }
  };
  
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCopyBoard();
      }}
      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
    >
      <div className="p-1 bg-green-100 rounded-lg">
        <Copy className="w-4 h-4 text-green-600" />
      </div>
      <span className="font-medium">Copiar Quadro</span>
    </button>
  );
};