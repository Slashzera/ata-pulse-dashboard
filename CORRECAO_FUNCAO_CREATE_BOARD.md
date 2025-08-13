# Correção da Função create_board_with_type

## 🚨 Problema Identificado

**Erro:** `Could not find the function public.create_board_with_type(background_color, board_title, board_type_uuid, company, object_description, process_number, process_value, responsible_person) in the schema cache`

### Causa do Problema:
A função `create_board_with_type` no banco de dados tem parâmetros em uma ordem diferente da que está sendo enviada pelo frontend.

## 📋 Análise dos Parâmetros

### Frontend (useTrellinho.ts) envia:
```typescript
await supabase.rpc('create_board_with_type', {
  board_title: boardData.title,
  board_description: boardData.description,
  background_color: boardData.background_color || '#0079bf',
  board_type_uuid: boardData.board_type_id,
  process_number: boardData.process_number,
  responsible_person: boardData.responsible_person,
  company: boardData.company,
  object_description: boardData.object_description,
  process_value: boardData.process_value
});
```

### Função SQL atual espera:
```sql
CREATE OR REPLACE FUNCTION create_board_with_type(
    board_title VARCHAR(255),
    board_description TEXT,
    background_color VARCHAR(7),
    board_type_uuid UUID,
    process_number VARCHAR(100) DEFAULT NULL,
    responsible_person VARCHAR(255) DEFAULT NULL,
    company VARCHAR(255) DEFAULT NULL,
    object_description TEXT DEFAULT NULL,
    process_value DECIMAL(15,2) DEFAULT NULL
)
```

## ✅ Solução Implementada

### 1. Script de Correção Criado
**Arquivo:** `fix-create-board-function.sql`

### 2. Ações do Script:
- ✅ **Remove função existente** com parâmetros incorretos
- ✅ **Recria função** com parâmetros na ordem correta
- ✅ **Mantém toda funcionalidade** original
- ✅ **Verifica criação** da função

### 3. Funcionalidades Mantidas:
- ✅ **Criação de quadro** com tipo de processo
- ✅ **Listas padrão** criadas automaticamente
- ✅ **Retorno JSON** com dados completos
- ✅ **Segurança RLS** mantida

## 🔧 Como Aplicar a Correção

### Passo 1: Executar o Script
```sql
-- Execute o arquivo fix-create-board-function.sql no seu banco de dados
```

### Passo 2: Verificar Função
```sql
-- Verificar se a função foi criada corretamente
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';
```

## 📊 Estrutura da Função Corrigida

### Parâmetros (ordem correta):
1. `board_title` - Título do processo
2. `board_description` - Descrição do processo  
3. `background_color` - Cor de fundo do quadro
4. `board_type_uuid` - ID do tipo de processo
5. `process_number` - Número do processo
6. `responsible_person` - Responsável pelo processo
7. `company` - Empresa relacionada
8. `object_description` - Descrição do objeto
9. `process_value` - Valor do processo

### Funcionalidades:
- ✅ **Cria quadro** com todos os dados do processo
- ✅ **Associa tipo** de processo ao quadro
- ✅ **Cria listas padrão**: A fazer, Em andamento, Em análise, Concluído
- ✅ **Retorna JSON** com dados completos do quadro criado
- ✅ **Inclui informações** do tipo de processo no retorno

## 🎯 Resultado Esperado

Após aplicar a correção:
- ✅ **Popup "Cadastrar Novo Processo"** funcionará corretamente
- ✅ **Quadros serão criados** com sucesso
- ✅ **Tipos de processo** serão associados corretamente
- ✅ **Dados do processo** serão salvos (número, responsável, empresa, etc.)
- ✅ **Listas padrão** serão criadas automaticamente

## 🚀 Status da Correção

- ✅ **Script criado**: `fix-create-board-function.sql`
- ✅ **Problema identificado**: Cache do Supabase não reconhece a função
- ✅ **Função existe**: Parâmetros estão corretos no banco
- ✅ **Solução atualizada**: Script `refresh-function-cache.sql` para forçar refresh

## 🔄 Script de Refresh do Cache

**Arquivo:** `refresh-function-cache.sql`

### O que o script faz:
- ✅ **Verifica função existente**
- ✅ **Remove função** para limpar cache
- ✅ **Recria função** com assinatura exata
- ✅ **Força refresh** do cache do Supabase
- ✅ **Verifica criação** final

Execute o script `refresh-function-cache.sql` no seu banco de dados para resolver o problema de cache! 🎉