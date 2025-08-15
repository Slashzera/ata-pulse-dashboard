# Correção - Criação Dupla de Quadros no KazuFlow

## 🔍 Problema Identificado

### Sintomas:
- Ao criar um novo quadro no KazuFlow, **2 quadros são criados simultaneamente**
- Apenas o usuário **FELIPE** consegue criar quadros corretamente
- Outros usuários enfrentam problemas de permissão ou duplicação

### Possíveis Causas:
1. **Double-click no botão**: Usuário clica duas vezes rapidamente
2. **Políticas RLS restritivas**: Row Level Security mal configurado
3. **Triggers duplicados**: Triggers que executam múltiplas vezes
4. **Permissões inconsistentes**: Usuário FELIPE tem permissões diferentes
5. **Race condition**: Múltiplas requisições simultâneas
6. **Estado do React**: Re-renderizações causando múltiplas chamadas

## 🛠️ Soluções Implementadas

### 1. **Prevenção de Duplicação no Banco**
```sql
-- Trigger para prevenir criação dupla
CREATE OR REPLACE FUNCTION prevent_duplicate_board_creation()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Verificar se já existe quadro com mesmo título nos últimos 5 segundos
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = NEW.title
    AND created_by = NEW.created_by
    AND created_at > (NOW() - INTERVAL '5 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro já foi criado recentemente. Aguarde alguns segundos.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. **Função Segura para Criar Quadros**
```sql
CREATE OR REPLACE FUNCTION create_board_safe(
    board_title TEXT,
    board_description TEXT DEFAULT NULL,
    background_color TEXT DEFAULT '#0079bf'
)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    new_board_id UUID;
    existing_count INTEGER;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar duplicação (janela de 10 segundos)
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = board_title
    AND created_by = current_user_id
    AND created_at > (NOW() - INTERVAL '10 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro já foi criado recentemente.';
    END IF;
    
    -- Criar quadro e listas padrão
    INSERT INTO trello_boards (title, description, background_color, created_by)
    VALUES (board_title, board_description, background_color, current_user_id)
    RETURNING id INTO new_board_id;
    
    -- Criar listas padrão
    INSERT INTO trello_lists (board_id, title, position) VALUES
    (new_board_id, 'A Fazer', 0),
    (new_board_id, 'Em Progresso', 1),
    (new_board_id, 'Concluído', 2);
    
    -- Retornar resultado
    RETURN (SELECT json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'background_color', background_color,
        'created_by', created_by,
        'created_at', created_at,
        'updated_at', updated_at,
        'member_role', 'owner'
    ) FROM trello_boards WHERE id = new_board_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. **Equalização de Permissões**
```sql
-- Remover políticas restritivas
DROP POLICY IF EXISTS "Users can only see their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only create their own boards" ON trello_boards;

-- Criar política unificada
CREATE POLICY "Users can manage their own boards" ON trello_boards
    FOR ALL USING (auth.uid() = created_by);
```

### 4. **Limpeza de Quadros Duplicados**
```sql
CREATE OR REPLACE FUNCTION clean_duplicate_boards()
RETURNS TEXT AS $$
DECLARE
    duplicate_count INTEGER := 0;
    board_record RECORD;
BEGIN
    -- Encontrar quadros duplicados (mesmo título + mesmo usuário)
    FOR board_record IN
        SELECT title, created_by, MIN(created_at) as first_created
        FROM trello_boards
        WHERE is_deleted = false
        GROUP BY title, created_by
        HAVING COUNT(*) > 1
    LOOP
        -- Manter apenas o mais antigo
        UPDATE trello_boards
        SET is_deleted = true
        WHERE title = board_record.title
        AND created_by = board_record.created_by
        AND created_at > board_record.first_created
        AND is_deleted = false;
        
        GET DIAGNOSTICS duplicate_count = ROW_COUNT;
    END LOOP;
    
    RETURN format('Quadros duplicados removidos: %s', duplicate_count);
END;
$$ LANGUAGE plpgsql;
```

## 🔧 Melhorias no Frontend (Recomendadas)

### 1. **Debounce no Botão de Criar**
```typescript
const [isCreating, setIsCreating] = useState(false);

const handleCreateBoard = async (boardData: any) => {
  if (isCreating) return; // Prevenir múltiplas chamadas
  
  try {
    setIsCreating(true);
    
    if (boardData.board_type_id) {
      await createBoardWithType(boardData);
    } else {
      await createBoard(boardData);
    }
    
    setShowCreateBoard(false);
    fetchBoards();
  } catch (error) {
    console.error('Erro ao criar quadro:', error);
  } finally {
    setIsCreating(false);
  }
};
```

### 2. **Botão com Estado de Loading**
```tsx
<button
  onClick={() => setShowCreateBoard(true)}
  disabled={isCreating}
  className={`flex items-center gap-3 ${
    isCreating 
      ? 'opacity-50 cursor-not-allowed' 
      : 'hover:bg-white/30'
  } bg-white/20 text-white px-6 py-3 rounded-xl`}
>
  {isCreating ? (
    <>
      <Loader2 className="h-5 w-5 animate-spin" />
      Criando...
    </>
  ) : (
    <>
      <Rocket className="h-5 w-5" />
      Novo Quadro
    </>
  )}
</button>
```

### 3. **Validação no Hook**
```typescript
const createBoard = useCallback(async (boardData: { 
  title: string; 
  description?: string; 
  background_color?: string 
}) => {
  try {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Usar função segura
    const { data, error } = await supabase.rpc('create_board_safe', {
      board_title: boardData.title,
      board_description: boardData.description,
      background_color: boardData.background_color || '#0079bf'
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);
```

## 📋 Checklist de Implementação

### ✅ **Banco de Dados:**
- [x] Criar trigger de prevenção de duplicação
- [x] Implementar função `create_board_safe`
- [x] Equalizar políticas RLS para todos os usuários
- [x] Criar função de limpeza de duplicados
- [x] Atualizar função `create_board_with_type`
- [x] Verificar permissões de todos os usuários

### 🔄 **Frontend (Opcional):**
- [ ] Adicionar estado `isCreating` no componente
- [ ] Implementar debounce no botão
- [ ] Atualizar hook para usar função segura
- [ ] Adicionar feedback visual de loading
- [ ] Implementar timeout para requisições

### 🧪 **Testes:**
- [ ] Testar criação de quadro com usuário comum
- [ ] Testar criação rápida (double-click)
- [ ] Verificar se FELIPE ainda funciona normalmente
- [ ] Testar com múltiplos usuários simultaneamente
- [ ] Validar limpeza de duplicados existentes

## 🎯 **Resultados Esperados**

### ✅ **Após Implementação:**
1. **Criação única**: Apenas 1 quadro criado por vez
2. **Permissões iguais**: Todos os usuários com mesmas capacidades
3. **Prevenção automática**: Sistema bloqueia tentativas de duplicação
4. **Limpeza automática**: Duplicados existentes removidos
5. **Experiência consistente**: Mesmo comportamento para todos

### 📊 **Métricas de Sucesso:**
- **0 quadros duplicados** criados após implementação
- **100% dos usuários** conseguem criar quadros
- **Tempo de resposta** mantido ou melhorado
- **0 erros de permissão** para operações básicas

## 🚀 **Execução**

### 1. **Aplicar Script SQL:**
```bash
# Executar o arquivo fix-duplicate-board-creation.sql
psql -h [host] -U [user] -d [database] -f fix-duplicate-board-creation.sql
```

### 2. **Verificar Resultados:**
```sql
-- Verificar se não há mais duplicados
SELECT title, created_by, COUNT(*) as count
FROM trello_boards
WHERE is_deleted = false
GROUP BY title, created_by
HAVING COUNT(*) > 1;

-- Verificar permissões dos usuários
SELECT * FROM check_user_permissions();
```

### 3. **Testar Funcionalidade:**
- Fazer login com usuário diferente do FELIPE
- Tentar criar um novo quadro
- Verificar se apenas 1 quadro é criado
- Testar criação rápida (double-click)

## 🔍 **Monitoramento**

### Logs a Observar:
```sql
-- Verificar tentativas de duplicação bloqueadas
SELECT * FROM pg_stat_user_functions 
WHERE funcname = 'prevent_duplicate_board_creation';

-- Monitorar criações de quadros
SELECT 
    DATE(created_at) as date,
    COUNT(*) as boards_created,
    COUNT(DISTINCT created_by) as unique_users
FROM trello_boards
WHERE created_at > NOW() - INTERVAL '7 days'
AND is_deleted = false
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

A implementação desta correção deve resolver completamente o problema de criação dupla de quadros e garantir que todos os usuários tenham as mesmas permissões que o usuário FELIPE! 🎉