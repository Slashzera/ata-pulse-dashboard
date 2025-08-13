import React, { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value).toISOString().split('T')[0] : ''
  );
  const [selectedTime, setSelectedTime] = useState(
    value ? new Date(value).toTimeString().slice(0, 5) : '12:00'
  );

  const handleSave = () => {
    if (selectedDate) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      onChange(dateTime.toISOString());
      onClose();
    }
  };

  const handleRemove = () => {
    onChange('');
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Data de Entrega
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário
            </label>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opções Rápidas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Amanhã
              </button>
              <button
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setSelectedDate(nextWeek.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Próxima Semana
              </button>
            </div>
          </div>

          {value && (
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600 mb-2">Data atual:</p>
              <p className="text-sm font-medium">
                {new Date(value).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between p-4 border-t bg-gray-50">
          <div>
            {value && (
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remover Data
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};