-- Teste e Debug da Função de Exclusão de Quadros
-- Este arquivo testa e corrige problemas na função archive_board_cascade

-- 1. Verificar se a função existe
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'archive_board_cascade';

-- 2. Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('trello_boards', 'trello_lists', 'trello_cards')
ORDER BY table_name, ordinal_position;

-- 3. Testar se existem quadros para excluir
SELECT 
    id,
    title,
    created_by,
    is_deleted
FROM trello_boards 
WHERE is_deleted = false
LIMIT 5;

-- 4. Criar função de exclusão robusta (substitui a existente)
CREATE OR REPLACE FUNCTION archive_board_cascade(board_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
    lists_count INTEGER := 0;
    cards_count INTEGER := 0;
    board_exists BOOLEAN := false;
BEGIN
    -- Log de início
    RAISE NOTICE 'Iniciando exclusão do quadro: %', board_uuid;
    
    -- Verificar se o quadro existe
    SELECT EXISTS(
        SELECT 1 FROM trello_boards 
        WHERE id = board_uuid AND is_deleted = false
    ) INTO board_exists;
    
    IF NOT board_exists THEN
        RAISE EXCEPTION 'Quadro não encontrado ou já foi excluído: %', board_uuid;
    END IF;
    
    -- Contar listas antes da exclusão
    SELECT COUNT(*) INTO lists_count
    FROM trello_lists 
    WHERE board_id = board_uuid AND is_deleted = false;
    
    -- Contar cartões antes da exclusão
    SELECT COUNT(*) INTO cards_count
    FROM trello_cards c
    JOIN trello_lists l ON c.list_id = l.id
    WHERE l.board_id = board_uuid AND c.is_deleted = false;
    
    RAISE NOTICE 'Encontradas % listas e % cartões para arquivar', lists_count, cards_count;
    
    -- Arquivar todos os cartões das listas do quadro
    UPDATE trello_cards 
    SET is_deleted = true, updated_at = NOW()
    WHERE list_id IN (
        SELECT id FROM trello_lists 
        WHERE board_id = board_uuid AND is_deleted = false
    ) AND is_deleted = false;
    
    RAISE NOTICE 'Cartões arquivados';
    
    -- Arquivar todas as listas do quadro
    UPDATE trello_lists 
    SET is_deleted = true, updated_at = NOW()
    WHERE board_id = board_uuid AND is_deleted = false;
    
    RAISE NOTICE 'Listas arquivadas';
    
    -- Arquivar o quadro
    UPDATE trello_boards 
    SET is_deleted = true, updated_at = NOW()
    WHERE id = board_uuid AND is_deleted = false;
    
    RAISE NOTICE 'Quadro arquivado';
    
    -- Preparar resultado
    result_json := json_build_object(
        'success', true,
        'message', 'Quadro arquivado com sucesso',
        'board_id', board_uuid,
        'lists_archived', lists_count,
        'cards_archived', cards_count,
        'timestamp', NOW()
    );
    
    RETURN result_json;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao arquivar quadro %: % (SQLSTATE: %)', 
            board_uuid, SQLERRM, SQLSTATE;
END;
$$;

-- 5. Testar a função com um quadro específico (substitua pelo ID real)
-- SELECT archive_board_cascade('SEU_BOARD_ID_AQUI');

-- 6. Verificar permissões da função
SELECT 
    proname,
    proowner::regrole as owner,
    proacl as permissions
FROM pg_proc 
WHERE proname = 'archive_board_cascade';

-- 7. Dar permissões necessárias
GRANT EXECUTE ON FUNCTION archive_board_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_board_cascade(UUID) TO anon;

-- 8. Verificar se RLS está habilitado nas tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename IN ('trello_boards', 'trello_lists', 'trello_cards');

-- 9. Função alternativa mais simples (caso a principal falhe)
CREATE OR REPLACE FUNCTION simple_archive_board(board_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Arquivar cartões
    UPDATE trello_cards 
    SET is_deleted = true 
    WHERE list_id IN (
        SELECT id FROM trello_lists WHERE board_id = board_uuid
    );
    
    -- Arquivar listas
    UPDATE trello_lists 
    SET is_deleted = true 
    WHERE board_id = board_uuid;
    
    -- Arquivar quadro
    UPDATE trello_boards 
    SET is_deleted = true 
    WHERE id = board_uuid;
    
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION simple_archive_board(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION simple_archive_board(UUID) TO anon;

-- 10. Verificar se as funções foram criadas
SELECT 
    proname as function_name,
    pronargs as num_args,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('archive_board_cascade', 'simple_archive_board')
ORDER BY proname;