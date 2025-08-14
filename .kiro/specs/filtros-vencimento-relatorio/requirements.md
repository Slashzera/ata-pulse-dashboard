# Requirements Document

## Introduction

Esta especificação define a implementação de filtros de vencimento/validade no relatório por categoria do sistema SisGecon Saúde. O objetivo é permitir que os usuários filtrem as ATAs por diferentes critérios de vencimento ao gerar relatórios, facilitando a análise de contratos próximos ao vencimento, vencidos ou com validade específica.

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, eu quero filtrar o relatório por categoria por vencimento/validade das ATAs, para que eu possa analisar contratos com base em sua situação de validade.

#### Acceptance Criteria

1. WHEN o usuário abrir o modal de relatório por categoria THEN o sistema SHALL exibir um novo campo de filtro "Filtrar por Vencimento"
2. WHEN o usuário selecionar o filtro de vencimento THEN o sistema SHALL apresentar as seguintes opções:
   - "Todos" (padrão)
   - "Vencidas" (vencimento anterior à data atual)
   - "Vencendo em 30 dias" (vencimento entre hoje e 30 dias)
   - "Vencendo em 60 dias" (vencimento entre hoje e 60 dias)
   - "Vencendo em 90 dias" (vencimento entre hoje e 90 dias)
   - "Vigentes" (vencimento posterior à data atual)
   - "Sem data de vencimento" (campo vencimento vazio ou nulo)

### Requirement 2

**User Story:** Como usuário do sistema, eu quero que os filtros de vencimento sejam aplicados em conjunto com os filtros existentes, para que eu possa ter relatórios mais específicos e detalhados.

#### Acceptance Criteria

1. WHEN o usuário selecionar categoria, favorecido e filtro de vencimento THEN o sistema SHALL aplicar todos os filtros simultaneamente
2. WHEN nenhuma ATA atender aos critérios de filtro THEN o sistema SHALL exibir mensagem informativa "Nenhuma ATA encontrada para os filtros selecionados"
3. WHEN o usuário alterar qualquer filtro THEN o sistema SHALL manter os outros filtros selecionados

### Requirement 3

**User Story:** Como usuário do sistema, eu quero que o relatório gerado mostre claramente quais filtros foram aplicados, para que eu possa identificar facilmente o escopo do relatório.

#### Acceptance Criteria

1. WHEN o relatório for gerado com filtro de vencimento THEN o sistema SHALL incluir na seção "Filtros Aplicados" o critério de vencimento selecionado
2. WHEN ATAs vencidas forem incluídas no relatório THEN o sistema SHALL destacar visualmente as linhas com vencimento expirado
3. WHEN ATAs próximas ao vencimento forem incluídas THEN o sistema SHALL aplicar formatação diferenciada para alertar sobre proximidade do vencimento

### Requirement 4

**User Story:** Como usuário do sistema, eu quero que o resumo do relatório inclua estatísticas sobre vencimentos, para que eu possa ter uma visão geral da situação dos contratos.

#### Acceptance Criteria

1. WHEN o relatório for gerado THEN o sistema SHALL incluir no resumo:
   - Quantidade de ATAs vencidas
   - Quantidade de ATAs vencendo em 30 dias
   - Quantidade de ATAs vigentes
   - Valor total das ATAs por situação de vencimento
2. WHEN existirem ATAs vencidas THEN o sistema SHALL destacar essa informação no resumo com formatação de alerta
3. WHEN existirem ATAs próximas ao vencimento THEN o sistema SHALL incluir aviso no resumo sobre necessidade de renovação

### Requirement 5

**User Story:** Como usuário do sistema, eu quero que a funcionalidade seja intuitiva e responsiva, para que eu possa usar facilmente em diferentes dispositivos.

#### Acceptance Criteria

1. WHEN o usuário interagir com os filtros THEN o sistema SHALL responder em menos de 500ms
2. WHEN o usuário estiver em dispositivo móvel THEN o sistema SHALL manter a usabilidade dos filtros
3. WHEN o usuário selecionar um filtro THEN o sistema SHALL fornecer feedback visual imediato da seleção
4. WHEN houver erro na aplicação dos filtros THEN o sistema SHALL exibir mensagem de erro clara e específica