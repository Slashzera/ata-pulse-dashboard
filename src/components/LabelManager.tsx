import React, { useState, useEffect } from 'react';
import { Tag, X, Plus, Edit2, Trash2 } from 'lucide-react';
import { useKazuFlow } from '@/hooks/useKazuFlow';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelManagerProps {
  cardId: string;
  boardId: string;
  currentLabels: Label[];
  onClose: () => void;
  onUpdate: () => void;
}

const LABEL_COLORS = [
  '#61bd4f', // Verde
  '#f2d600', // Amarelo
  '#ff9f1a', // Laranja
  '#eb5a46', // Vermelho
  '#c377e0', // Roxo
  '#0079bf', // Azul
  '#00c2e0', // Azul claro
  '#51e898', // Verde claro
  '#ff78cb', // Rosa
  '#344563'  // Cinza
];

export const LabelManager: React.FC<LabelManagerProps> = ({ 
  cardId, 
  boardId, 
  currentLabels, 
  onClose, 
  onUpdate 
}) => {
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    currentLabels.map(l => l.id)
  );
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  const { 
    getBoardLabels, 
    createLabel, 
    updateLabel, 
    deleteLabel, 
    manageCardLabels,
    loading 
  } = useKazuFlow();

  useEffect(() => {
    loadBoardLabels();
  }, [boardId]);

  const loadBoardLabels = async () => {
    try {
      const labels = await getBoardLabels(boardId);
      setBoardLabels(labels || []);
    } catch (error) {
      console.error('Erro ao carregar etiquetas:', error);
    }
  };

  const handleCreateLabel = async () => {
    if (newLabelName.trim()) {
      try {
        await createLabel(boardId, newLabelName.trim(), newLabelColor);
        setNewLabelName('');
        setShowCreateLabel(false);
        loadBoardLabels();
      } catch (error) {
        console.error('Erro ao criar etiqueta:', error);
      }
    }
  };

  const handleUpdateLabel = async () => {
    if (editingLabel && newLabelName.trim()) {
      try {
        await updateLabel(editingLabel.id, newLabelName.trim(), newLabelColor);
        setEditingLabel(null);
        setNewLabelName('');
        loadBoardLabels();
      } catch (error) {
        console.error('Erro ao atualizar etiqueta:', error);
      }
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (confirm('Tem certeza que deseja excluir esta etiqueta?')) {
      try {
        await deleteLabel(labelId);
        setSelectedLabels(prev => prev.filter(id => id !== labelId));
        loadBoardLabels();
      } catch (error) {
        console.error('Erro ao excluir etiqueta:', error);
      }
    }
  };

  const handleToggleLabel = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSave = async () => {
    try {
      await manageCardLabels(cardId, selectedLabels);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar etiquetas:', error);
    }
  };

  const startEdit = (label: Label) => {
    setEditingLabel(label);
    setNewLabelName(label.name);
    setNewLabelColor(label.color);
    setShowCreateLabel(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Etiquetas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Etiquetas do Quadro */}
          <div className="space-y-2 mb-4">
            {boardLabels.map((label) => (
              <div
                key={label.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all ${
                  selectedLabels.includes(label.id) 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleToggleLabel(label.id)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-4 rounded-sm"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="font-medium text-gray-800">{label.name}</span>
                  {selectedLabels.includes(label.id) && (
                    <span className="text-blue-600 text-sm">✓</span>
                  )}
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(label);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLabel(label.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Criar Nova Etiqueta */}
          {showCreateLabel ? (
            <div className="bg-gray-50 rounded-md p-3 space-y-3">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Nome da etiqueta"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {LABEL_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        newLabelColor === color 
                          ? 'border-gray-800 scale-110' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={editingLabel ? handleUpdateLabel : handleCreateLabel}
                  disabled={!newLabelName.trim() || loading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {editingLabel ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateLabel(false);
                    setEditingLabel(null);
                    setNewLabelName('');
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateLabel(true)}
              className="w-full flex items-center justify-center space-x-2 p-2 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors"
            >
              <Plus className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">Criar nova etiqueta</span>
            </button>
          )}

          {boardLabels.length === 0 && !showCreateLabel && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma etiqueta criada ainda</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};