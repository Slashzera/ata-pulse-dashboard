# Implementation Plan

- [x] 1. Implementar estado e tipos para filtros de vencimento


  - Adicionar novo estado `selectedVencimento` no componente ExportCategoryReport
  - Criar interface `VencimentoFilter` com value, label e filterFunction
  - Definir array `vencimentoOptions` com todas as opções de filtro
  - _Requirements: 1.1, 1.2_



- [ ] 2. Criar funções utilitárias para filtragem por vencimento
  - Implementar função `filterAtasByVencimento` que aplica filtros baseados em data
  - Criar função `calculateVencimentoStats` para estatísticas de vencimento
  - Adicionar função `isDateValid` para validação de datas


  - Implementar lógica de comparação de datas para cada tipo de filtro
  - _Requirements: 1.2, 4.1, 4.2_

- [ ] 3. Adicionar campo de filtro de vencimento na interface
  - Inserir novo campo Select para filtro de vencimento no modal


  - Configurar onChange handler para `setSelectedVencimento`
  - Posicionar campo após os filtros existentes (categoria e favorecido)
  - Aplicar estilos consistentes com os campos existentes
  - _Requirements: 1.1, 5.3_



- [ ] 4. Integrar filtro de vencimento na lógica de geração do relatório
  - Modificar função `generateCategoryReport` para aplicar filtro de vencimento
  - Integrar `filterAtasByVencimento` na sequência de filtros existentes
  - Atualizar validação para considerar o novo filtro


  - Garantir que filtros sejam aplicados na ordem correta
  - _Requirements: 2.1, 2.2_

- [ ] 5. Atualizar seção "Filtros Aplicados" no relatório HTML
  - Adicionar exibição do filtro de vencimento selecionado na seção de filtros


  - Incluir label descritivo do filtro aplicado
  - Manter formatação consistente com filtros existentes
  - _Requirements: 3.1_

- [x] 6. Implementar formatação visual para ATAs por situação de vencimento



  - Adicionar classes CSS para ATAs vencidas, vencendo e vigentes
  - Aplicar formatação diferenciada na coluna de validade
  - Destacar visualmente ATAs vencidas com cor vermelha
  - Aplicar cor de alerta para ATAs vencendo em breve
  - _Requirements: 3.2, 3.3_

- [ ] 7. Criar seção de estatísticas de vencimento no relatório
  - Implementar cálculo de estatísticas usando `calculateVencimentoStats`
  - Adicionar nova seção "Estatísticas de Vencimento" no HTML do relatório
  - Exibir contagem e valor total por situação de vencimento
  - Aplicar formatação de alerta para ATAs vencidas
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. Adicionar tratamento de erros e validações
  - Implementar validação de datas antes de aplicar filtros
  - Adicionar tratamento para datas inválidas ou nulas
  - Melhorar mensagens de erro quando nenhuma ATA é encontrada
  - Adicionar logs para debug da filtragem
  - _Requirements: 2.2, 5.4_

- [ ] 9. Implementar testes unitários para as novas funcionalidades
  - Criar testes para função `filterAtasByVencimento`
  - Testar função `calculateVencimentoStats` com diferentes cenários
  - Validar comportamento com datas inválidas ou nulas
  - Testar combinação de filtros (categoria + favorecido + vencimento)
  - _Requirements: 1.2, 2.1, 4.1_

- [ ] 10. Otimizar performance e responsividade
  - Implementar debounce para mudanças de filtro se necessário
  - Otimizar cálculos de data para grandes volumes de dados
  - Verificar responsividade do novo campo em dispositivos móveis
  - Garantir feedback visual imediato na seleção de filtros
  - _Requirements: 5.1, 5.2, 5.3_