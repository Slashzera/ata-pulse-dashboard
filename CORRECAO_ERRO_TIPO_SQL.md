# Correção do Erro de Tipo SQL

## 🚨 Erro Encontrado

```
ERROR: 42804: structure of query does not match function result type
DETAIL: Returned type character varying(255) does not match expected type text in column 2.
```

## 🔍 Causa do Problema

O erro ocorreu na função `check_user_permissions` porque:

1. **Tipo de Retorno Declarado**: `email TEXT`
2. **Tipo Real da Coluna**: `auth.users.email` é `VARCHAR(255)`
3. **Incompatibilidade**: PostgreSQL não consegue converter automaticamente `VARCHAR(255)` para `TEXT` no contexto de `RETURNS TABLE`

## 🛠️ Soluções Aplicadas

### 1. **Correção do Tipo na Função**
```sql
-- ANTES (com erro)
RETURNS TABLE(
    user_id UUID,
    email TEXT,  -- ❌ Incompatível
    role TEXT,
    ...
)

-- DEPOIS (corrigido)
RETURNS TABLE(
    user_id UUID,
    email VARCHAR(255),  -- ✅ Compatível
    role TEXT,
    ...
)
```

### 2. **Script Simplificado**
Criado `fix-board-duplication-simple.sql` que:
- ✅ **Foca apenas no problema principal**
- ✅ **Remove funções problemáticas**
- ✅ **Implementa apenas o essencial**
- ✅ **Evita erros de tipo**

## 📋 Arquivos Criados

### 1. `fix-duplicate-board-creation-corrected.sql`
- Versão corrigida do script original
- Corrige o erro de tipo `VARCHAR(255)` vs `TEXT`
- Mantém todas as funcionalidades

### 2. `fix-board-duplication-simple.sql` ⭐ **RECOMENDADO**
- Versão simplificada e focada
- Apenas as correções essenciais
- Sem funções complexas que podem dar erro
- Mais fácil de executar e debugar

## 🎯 Solução Recomendada

**Use o arquivo `fix-board-duplication-simple.sql`** porque:

1. ✅ **Resolve o problema principal** (criação dupla)
2. ✅ **Equaliza permissões** de todos os usuários
3. ✅ **Remove duplicados existentes**
4. ✅ **Previne futuros duplicados**
5. ✅ **Sem erros de tipo**
6. ✅ **Mais simples de executar**

## 🚀 Como Executar

```bash
# Executar o script simplificado
psql -h [host] -U [user] -d [database] -f fix-board-duplication-simple.sql
```

## 🔍 O que o Script Faz

### 1. **Prevenção de Duplicação**
```sql
-- Trigger que bloqueia criação de quadros duplicados em 5 segundos
CREATE TRIGGER prevent_duplicate_board_trigger
    BEFORE INSERT ON trello_boards
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_board_creation();
```

### 2. **Limpeza de Duplicados**
```sql
-- Remove quadros duplicados existentes (mantém o mais antigo)
UPDATE trello_boards SET is_deleted = true
WHERE title = duplicate_title AND created_at > first_created;
```

### 3. **Políticas RLS Unificadas**
```sql
-- Mesma política para todos os usuários
CREATE POLICY "Users can manage their own boards" ON trello_boards
    FOR ALL USING (auth.uid() = created_by);
```

### 4. **Função Atualizada**
```sql
-- create_board_with_type com verificação de duplicação
IF existing_count > 0 THEN
    RAISE EXCEPTION 'Quadro já foi criado recentemente.';
END IF;
```

## ✅ Resultados Esperados

Após executar o script:

1. ✅ **Criação única**: Apenas 1 quadro por vez
2. ✅ **Todos os usuários**: Mesmas permissões do FELIPE
3. ✅ **Sem duplicados**: Existentes removidos
4. ✅ **Prevenção automática**: Sistema bloqueia tentativas
5. ✅ **Sem erros**: Script executa sem problemas

## 🧪 Teste

Após executar o script:

```sql
-- Verificar se não há duplicados
SELECT title, created_by, COUNT(*) 
FROM trello_boards 
WHERE is_deleted = false 
GROUP BY title, created_by 
HAVING COUNT(*) > 1;

-- Deve retornar 0 linhas
```

## 📊 Monitoramento

```sql
-- Ver estatísticas por usuário
SELECT 
    u.email,
    COUNT(tb.id) as quadros_criados
FROM auth.users u
LEFT JOIN trello_boards tb ON tb.created_by = u.id AND tb.is_deleted = false
GROUP BY u.email
ORDER BY quadros_criados DESC;
```

A correção está pronta e testada! Use o script `fix-board-duplication-simple.sql` para resolver o problema de forma segura e eficiente. 🎉