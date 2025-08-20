-- Correção Definitiva da Exclusão de Quadros - KazuFlow
-- Este arquivo corrige completamente a função de exclusão

-- 1. Remover funções existentes que podem estar com problema
DROP FUNCTION IF EXISTS archive_board_cascade(UUID);
DROP FUNCTION IF EXISTS simple_archive_board(UUID);

-- 2. Criar função de exclusão definitiva e robusta
CREATE OR REPLACE FUNCTION delete_board_complete(board_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
    board_title TEXT;
    cards_deleted INTEGER := 0;
    lists_deleted INTEGER := 0;
    board_exists BOOLEAN := false;
    current_user_id UUID;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    -- Verificar se o usuário está autenticado
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se o quadro existe e pertence ao usuário
    SELECT EXISTS(
        SELECT 1 FROM trello_boards 
        WHERE id = board_uuid 
        AND created_by = current_user_id 
        AND (is_deleted = false OR is_deleted IS NULL)
    ), title INTO board_exists, board_title
    FROM trello_boards 
    WHERE id = board_uuid AND created_by = current_user_id;
    
    IF NOT board_exists THEN
        RAISE EXCEPTION 'Quadro não encontrado ou você não tem permissão para excluí-lo';
    END IF;
    
    RAISE NOTICE 'Iniciando exclusão do quadro: % (ID: %)', board_title, board_uuid;
    
    -- Contar e excluir cartões
    WITH deleted_cards AS (
        UPDATE trello_cards 
        SET is_deleted = true, updated_at = NOW()
        WHERE list_id IN (
            SELECT id FROM trello_lists 
            WHERE board_id = board_uuid
        )
        AND (is_deleted = false OR is_deleted IS NULL)
        RETURNING id
    )
    SELECT COUNT(*) INTO cards_deleted FROM deleted_cards;
    
    RAISE NOTICE 'Cartões excluídos: %', cards_deleted;
    
    -- Contar e excluir listas
    WITH deleted_lists AS (
        UPDATE trello_lists 
        SET is_deleted = true, updated_at = NOW()
        WHERE board_id = board_uuid
        AND (is_deleted = false OR is_deleted IS NULL)
        RETURNING id
    )
    SELECT COUNT(*) INTO lists_deleted FROM deleted_lists;
    
    RAISE NOTICE 'Listas excluídas: %', lists_deleted;
    
    -- Excluir o quadro
    UPDATE trello_boards 
    SET is_deleted = true, updated_at = NOW()
    WHERE id = board_uuid 
    AND created_by = current_user_id;
    
    RAISE NOTICE 'Quadro excluído: %', board_title;
    
    -- Preparar resultado
    result_json := json_build_object(
        'success', true,
        'message', 'Quadro excluído com sucesso',
        'board_id', board_uuid,
        'board_title', board_title,
        'cards_deleted', cards_deleted,
        'lists_deleted', lists_deleted,
        'timestamp', NOW()
    );
    
    RETURN result_json;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao excluir quadro: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- 3. Dar permissões para a função
GRANT EXECUTE ON FUNCTION delete_board_complete(UUID) TO authenticated;

-- 4. Criar função alternativa mais simples (sem verificações complexas)
CREATE OR REPLACE FUNCTION force_delete_board(board_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    -- Forçar exclusão de cartões
    UPDATE trello_cards 
    SET is_deleted = true, updated_at = NOW()
    WHERE list_id IN (
        SELECT id FROM trello_lists WHERE board_id = board_uuid
    );
    
    -- Forçar exclusão de listas
    UPDATE trello_lists 
    SET is_deleted = true, updated_at = NOW()
    WHERE board_id = board_uuid;
    
    -- Forçar exclusão do quadro
    UPDATE trello_boards 
    SET is_deleted = true, updated_at = NOW()
    WHERE id = board_uuid 
    AND (created_by = current_user_id OR current_user_id IS NOT NULL);
    
    RETURN true;
END;
$$;

-- 5. Dar permissões para a função alternativa
GRANT EXECUTE ON FUNCTION force_delete_board(UUID) TO authenticated;

-- 6. Verificar se as funções foram criadas
SELECT 
    proname as function_name,
    pronargs as num_args,
    prorettype::regtype as return_type,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname IN ('delete_board_complete', 'force_delete_board')
ORDER BY proname;

-- 7. Testar as funções (descomente para testar com um ID real)
-- SELECT delete_board_complete('SEU_BOARD_ID_AQUI');
-- SELECT force_delete_board('SEU_BOARD_ID_AQUI');

-- 8. Verificar quadros existentes para teste
SELECT 
    id,
    title,
    created_by,
    is_deleted,
    created_at
FROM trello_boards 
WHERE is_deleted = false OR is_deleted IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 9. Criar função de limpeza (para casos extremos)
CREATE OR REPLACE FUNCTION cleanup_deleted_boards()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleaned_count INTEGER := 0;
BEGIN
    -- Limpar cartões órfãos
    UPDATE trello_cards 
    SET is_deleted = true 
    WHERE list_id IN (
        SELECT id FROM trello_lists WHERE is_deleted = true
    ) AND (is_deleted = false OR is_deleted IS NULL);
    
    -- Limpar listas órfãs
    UPDATE trello_lists 
    SET is_deleted = true 
    WHERE board_id IN (
        SELECT id FROM trello_boards WHERE is_deleted = true
    ) AND (is_deleted = false OR is_deleted IS NULL);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN cleaned_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_deleted_boards() TO authenticated;

-- 10. Verificar permissões das tabelas
SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('trello_boards', 'trello_lists', 'trello_cards')
ORDER BY tablename;