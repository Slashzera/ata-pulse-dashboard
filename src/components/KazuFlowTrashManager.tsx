import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrashItem {
  id: string;
  board_title: string;
  board_id: string;
  deleted_at: string;
  item_data: any;
}

interface KazuFlowTrashManagerProps {
  onClose: () => void;
}

export const KazuFlowTrashManager: React.FC<KazuFlowTrashManagerProps> = ({ onClose }) => {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrashItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Buscando itens na lixeira...');
      
      const { data, error } = await supabase.rpc('get_kazuflow_trash_items');
      
      if (error) {
        console.error('❌ Erro ao buscar lixeira:', error);
        throw error;
      }
      
      console.log('✅ Itens da lixeira:', data);
      setTrashItems(data || []);
      
    } catch (err: any) {
      console.error('💥 Erro na lixeira:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (trashId: string, boardTitle: string) => {
    const confirmRestore = confirm(`Restaurar quadro "${boardTitle}"?`);
    
    if (!confirmRestore) return;
    
    try {
      console.log('🔄 Restaurando quadro...', trashId);
      
      const { data, error } = await supabase.rpc('restore_board_from_trash', {
        trash_id: trashId
      });
      
      if (error) throw error;
      
      if (data === true) {
        console.log('✅ Quadro restaurado!');
        alert('✅ Quadro restaurado com sucesso!');
        await fetchTrashItems();
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao restaurar:', error);
      alert(`❌ Erro ao restaurar: ${error.message}`);
    }
  };

  const handlePermanentDelete = async (trashId: string, boardTitle: string) => {
    const confirmDelete = confirm(
      `⚠️ ATENÇÃO: Excluir PERMANENTEMENTE o quadro "${boardTitle}"?\n\n` +
      `Esta ação NÃO PODE ser desfeita!\n\n` +
      `Todos os dados serão perdidos para sempre.`
    );
    
    if (!confirmDelete) return;
    
    // Segunda confirmação para exclusão permanente
    const doubleConfirm = confirm(
      `🚨 ÚLTIMA CONFIRMAÇÃO!\n\n` +
      `Tem ABSOLUTA CERTEZA que deseja excluir permanentemente "${boardTitle}"?\n\n` +
      `Digite "EXCLUIR" para confirmar.`
    );
    
    if (!doubleConfirm) return;
    
    try {
      console.log('🔄 Excluindo permanentemente...', trashId);
      
      const { data, error } = await supabase.rpc('permanently_delete_board', {
        trash_id: trashId
      });
      
      if (error) throw error;
      
      if (data === true) {
        console.log('✅ Quadro excluído permanentemente!');
        alert('🗑️ Quadro excluído permanentemente!');
        await fetchTrashItems();
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao excluir permanentemente:', error);
      alert(`❌ Erro ao excluir: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Lixeira do KazuFlow</h2>
              <p className="text-sm text-gray-600">Gerencie quadros excluídos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Carregando lixeira...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-2">Erro ao carregar lixeira</p>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={fetchTrashItems}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : trashItems.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Lixeira vazia</h3>
              <p className="text-gray-600">Nenhum quadro foi excluído recentemente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trashItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800 mb-1">
                        {item.board_title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Excluído em: {new Date(item.deleted_at).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {item.board_id}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(item.id, item.board_title)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restaurar
                      </button>
                      
                      <button
                        onClick={() => handlePermanentDelete(item.id, item.board_title)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir Permanentemente
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {trashItems.length} {trashItems.length === 1 ? 'item' : 'itens'} na lixeira
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};