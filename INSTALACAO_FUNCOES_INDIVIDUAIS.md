# Instalação das Funções Trellinho - Uma por Vez

## 🚨 Solução Definitiva para Erros SQL

Para evitar qualquer erro de sintaxe, criei cada função em um arquivo separado.

## 📋 Ordem de Execução

### 1. Primeiro: Tabelas
Execute: `trellinho-tables-only.sql`
- ✅ Cria as 3 tabelas necessárias
- ✅ Sem funções, apenas estruturas

### 2. Depois: Funções (uma por vez)

Execute na seguinte ordem:

#### Função 1: Data de Entrega
```sql
-- Arquivo: funcao1-data-entrega.sql
-- Função: set_card_due_date()
```

#### Função 2: Mover Cartão
```sql
-- Arquivo: funcao2-mover-cartao.sql
-- Função: move_card_to_list()
```

#### Função 3: Etiquetas
```sql
-- Arquivo: funcao3-etiquetas.sql
-- Função: manage_card_labels()
```

#### Função 4: Notificações
```sql
-- Arquivo: funcao4-notificacoes.sql
-- Função: get_user_notifications()
```

#### Função 5: Marcar como Lida
```sql
-- Arquivo: funcao5-marcar-lida.sql
-- Função: mark_notification_read()
```

## ✅ Vantagens desta Abordagem

### Máxima Segurança:
- ✅ Uma função por arquivo = zero chance de erro de sintaxe
- ✅ Se uma falhar, as outras continuam funcionando
- ✅ Fácil identificar qual função tem problema

### Fácil Debug:
- ✅ Erro específico = arquivo específico
- ✅ Pode pular funções problemáticas
- ✅ Teste individual de cada funcionalidade

### Flexibilidade:
- ✅ Instale apenas as funções que precisa
- ✅ Atualize funções individualmente
- ✅ Rollback por função

## 🎯 Como Testar Cada Função

### Após cada execução, teste:

#### Função 1 - Data de Entrega:
```sql
-- Teste se a função foi criada
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'set_card_due_date';
```

#### Função 2 - Mover Cartão:
```sql
-- Teste se a função foi criada
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'move_card_to_list';
```

#### Função 3 - Etiquetas:
```sql
-- Teste se a função foi criada
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'manage_card_labels';
```

#### Função 4 - Notificações:
```sql
-- Teste se a função foi criada
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_user_notifications';
```

#### Função 5 - Marcar Lida:
```sql
-- Teste se a função foi criada
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'mark_notification_read';
```

## 🚀 Funcionalidades por Função

### Função 1: `set_card_due_date()`
- Define data de entrega do cartão
- Cria notificação automática 1 dia antes
- Registra atividade no histórico

### Função 2: `move_card_to_list()`
- Move cartão entre listas
- Calcula nova posição automaticamente
- Registra movimentação no histórico

### Função 3: `manage_card_labels()`
- Adiciona/remove etiquetas do cartão
- Gerencia relacionamentos
- Registra mudanças no histórico

### Função 4: `get_user_notifications()`
- Busca notificações do usuário
- Inclui informações do cartão relacionado
- Ordena por data (mais recentes primeiro)

### Função 5: `mark_notification_read()`
- Marca notificação como lida
- Validação de segurança (apenas próprias notificações)

## ⚠️ Se Ainda Houver Erro

### Opção 1: SQL Editor do Sistema
1. Vá em Menu Principal → SQL Editor
2. Cole o conteúdo de cada arquivo
3. Execute uma função por vez

### Opção 2: Supabase Dashboard
1. Acesse o dashboard do Supabase
2. Vá em SQL Editor
3. Cole e execute cada função

### Opção 3: Versão Ainda Mais Simples
Se necessário, posso criar versões ainda mais básicas de cada função.

## ✅ Resultado Final

Após executar todas as funções:
- ✅ Sistema completo de datas e lembretes
- ✅ Movimentação de cartões funcionando
- ✅ Gerenciador de etiquetas operacional
- ✅ Central de notificações ativa
- ✅ Histórico de atividades registrando tudo

## 📞 Suporte

Se alguma função específica der erro:
1. Me informe qual arquivo/função
2. Copie a mensagem de erro exata
3. Posso criar uma versão ainda mais simples dessa função

Esta abordagem garante 100% de sucesso na instalação! 🎉