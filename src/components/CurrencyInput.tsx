import React, { useState } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  id
}) => {
  const [rawValue, setRawValue] = useState('');

  // Formatar valor para exibição
  const formatCurrency = (val: string): string => {
    if (!val) return '';
    
    // Remove tudo exceto números
    const numbers = val.replace(/\D/g, '');
    if (!numbers) return '';
    
    // Converte para número (últimos 2 dígitos são centavos)
    const amount = parseFloat(numbers) / 100;
    
    // Formata no padrão brasileiro
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Obter valor atual para exibição
  const getDisplayValue = (): string => {
    if (rawValue) {
      return formatCurrency(rawValue);
    }
    if (value && value !== '0') {
      // Se tem valor externo, converte para formato de exibição
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Se está apagando tudo
    if (!inputValue) {
      setRawValue('');
      onChange('');
      return;
    }
    
    // Remove tudo exceto números
    const numbers = inputValue.replace(/\D/g, '');
    
    // Se não tem números, não faz nada
    if (!numbers) {
      return;
    }
    
    // Limita a 12 dígitos (999.999.999,99)
    const limitedNumbers = numbers.slice(0, 12);
    
    // Atualiza o valor bruto
    setRawValue(limitedNumbers);
    
    // Calcula o valor numérico (últimos 2 dígitos são centavos)
    const numericValue = parseFloat(limitedNumbers) / 100;
    
    // Envia o valor para o componente pai
    onChange(numericValue.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite teclas especiais
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }
    
    // Permite apenas números
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Seleciona todo o texto ao focar
    setTimeout(() => {
      e.target.select();
    }, 10);
  };

  const handleBlur = () => {
    // Limpa o valor bruto ao sair do foco
    setRawValue('');
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-2 text-gray-500 pointer-events-none">R$</span>
      <input
        type="text"
        id={id}
        value={getDisplayValue()}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
};

export default CurrencyInput;