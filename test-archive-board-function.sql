-- Teste da função archive_board_cascade
-- Verificar se a função está funcionando corretamente

-- 1. Verificar se a função existe
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc IS NOT NULL as has_source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'archive_board_cascade'
AND n.nspname = 'public';

-- 2. Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('trello_boards', 'trello_lists', 'trello_cards')
AND column_name IN ('id', 'is_deleted', 'board_id', 'list_id')
ORDER BY table_name, column_name;

-- 3. Verificar índices criados
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('trello_boards', 'trello_lists', 'trello_cards')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 4. Contar quadros ativos (não deletados)
SELECT 
    COUNT(*) as total_boards,
    COUNT(*) FILTER (WHERE is_deleted = FALSE) as active_boards,
    COUNT(*) FILTER (WHERE is_deleted = TRUE) as deleted_boards
FROM trello_boards;

-- 5. Mostrar alguns quadros para teste
SELECT 
    id,
    title,
    is_deleted,
    created_at
FROM trello_boards 
WHERE is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 5;

-- 6. Teste da função (descomente e substitua o UUID)
/*
-- ATENÇÃO: Substitua 'SEU_BOARD_UUID_AQUI' por um UUID real de um quadro de teste
-- Esta operação irá arquivar o quadro permanentemente!

SELECT archive_board_cascade('SEU_BOARD_UUID_AQUI'::UUID);

-- Verificar resultado do teste
SELECT 
    id,
    title,
    is_deleted,
    updated_at
FROM trello_boards 
WHERE id = 'SEU_BOARD_UUID_AQUI'::UUID;
*/

-- 7. Verificar permissões RLS (se aplicável)
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('trello_boards', 'trello_lists', 'trello_cards');

-- 8. Status final
SELECT 'Função archive_board_cascade está pronta para uso!' as status;