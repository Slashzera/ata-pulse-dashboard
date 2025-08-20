// 🔧 COMPONENTE BOARDCARD SIMPLIFICADO - EXCLUSÃO GARANTIDA

import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Crown, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Board {
  id: string;
  title: string;
  description?: string;
  background_color: string;
  member_role: string;
  process_number?: string;
  responsible_person?: string;
  company?: string;
  process_value?: number;
}

interface SimpleBoardCardProps {
  board: Board;
  onClick: () => void;
  onUpdate: () => void;
}

export const SimpleBoardCard: React.FC<SimpleBoardCardProps> = ({ board, onClick, onUpdate }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função de exclusão super simples e robusta
  const handleDelete = async () => {
    console.log('🚨 INICIANDO EXCLUSÃO:', board.id, board.title);
    
    // Confirmação
    const confirmDelete = confirm(
      `⚠️ Tem certeza que deseja excluir o quadro "${board.title}"?\n\n` +
      `Esta ação não pode ser desfeita!`
    );
    
    if (!confirmDelete) {
      console.log('❌ Exclusão cancelada');
      return;
    }
    
    setIsDeleting(true);
    setShowMenu(false);
    
    try {
      console.log('📞 Chamando emergency_delete_board...');
      
      // Método 1: Função principal
      const { data, error } = await supabase.rpc('emergency_delete_board', {
        board_id: board.id
      });
      
      if (error) {
        console.error('❌ Erro na função principal:', error);
        throw error;
      }
      
      if (data === true) {
        console.log('✅ EXCLUSÃO FUNCIONOU!');
        alert('✅ Quadro excluído com sucesso!');
        
        // Atualizar lista
        await onUpdate();
        return;
      }
      
      throw new Error('Função retornou false');
      
    } catch (error) {
      console.error('💥 Erro na exclusão:', error);
      
      // Método 2: SQL direto
      try {
        console.log('🔄 Tentando SQL direto...');
        
        const { error: directError } = await supabase
          .from('trello_boards')
          .update({ is_deleted: true })
          .eq('id', board.id);
        
        if (directError) throw directError;
        
        console.log('✅ SQL DIRETO FUNCIONOU!');
        alert('✅ Quadro excluído com sucesso!');
        
        // Atualizar lista
        await onUpdate();
        
      } catch (directError) {
        console.error('💥 SQL direto falhou:', directError);
        alert(`❌ Erro ao excluir quadro: ${directError.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl p-6 text-white min-h-[280px] flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
         style={{ background: `linear-gradient(135deg, ${board.background_color}dd, ${board.background_color})` }}
         onClick={onClick}>
      
      {/* Conteúdo do Card */}
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
            
            <h3 className="font-bold text-xl mb-2 line-clamp-2">
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
            
            {/* Valor */}
            {board.process_value && (
              <p className="text-sm opacity-90 mb-1">
                💰 <strong>Valor:</strong> R$ {board.process_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          
          {/* Menu de 3 pontos */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 hover:bg-white/20 rounded-xl backdrop-blur-sm"
              disabled={isDeleting}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {/* Menu Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-lg w-64 z-50">
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-700">Opções do Quadro</p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <div className="p-1 bg-red-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-medium">
                    {isDeleting ? 'Excluindo...' : 'Excluir Quadro'}
                  </span>
                </button>
              </div>
            )}
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
      
      {/* Loading Overlay */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-2xl">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
            <p className="text-sm">Excluindo quadro...</p>
          </div>
        </div>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

// INSTRUÇÕES DE USO:
// 1. Substitua o componente BoardCard atual por este SimpleBoardCard
// 2. Importe: import { SimpleBoardCard } from './SimpleBoardCard';
// 3. Use: <SimpleBoardCard board={board} onClick={onClick} onUpdate={onUpdate} />

// CARACTERÍSTICAS:
// ✅ Botão de exclusão sempre visível nos 3 pontos
// ✅ Confirmação de segurança
// ✅ 2 métodos de exclusão com fallback
// ✅ Loading visual durante exclusão
// ✅ Feedback de sucesso/erro
// ✅ Atualização automática da lista