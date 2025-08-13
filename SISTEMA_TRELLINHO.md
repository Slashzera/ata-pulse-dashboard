# Sistema Trellinho - Documentação Completa

## Visão Geral
O Trellinho é um sistema de gerenciamento de projetos e tarefas inspirado no Trello, integrado ao sistema principal. Permite organizar trabalho em quadros, listas e cartões de forma visual e colaborativa.

## Estrutura do Sistema

### 1. Banco de Dados
O sistema utiliza as seguintes tabelas principais:

#### Tabelas Criadas:
- `trello_boards` - Quadros de projeto
- `trello_lists` - Listas dentro dos quadros
- `trello_cards` - Cartões/tarefas
- `trello_board_members` - Membros dos quadros
- `trello_card_members` - Membros atribuídos aos cartões
- `trello_labels` - Etiquetas para categorização
- `trello_card_labels` - Relacionamento cartão-etiqueta
- `trello_checklists` - Listas de verificação
- `trello_checklist_items` - Itens das listas de verificação
- `trello_attachments` - Anexos dos cartões
- `trello_comments` - Comentários nos cartões

### 2. Funcionalidades Implementadas

#### Quadros (Boards)
- ✅ Criação de quadros com título, descrição e cor de fundo
- ✅ Visualização de todos os quadros do usuário
- ✅ Controle de permissões (owner, admin, member)
- ✅ Interface responsiva com grid de quadros

#### Listas (Lists)
- ✅ Criação de listas dentro dos quadros
- ✅ Ordenação por posição
- ✅ Interface drag-and-drop ready

#### Cartões (Cards)
- ✅ Criação de cartões com título e descrição
- ✅ Modal detalhado para edição
- ✅ Suporte a datas de entrega
- ✅ Sistema de posicionamento

#### Recursos Avançados
- ✅ Sistema de etiquetas (labels) com cores
- ✅ Checklists com itens marcáveis
- ✅ Sistema de anexos
- ✅ Comentários e atividades
- ✅ Atribuição de membros
- ✅ Controle de permissões RLS

### 3. Componentes React

#### Componentes Principais:
- `Trellinho.tsx` - Tela principal com grid de quadros
- `TrelloBoard.tsx` - Visualização do quadro com listas
- `TrelloList.tsx` - Componente de lista
- `TrelloCard.tsx` - Cartão individual
- `CardDetailModal.tsx` - Modal detalhado do cartão

#### Componentes de Diálogo:
- `CreateBoardDialog.tsx` - Criação de quadros
- `CreateListDialog.tsx` - Criação de listas
- `CreateCardDialog.tsx` - Criação de cartões

#### Hook Personalizado:
- `useTrellinho.ts` - Gerenciamento de estado e API calls

### 4. Funcionalidades do Modal de Cartão

#### Abas Disponíveis:
- **Detalhes**: Descrição, checklists, anexos
- **Atividade**: Histórico de mudanças e comentários

#### Ações Laterais:
- Adicionar membros
- Gerenciar etiquetas
- Definir data de entrega
- Adicionar anexos
- Criar checklists
- Mover/copiar cartão
- Arquivar cartão

### 5. Segurança e Permissões

#### Row Level Security (RLS):
- Usuários só veem quadros onde são membros
- Controle de permissões por função (owner/admin/member)
- Políticas de segurança para todas as tabelas

#### Funções de Banco:
- `get_user_boards()` - Lista quadros do usuário
- `get_board_with_lists_and_cards()` - Dados completos do quadro

### 6. Como Usar

#### Acesso ao Sistema:
1. No menu principal, clique em "Trellinho"
2. Visualize seus quadros existentes
3. Clique em "Criar novo quadro" para começar

#### Criando um Projeto:
1. **Criar Quadro**: Defina título, descrição e cor
2. **Adicionar Listas**: Ex: "A fazer", "Em andamento", "Concluído"
3. **Criar Cartões**: Adicione tarefas nas listas apropriadas
4. **Detalhar Cartões**: Adicione descrições, checklists, anexos

#### Gerenciando Tarefas:
- Clique em um cartão para abrir detalhes
- Use checklists para subtarefas
- Adicione comentários para comunicação
- Defina datas de entrega para prazos
- Use etiquetas para categorização

### 7. Instalação

#### 1. Executar SQL:
```sql
-- Execute o arquivo create-trellinho-system.sql
-- Isso criará todas as tabelas e configurações necessárias
```

#### 2. Componentes já integrados:
- Todos os componentes estão criados
- Hook useTrellinho configurado
- Integração com menu principal completa

### 8. Próximas Melhorias

#### Funcionalidades Planejadas:
- [ ] Drag and drop entre listas
- [ ] Notificações em tempo real
- [ ] Templates de quadros
- [ ] Relatórios de produtividade
- [ ] Integração com calendário
- [ ] Backup e exportação
- [ ] Modo offline

#### Melhorias de UX:
- [ ] Atalhos de teclado
- [ ] Busca avançada
- [ ] Filtros por etiqueta/membro
- [ ] Visualização em calendário
- [ ] Dashboard de métricas

### 9. Arquivos Criados

```
create-trellinho-system.sql          # Estrutura do banco
src/components/Trellinho.tsx         # Tela principal
src/components/TrelloBoard.tsx       # Visualização do quadro
src/components/TrelloList.tsx        # Componente de lista
src/components/TrelloCard.tsx        # Cartão individual
src/components/CardDetailModal.tsx   # Modal detalhado
src/components/CreateBoardDialog.tsx # Criação de quadros
src/components/CreateListDialog.tsx  # Criação de listas
src/components/CreateCardDialog.tsx  # Criação de cartões
src/hooks/useTrellinho.ts           # Hook personalizado
```

### 10. Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Ícones**: Lucide React
- **Segurança**: Row Level Security (RLS)
- **Estado**: React Hooks customizados

## Conclusão

O sistema Trellinho está completamente funcional e integrado ao sistema principal. Oferece uma solução robusta para gerenciamento de projetos com interface intuitiva e recursos avançados de colaboração.

Para começar a usar, execute o SQL de criação das tabelas e acesse através do menu principal "Trellinho".