# Design Document

## Overview

Este documento descreve o design para implementação de filtros de vencimento/validade no componente ExportCategoryReport. A solução adiciona uma nova dimensão de filtragem que permite aos usuários analisar ATAs com base em sua situação de vencimento, complementando os filtros existentes de categoria e favorecido.

## Architecture

### Component Structure
```
ExportCategoryReport
├── Estado existente (categoria, favorecido)
├── Novo estado: selectedVencimento
├── Função: getVencimentoOptions()
├── Função: filterAtasByVencimento()
├── Função: calculateVencimentoStats()
└── UI: Novo campo Select para filtro de vencimento
```

### Data Flow
1. **Input**: Usuário seleciona filtros (categoria, favorecido, vencimento)
2. **Processing**: Sistema aplica filtros sequencialmente nas ATAs
3. **Calculation**: Calcula estatísticas de vencimento
4. **Output**: Gera relatório com dados filtrados e estatísticas

## Components and Interfaces

### 1. Estado do Componente
```typescript
interface VencimentoFilter {
  value: string;
  label: string;
  filterFunction: (ata: ATA, currentDate: Date) => boolean;
}

// Novo estado
const [selectedVencimento, setSelectedVencimento] = useState<string>('all');
```

### 2. Opções de Filtro de Vencimento
```typescript
const vencimentoOptions: VencimentoFilter[] = [
  {
    value: 'all',
    label: 'Todos',
    filterFunction: () => true
  },
  {
    value: 'vencidas',
    label: 'Vencidas',
    filterFunction: (ata, currentDate) => {
      if (!ata.vencimento) return false;
      return new Date(ata.vencimento) < currentDate;
    }
  },
  {
    value: 'vencendo_30',
    label: 'Vencendo em 30 dias',
    filterFunction: (ata, currentDate) => {
      if (!ata.vencimento) return false;
      const vencimento = new Date(ata.vencimento);
      const limite = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      return vencimento >= currentDate && vencimento <= limite;
    }
  },
  {
    value: 'vencendo_60',
    label: 'Vencendo em 60 dias',
    filterFunction: (ata, currentDate) => {
      if (!ata.vencimento) return false;
      const vencimento = new Date(ata.vencimento);
      const limite = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000);
      return vencimento >= currentDate && vencimento <= limite;
    }
  },
  {
    value: 'vencendo_90',
    label: 'Vencendo em 90 dias',
    filterFunction: (ata, currentDate) => {
      if (!ata.vencimento) return false;
      const vencimento = new Date(ata.vencimento);
      const limite = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      return vencimento >= currentDate && vencimento <= limite;
    }
  },
  {
    value: 'vigentes',
    label: 'Vigentes',
    filterFunction: (ata, currentDate) => {
      if (!ata.vencimento) return false;
      return new Date(ata.vencimento) > currentDate;
    }
  },
  {
    value: 'sem_vencimento',
    label: 'Sem data de vencimento',
    filterFunction: (ata) => !ata.vencimento || ata.vencimento.trim() === ''
  }
];
```

### 3. Função de Filtragem
```typescript
const filterAtasByVencimento = (atas: ATA[], vencimentoFilter: string): ATA[] => {
  if (vencimentoFilter === 'all') return atas;
  
  const currentDate = new Date();
  const filterOption = vencimentoOptions.find(option => option.value === vencimentoFilter);
  
  if (!filterOption) return atas;
  
  return atas.filter(ata => filterOption.filterFunction(ata, currentDate));
};
```

### 4. Cálculo de Estatísticas
```typescript
interface VencimentoStats {
  vencidas: { count: number; valor: number };
  vencendo30: { count: number; valor: number };
  vigentes: { count: number; valor: number };
  semVencimento: { count: number; valor: number };
}

const calculateVencimentoStats = (atas: ATA[]): VencimentoStats => {
  const currentDate = new Date();
  const stats: VencimentoStats = {
    vencidas: { count: 0, valor: 0 },
    vencendo30: { count: 0, valor: 0 },
    vigentes: { count: 0, valor: 0 },
    semVencimento: { count: 0, valor: 0 }
  };

  atas.forEach(ata => {
    const valor = ata.valor || 0;
    
    if (!ata.vencimento || ata.vencimento.trim() === '') {
      stats.semVencimento.count++;
      stats.semVencimento.valor += valor;
    } else {
      const vencimento = new Date(ata.vencimento);
      const limite30 = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      if (vencimento < currentDate) {
        stats.vencidas.count++;
        stats.vencidas.valor += valor;
      } else if (vencimento <= limite30) {
        stats.vencendo30.count++;
        stats.vencendo30.valor += valor;
      } else {
        stats.vigentes.count++;
        stats.vigentes.valor += valor;
      }
    }
  });

  return stats;
};
```

## Data Models

### Extensão da Interface ATA
```typescript
// A interface ATA já possui o campo vencimento
interface ATA {
  // ... campos existentes
  vencimento: string; // Data no formato ISO ou string
}
```

### Modelo de Filtro
```typescript
interface ReportFilters {
  category: string;
  favorecido: string;
  vencimento: string; // Novo campo
}
```

## Error Handling

### 1. Validação de Datas
- Verificar se a data de vencimento é válida antes de fazer comparações
- Tratar casos onde a data está em formato inválido
- Considerar datas nulas ou vazias como "sem vencimento"

### 2. Filtros Sem Resultados
- Exibir mensagem clara quando nenhuma ATA atender aos critérios
- Sugerir ajuste nos filtros para obter resultados
- Manter estado dos filtros para facilitar ajustes

### 3. Erros de Cálculo
- Validar valores numéricos antes de somar
- Tratar casos de valores nulos ou indefinidos
- Garantir que estatísticas sejam sempre calculadas corretamente

## Testing Strategy

### 1. Testes Unitários
```typescript
describe('Filtros de Vencimento', () => {
  test('deve filtrar ATAs vencidas corretamente', () => {
    const atas = [
      { id: 1, vencimento: '2023-01-01', valor: 1000 },
      { id: 2, vencimento: '2025-01-01', valor: 2000 }
    ];
    const result = filterAtasByVencimento(atas, 'vencidas');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  test('deve calcular estatísticas corretamente', () => {
    const atas = [
      { id: 1, vencimento: '2023-01-01', valor: 1000 },
      { id: 2, vencimento: '2025-01-01', valor: 2000 }
    ];
    const stats = calculateVencimentoStats(atas);
    expect(stats.vencidas.count).toBe(1);
    expect(stats.vigentes.count).toBe(1);
  });
});
```

### 2. Testes de Integração
- Testar combinação de filtros (categoria + favorecido + vencimento)
- Verificar geração correta do relatório HTML
- Validar formatação de datas no relatório

### 3. Testes de UI
- Verificar interação com o novo campo Select
- Testar responsividade em diferentes dispositivos
- Validar feedback visual das seleções

## Visual Design

### 1. Layout do Filtro
```jsx
<div className="space-y-4">
  {/* Filtros existentes */}
  <div>
    <Label>Categoria *</Label>
    <Select>...</Select>
  </div>
  
  <div>
    <Label>Favorecido (Opcional)</Label>
    <Select>...</Select>
  </div>
  
  {/* Novo filtro */}
  <div>
    <Label>Filtrar por Vencimento</Label>
    <Select value={selectedVencimento} onValueChange={setSelectedVencimento}>
      <SelectTrigger>
        <SelectValue placeholder="Todos os vencimentos" />
      </SelectTrigger>
      <SelectContent>
        {vencimentoOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>
```

### 2. Formatação no Relatório
```css
.vencida {
  background-color: #fef2f2;
  color: #dc2626;
  font-weight: bold;
}

.vencendo-30 {
  background-color: #fef3c7;
  color: #d97706;
}

.vigente {
  background-color: #f0fdf4;
  color: #16a34a;
}
```

### 3. Seção de Estatísticas
```html
<div class="vencimento-stats">
  <h4>Estatísticas de Vencimento</h4>
  <div class="stat-item vencidas">
    <span>ATAs Vencidas:</span>
    <span>{stats.vencidas.count} ({formatCurrency(stats.vencidas.valor)})</span>
  </div>
  <div class="stat-item vencendo">
    <span>Vencendo em 30 dias:</span>
    <span>{stats.vencendo30.count} ({formatCurrency(stats.vencendo30.valor)})</span>
  </div>
  <div class="stat-item vigentes">
    <span>Vigentes:</span>
    <span>{stats.vigentes.count} ({formatCurrency(stats.vigentes.valor)})</span>
  </div>
</div>
```

## Performance Considerations

### 1. Otimização de Filtros
- Aplicar filtros em sequência para reduzir conjunto de dados
- Usar memoização para cálculos de estatísticas
- Evitar recálculos desnecessários quando filtros não mudam

### 2. Renderização
- Lazy loading para listas grandes de favorecidos
- Debounce para mudanças rápidas de filtros
- Otimizar geração do HTML do relatório

### 3. Memória
- Limpar referências de janelas de impressão após uso
- Evitar vazamentos de memória em cálculos de data
- Gerenciar estado de forma eficiente