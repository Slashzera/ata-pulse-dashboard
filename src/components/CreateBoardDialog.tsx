import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useKazuFlow } from '@/hooks/useKazuFlow';
import CurrencyInput from './CurrencyInput';

interface BoardType {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface CreateBoardDialogProps {
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    description?: string; 
    background_color?: string;
    board_type_id?: string;
    process_number?: string;
    responsible_person?: string;
    company?: string;
    object_description?: string;
    process_value?: number;
  }) => void;
}

const BACKGROUND_COLORS = [
  '#0079bf', // Azul
  '#d29034', // Laranja
  '#519839', // Verde
  '#b04632', // Vermelho
  '#89609e', // Roxo
  '#cd5a91', // Rosa
  '#4bbf6b', // Verde claro
  '#00aecc', // Azul claro
  '#838c91'  // Cinza
];

export const CreateBoardDialog: React.FC<CreateBoardDialogProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(BACKGROUND_COLORS[0]);
  const [boardTypes, setBoardTypes] = useState<BoardType[]>([]);
  const [selectedBoardType, setSelectedBoardType] = useState<string>('');
  const [processNumber, setProcessNumber] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [company, setCompany] = useState('');
  const [objectDescription, setObjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processValue, setProcessValue] = useState<string>('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const { getBoardTypes, loading } = useKazuFlow();

  useEffect(() => {
    loadBoardTypes();
  }, []);

  const loadBoardTypes = async () => {
    try {
      const types = await getBoardTypes();
      setBoardTypes(types || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de processo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiplas submissões
    if (isSubmitting) {
      console.log('⚠️ Submissão já em andamento, ignorando...');
      return;
    }

    if (!title.trim() || !selectedBoardType) {
      alert('Por favor, preencha o título e selecione um tipo de processo.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🔄 Iniciando submissão do formulário...');
      
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        background_color: selectedColor,
        board_type_id: selectedBoardType,
        process_number: processNumber.trim() || undefined,
        responsible_person: responsiblePerson.trim() || undefined,
        company: company.trim() || undefined,
        object_description: objectDescription.trim() || undefined,
        process_value: processValue ? parseFloat(processValue) : undefined
      });
      
      console.log('✅ Formulário submetido com sucesso');
    } catch (error) {
      console.error('❌ Erro na submissão:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = boardTypes.find(type => type.id === selectedBoardType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Cadastrar Novo Processo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Processo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Processo *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                >
                  <span className={selectedType ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedType ? selectedType.name : 'Selecione o tipo'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showTypeDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {boardTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedBoardType(type.id);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="font-medium">{type.name}</span>
                        </div>
                        {type.description && (
                          <p className="text-xs text-gray-500 mt-1 ml-5">{type.description}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="processNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Número do Processo *
              </label>
              <input
                type="text"
                id="processNumber"
                value={processNumber}
                onChange={(e) => setProcessNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PROC-2024-XXX"
                required
              />
            </div>
          </div>

          {/* Responsável e Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-2">
                Responsável *
              </label>
              <input
                type="text"
                id="responsible"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do responsável"
                required
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Selecione uma empresa"
              />
            </div>
          </div>

          {/* Título do Processo */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título do Processo *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Aquisição de Material de Escritório"
              required
            />
          </div>

          {/* Objeto */}
          <div>
            <label htmlFor="object" className="block text-sm font-medium text-gray-700 mb-2">
              Objeto
            </label>
            <textarea
              id="object"
              value={objectDescription}
              onChange={(e) => setObjectDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descrição do objeto"
            />
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Valor
            </label>
            <CurrencyInput
              id="value"
              value={processValue}
              onChange={setProcessValue}
              placeholder="0,00"
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Descrição detalhada do processo"
            />
          </div>

          {/* Cor de fundo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cor de fundo
            </label>
            <div className="grid grid-cols-9 gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !selectedBoardType || !processNumber.trim() || !responsiblePerson.trim() || loading || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading || isSubmitting ? 'Criando...' : 'Criar Processo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};