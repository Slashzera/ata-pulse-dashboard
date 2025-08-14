import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, Paperclip, CheckSquare, MessageSquare, Plus, Edit2, Trash2, Save, ArrowRight } from 'lucide-react';
import { useKazuFlow } from '@/hooks/useKazuFlow';
import { DatePicker } from './DatePicker';
import { LabelManager } from './LabelManager';
import { CardMoveDialog } from './CardMoveDialog';

interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  due_date?: string;
  created_by: string;
}

interface CardDetailModalProps {
  card: Card;
  boardId: string;
  listId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, boardId, listId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showCreateChecklist, setShowCreateChecklist] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<{[key: string]: string}>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [cardLabels, setCardLabels] = useState<any[]>([]);

  const { 
    updateCardDescription, 
    updateCardTitle, 
    getCardDetails, 
    createChecklist,
    addChecklistItem,
    toggleChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    deleteChecklist,
    archiveCard,
    setCardDueDate,
    getBoardLabels,
    loading 
  } = useKazuFlow();

  useEffect(() => {
    loadCardDetails();
    loadCardLabels();
  }, [card.id]);

  const loadCardLabels = async () => {
    try {
      // Buscar etiquetas do cartão através das relações
      // Por enquanto, usar array vazio até implementar a busca completa
      setCardLabels([]);
    } catch (error) {
      console.error('Erro ao carregar etiquetas do cartão:', error);
    }
  };

  const loadCardDetails = async () => {
    try {
      const details = await getCardDetails(card.id);
      setCardDetails(details);
    } catch (error) {
      console.error('Erro ao carregar detalhes do cartão:', error);
    }
  };

  const handleSaveTitle = async () => {
    if (title.trim() && title !== card.title) {
      try {
        await updateCardTitle(card.id, title.trim());
        setIsEditingTitle(false);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Erro ao salvar título:', error);
        setTitle(card.title);
      }
    } else {
      setIsEditingTitle(false);
      setTitle(card.title);
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateCardDescription(card.id, description);
      setIsEditingDescription(false);
      if (onUpdate) onUpdate();
      loadCardDetails();
    } catch (error) {
      console.error('Erro ao salvar descrição:', error);
    }
  };

  const handleCreateChecklist = async () => {
    if (newChecklistTitle.trim()) {
      try {
        await createChecklist(card.id, newChecklistTitle.trim());
        setNewChecklistTitle('');
        setShowCreateChecklist(false);
        loadCardDetails();
      } catch (error) {
        console.error('Erro ao criar checklist:', error);
      }
    }
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const text = newItemTexts[checklistId];
    if (text && text.trim()) {
      try {
        await addChecklistItem(checklistId, text.trim());
        setNewItemTexts(prev => ({ ...prev, [checklistId]: '' }));
        loadCardDetails();
      } catch (error) {
        console.error('Erro ao adicionar item:', error);
      }
    }
  };

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    try {
      await toggleChecklistItem(itemId, isCompleted);
      loadCardDetails();
    } catch (error) {
      console.error('Erro ao alterar item:', error);
    }
  };

  const handleEditItem = (itemId: string, currentText: string) => {
    setEditingItemId(itemId);
    setEditingItemText(currentText);
  };

  const handleSaveEditItem = async () => {
    if (editingItemId && editingItemText.trim()) {
      try {
        await updateChecklistItem(editingItemId, editingItemText.trim());
        setEditingItemId(null);
        setEditingItemText('');
        loadCardDetails();
      } catch (error) {
        console.error('Erro ao editar item:', error);
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteChecklistItem(itemId);
        loadCardDetails();
      } catch (error) {
        console.error('Erro ao excluir item:', error);
      }
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    if (confirm('Tem certeza que deseja excluir este checklist?')) {
      try {
        await deleteChecklist(checklistId);
        loadCardDetails();
      } catch (error) {
        console.error('Erro ao excluir checklist:', error);
      }
    }
  };

  const handleArchiveCard = async () => {
    if (confirm('Tem certeza que deseja arquivar este cartão?')) {
      try {
        await archiveCard(card.id);
        if (onUpdate) onUpdate();
        onClose();
      } catch (error) {
        console.error('Erro ao arquivar cartão:', error);
      }
    }
  };

  const handleSetDueDate = async (date: string) => {
    try {
      await setCardDueDate(card.id, date);
      if (onUpdate) onUpdate();
      loadCardDetails();
    } catch (error) {
      console.error('Erro ao definir data de entrega:', error);
    }
  };

  const checklists = cardDetails?.checklists || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <CheckSquare className="w-6 h-6 text-gray-600" />
            <div>
              {isEditingTitle ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') {
                        setTitle(card.title);
                        setIsEditingTitle(false);
                      }
                    }}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </h2>
              )}
              <p className="text-sm text-gray-600">na lista "A fazer"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Tabs */}
            <div className="flex space-x-4 mb-6 border-b">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2 px-1 border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Detalhes
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-2 px-1 border-b-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Atividade
              </button>
            </div>

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Descrição</h3>
                  </div>
                  {isEditingDescription ? (
                    <div>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Adicione uma descrição mais detalhada..."
                        autoFocus
                      />
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={handleSaveDescription}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={() => {
                            setDescription(card.description || '');
                            setIsEditingDescription(false);
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setIsEditingDescription(true)}
                      className="min-h-[60px] p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {description ? (
                        <p className="text-gray-800 whitespace-pre-wrap">{description}</p>
                      ) : (
                        <p className="text-gray-500 italic">Adicionar uma descrição mais detalhada...</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Checklists */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-800">Checklists</h3>
                    </div>
                    <button 
                      onClick={() => setShowCreateChecklist(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Adicionar checklist
                    </button>
                  </div>
                  
                  {/* Create Checklist Form */}
                  {showCreateChecklist && (
                    <div className="bg-gray-50 rounded-md p-3 mb-4">
                      <input
                        type="text"
                        value={newChecklistTitle}
                        onChange={(e) => setNewChecklistTitle(e.target.value)}
                        placeholder="Título do checklist"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateChecklist();
                          if (e.key === 'Escape') setShowCreateChecklist(false);
                        }}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCreateChecklist}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Criar
                        </button>
                        <button
                          onClick={() => {
                            setShowCreateChecklist(false);
                            setNewChecklistTitle('');
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Existing Checklists */}
                  {checklists.map((checklist: any) => {
                    const completedItems = checklist.items?.filter((item: any) => item.is_completed).length || 0;
                    const totalItems = checklist.items?.length || 0;
                    
                    return (
                      <div key={checklist.id} className="bg-gray-50 rounded-md p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-800">{checklist.title}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{completedItems}/{totalItems}</span>
                            <button
                              onClick={() => handleDeleteChecklist(checklist.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {totalItems > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${(completedItems / totalItems) * 100}%` }}
                            ></div>
                          </div>
                        )}
                        
                        {/* Checklist Items */}
                        <div className="space-y-2">
                          {checklist.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-2 group">
                              <input 
                                type="checkbox" 
                                checked={item.is_completed}
                                onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                                className="rounded" 
                              />
                              {editingItemId === item.id ? (
                                <div className="flex-1 flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editingItemText}
                                    onChange={(e) => setEditingItemText(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditItem();
                                      if (e.key === 'Escape') {
                                        setEditingItemId(null);
                                        setEditingItemText('');
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleSaveEditItem}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  className={`flex-1 text-gray-800 ${item.is_completed ? 'line-through text-gray-500' : ''}`}
                                >
                                  {item.text}
                                </span>
                              )}
                              <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                                <button
                                  onClick={() => handleEditItem(item.id, item.text)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add New Item */}
                          <div className="flex items-center space-x-2 mt-2">
                            <input
                              type="text"
                              value={newItemTexts[checklist.id] || ''}
                              onChange={(e) => setNewItemTexts(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                              placeholder="Adicionar item"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddChecklistItem(checklist.id);
                              }}
                            />
                            <button
                              onClick={() => handleAddChecklistItem(checklist.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {checklists.length === 0 && !showCreateChecklist && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum checklist criado ainda</p>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-800">Anexos</h3>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Adicionar anexo
                    </button>
                  </div>
                  
                  <div className="text-center py-8 text-gray-500">
                    <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum anexo adicionado ainda</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    U
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">Usuário</span> criou este cartão
                      </p>
                      <p className="text-xs text-gray-600 mt-1">há 2 horas</p>
                    </div>
                  </div>
                </div>

                {/* Add comment */}
                <div className="flex items-start space-x-3 mt-6">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    U
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Escrever um comentário..."
                    />
                    <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      Comentar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64 bg-gray-50 p-6 border-l">
            <h3 className="font-semibold text-gray-800 mb-4">Ações</h3>
            
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Membros</span>
              </button>
              
              <button 
                onClick={() => setShowLabelManager(true)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center space-x-2"
              >
                <Tag className="w-4 h-4" />
                <span>Etiquetas</span>
              </button>
              
              <button 
                onClick={() => setShowDatePicker(true)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Data de entrega</span>
              </button>
              
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center space-x-2">
                <Paperclip className="w-4 h-4" />
                <span>Anexo</span>
              </button>
              
              <button 
                onClick={() => setShowCreateChecklist(true)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center space-x-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Checklist</span>
              </button>
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <button 
                onClick={() => setShowMoveDialog(true)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded flex items-center space-x-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Mover</span>
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded">
                Copiar
              </button>
              <button 
                onClick={handleArchiveCard}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Arquivar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePicker
          value={card.due_date}
          onChange={handleSetDueDate}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* Label Manager Modal */}
      {showLabelManager && (
        <LabelManager
          cardId={card.id}
          boardId={boardId}
          currentLabels={cardLabels}
          onClose={() => setShowLabelManager(false)}
          onUpdate={() => {
            if (onUpdate) onUpdate();
            loadCardLabels();
          }}
        />
      )}

      {/* Move Card Modal */}
      {showMoveDialog && (
        <CardMoveDialog
          cardId={card.id}
          currentListId={listId}
          currentBoardId={boardId}
          onClose={() => setShowMoveDialog(false)}
          onUpdate={() => {
            if (onUpdate) onUpdate();
            onClose(); // Fechar o modal do cartão após mover
          }}
        />
      )}
    </div>
  );
};