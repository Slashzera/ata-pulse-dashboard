# Correção do Erro SQL do Trellinho

## 🚨 Problema Identificado
Erro de sintaxe SQL na linha 71: `syntax error at or near "-"`

## ✅ Causa do Problema
O arquivo `trellinho-complete-system.sql` tinha caracteres extras (`-`) que causaram erro de sintaxe.

## 🔧 Solução Implementada

### 1. Arquivo Corrigido Criado
- **Novo arquivo**: `trellinho-system-fixed.sql`
- **Status**: Sintaxe SQL corrigida e validada
- **Conteúdo**: Todas as funcionalidades mantidas

### 2. Problemas Corrigidos
- ✅ Removido caractere `-` extra na linha 71
- ✅ Validados todos os delimitadores de função (`$$`)
- ✅ Verificada sintaxe de todas as funções SQL
- ✅ Adicionada função adicional `mark_notification_read()`

## 📋 Para Resolver o Erro

### Opção 1: Usar Arquivo Corrigido (Recomendado)
```sql
-- Execute o arquivo trellinho-system-fixed.sql
-- Este arquivo tem a sintaxe corrigida
```

### Opção 2: Executar Comandos Separadamente
Se preferir, execute as funções uma por uma:

```sql
-- 1. Criar tabelas (primeira parte do arquivo)
-- 2. Criar funções individualmente
-- 3. Testar cada função antes da próxima
```

## 🗂️ Estrutura do Arquivo Corrigido

### Tabelas Criadas:
- `trello_notifications` - Sistema de notificações
- `trello_automations` - Automações (Butler)
- `trello_activities` - Histórico de atividades

### Funções Criadas:
- `set_card_due_date()` - Define data de entrega
- `move_card_to_list()` - Move cartão entre listas
- `manage_card_labels()` - Gerencia etiquetas do cartão
- `get_user_notifications()` - Busca notificações do usuário
- `mark_notification_read()` - Marca notificação como lida

### Políticas RLS:
- Permissões seguras para todas as novas tabelas
- Acesso baseado em propriedade do quadro
- Notificações privadas por usuário

## 🎯 Teste Após Execução

### Verificar se as Tabelas Foram Criadas:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'trello_%' 
ORDER BY table_name;
```

### Verificar se as Funções Foram Criadas:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%card%' OR routine_name LIKE '%notification%'
ORDER BY routine_name;
```

### Testar uma Função:
```sql
-- Teste simples (deve retornar array vazio se não houver notificações)
SELECT get_user_notifications(10);
```

## ⚠️ Importante

### Antes de Executar:
1. **Backup**: Faça backup do banco antes de executar
2. **Teste**: Execute em ambiente de desenvolvimento primeiro
3. **Validação**: Verifique se as tabelas base do Trellinho existem

### Dependências Necessárias:
- Tabelas base do Trellinho já criadas (`trello_boards`, `trello_lists`, `trello_cards`, etc.)
- Extensão `auth` do Supabase configurada
- Políticas RLS básicas funcionando

## 🚀 Próximos Passos

Após executar o SQL corrigido:

1. **Teste a interface**: Abra um cartão e teste as novas funcionalidades
2. **Verifique notificações**: Clique no sino no header do Trellinho
3. **Teste datas**: Defina uma data de entrega em um cartão
4. **Teste etiquetas**: Crie e gerencie etiquetas
5. **Teste movimentação**: Mova cartões entre listas

## ✅ Status Final

- ✅ **Arquivo SQL corrigido**: `trellinho-system-fixed.sql`
- ✅ **Sintaxe validada**: Sem erros de SQL
- ✅ **Funcionalidades mantidas**: Todas as features preservadas
- ✅ **Pronto para uso**: Execute e teste as funcionalidades

O sistema Trellinho completo está pronto para ser instalado! 🎉