import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChangeColorButtonProps {
  boardId: string;
  onSuccess: () => void;
}

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

export const ChangeColorButton: React.FC<ChangeColorButtonProps> = ({ 
  boardId, 
  onSuccess 
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const handleChangeColor = async (color: string) => {
    
    try {
      console.log('🔄 Alterando cor...');
      
      const { data, error } = await supabase.rpc('update_board_color', {
        board_id: boardId,
        new_color: color
      });
      
      if (error) {
        console.error('❌ Erro na RPC:', error);
        throw error;
      }
      
      if (data === true) {
        console.log('✅ COR ALTERADA COM SUCESSO!');
        alert('✅ Cor alterada com sucesso!');
        setShowColorPicker(false);
        onSuccess();
        return;
      }
      
      throw new Error('RPC retornou false');
      
    } catch (error: any) {
      console.error('💥 Erro ao alterar cor:', error);
      alert(`❌ Erro ao alterar cor: ${error.message}`);
    }
  };
  
  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowColorPicker(true);
        }}
        className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <div className="p-1 bg-purple-100 rounded-lg">
          <Palette className="w-4 h-4 text-purple-600" />
        </div>
        <span className="font-medium">Mudar Cor</span>
      </button>
      
      {showColorPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Escolher Cor</h3>
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
                  onClick={() => handleChangeColor(color.value)}
                  className="w-16 h-16 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};