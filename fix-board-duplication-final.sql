-- Correção Final do Problema de Criação Dupla de Quadros no KazuFlow
-- Script limpo e sem erros de sintaxe

-- 1. Criar função para prevenir criação dupla de quadros
CREATE OR REPLACE FUNCTION prevent_duplicate_board_creation()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Verificar se já existe um quadro com o mesmo título criado pelo mesmo usuário nos últimos 5 segundos
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = NEW.title
    AND created_by = NEW.created_by
    AND created_at > (NOW() - INTERVAL '5 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro com título "%" já foi criado recentemente. Aguarde alguns segundos.', NEW.title;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicar trigger para prevenir duplicação
DROP TRIGGER IF EXISTS prevent_duplicate_board_trigger ON trello_boards;
CREATE TRIGGER prevent_duplicate_board_trigger
    BEFORE INSERT ON trello_boards
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_board_creation();

-- 3. Limpar quadros duplicados existentes
DO $$
DECLARE
    duplicate_record RECORD;
    removed_count INTEGER := 0;
    total_removed INTEGER := 0;
BEGIN
    -- Encontrar e remover quadros duplicados (mantendo o mais antigo)
    FOR duplicate_record IN
        SELECT title, created_by, MIN(created_at) as first_created, COUNT(*) as total_count
        FROM trello_boards
        WHERE is_deleted = false
        GROUP BY title, created_by
        HAVING COUNT(*) > 1
    LOOP
        -- Marcar como deletados todos os quadros duplicados exceto o primeiro
        UPDATE trello_boards
        SET is_deleted = true
        WHERE title = duplicate_record.title
        AND created_by = duplicate_record.created_by
        AND created_at > duplicate_record.first_created
        AND is_deleted = false;
        
        GET DIAGNOSTICS removed_count = ROW_COUNT;
        total_removed := total_removed + removed_count;
        
        RAISE NOTICE 'Removidos % quadros duplicados: "%"', removed_count, duplicate_record.title;
    END LOOP;
    
    RAISE NOTICE 'Limpeza de duplicados concluída! Total removido: %', total_removed;
END $$;

-- 4. Garantir políticas RLS consistentes para todos os usuários
-- Remover políticas antigas que podem estar causando problemas
DROP POLICY IF EXISTS "Users can only see their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only create their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only update their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only delete their own boards" ON trello_boards;

-- Criar política unificada e simples
CREATE POLICY "Users can manage their own boards" ON trello_boards
    FOR ALL USING (auth.uid() = created_by);

-- 5. Atualizar função get_user_boards_simple para funcionar para todos
CREATE OR REPLACE FUNCTION get_user_boards_simple()
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    background_color TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    member_role TEXT
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT 
        tb.id,
        tb.title,
        tb.description,
        tb.background_color,
        tb.created_by,
        tb.created_at,
        tb.updated_at,
        'owner'::TEXT as member_role
    FROM trello_boards tb
    WHERE tb.created_by = current_user_id
    AND tb.is_deleted = false
    ORDER BY tb.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atualizar função create_board_with_type para evitar duplicação
CREATE OR REPLACE FUNCTION create_board_with_type(
    board_title TEXT,
    board_description TEXT DEFAULT NULL,
    background_color TEXT DEFAULT '#0079bf',
    board_type_uuid UUID DEFAULT NULL,
    process_number TEXT DEFAULT NULL,
    responsible_person TEXT DEFAULT NULL,
    company TEXT DEFAULT NULL,
    object_description TEXT DEFAULT NULL,
    process_value DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    new_board_id UUID;
    result JSON;
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
        RAISE EXCEPTION 'Quadro com título "%" já foi criado recentemente. Aguarde alguns segundos.', board_title;
    END IF;
    
    -- Criar o quadro
    INSERT INTO trello_boards (title, description, background_color, created_by)
    VALUES (board_title, board_description, background_color, current_user_id)
    RETURNING id INTO new_board_id;
    
    -- Criar listas baseadas no tipo ou padrão
    IF board_type_uuid IS NOT NULL THEN
        -- Listas para processos administrativos
        INSERT INTO trello_lists (board_id, title, position) VALUES
        (new_board_id, 'Documentação', 0),
        (new_board_id, 'Análise', 1),
        (new_board_id, 'Aprovação', 2),
        (new_board_id, 'Execução', 3),
        (new_board_id, 'Finalizado', 4);
    ELSE
        -- Listas padrão
        INSERT INTO trello_lists (board_id, title, position) VALUES
        (new_board_id, 'A Fazer', 0),
        (new_board_id, 'Em Progresso', 1),
        (new_board_id, 'Concluído', 2);
    END IF;
    
    -- Retornar resultado
    SELECT json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'background_color', background_color,
        'created_by', created_by,
        'created_at', created_at,
        'updated_at', updated_at,
        'member_role', 'owner'
    ) INTO result
    FROM trello_boards
    WHERE id = new_board_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Garantir permissões para todas as funções
GRANT EXECUTE ON FUNCTION get_user_boards_simple TO authenticated;
GRANT EXECUTE ON FUNCTION create_board_with_type TO authenticated;

-- 8. Verificação final - mostrar estatísticas
SELECT 
    'Correção aplicada com sucesso!' as status,
    COUNT(*) as total_boards_ativos,
    COUNT(DISTINCT created_by) as total_usuarios
FROM trello_boards 
WHERE is_deleted = false;

-- 9. Verificar se ainda existem duplicados
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'Nenhum quadro duplicado encontrado ✓'
        ELSE 'ATENÇÃO: Ainda existem ' || COUNT(*) || ' quadros duplicados!'
    END as status_duplicados
FROM (
    SELECT title, created_by
    FROM trello_boards
    WHERE is_deleted = false
    GROUP BY title, created_by
    HAVING COUNT(*) > 1
) duplicates;

-- 10. Mostrar quadros por usuário
SELECT 
    u.email,
    COUNT(tb.id) as quadros_criados,
    MAX(tb.created_at) as ultimo_quadro
FROM auth.users u
LEFT JOIN trello_boards tb ON tb.created_by = u.id AND tb.is_deleted = false
GROUP BY u.id, u.email
HAVING COUNT(tb.id) > 0
ORDER BY quadros_criados DESC;

-- 11. Mensagens finais dentro de bloco DO
DO $$
BEGIN
    RAISE NOTICE '=== CORREÇÃO CONCLUÍDA ===';
    RAISE NOTICE 'Correção do problema de criação dupla de quadros concluída!';
    RAISE NOTICE 'Agora todos os usuários devem conseguir criar quadros normalmente.';
    RAISE NOTICE 'O sistema irá prevenir automaticamente a criação de quadros duplicados.';
    RAISE NOTICE '========================';
END $$;