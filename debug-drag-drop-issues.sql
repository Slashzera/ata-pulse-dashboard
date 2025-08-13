-- Diagnóstico de problemas no drag and drop
-- Este arquivo ajuda a identificar possíveis causas de travamento

-- 1. Verificar se a função move_card_to_list existe e está funcionando
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc LIKE '%calculated_position%' as has_position_logic,
    CASE 
        WHEN p.oid IS NOT NULL THEN '✅ Função existe'
        ELSE '❌ Função não encontrada'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'move_card_to_list'
AND n.nspname = 'public';

-- 2. Verificar se a tabela trello_activities existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'trello_activities'
        ) 
        THEN '✅ Tabela trello_activities existe'
        ELSE '❌ Tabela trello_activities não existe'
    END as activities_table_status;

-- 3. Verificar cartões com posições problemáticas
SELECT 
    'Cartões com posições duplicadas' as issue_type,
    l.title as list_title,
    COUNT(*) as cards_count,
    c.position
FROM trello_cards c
JOIN trello_lists l ON c.list_id = l.id
WHERE c.is_deleted = FALSE
GROUP BY l.id, l.title, c.position
HAVING COUNT(*) > 1
ORDER BY l.title, c.position;

-- 4. Verificar cartões com posições negativas
SELECT 
    'Cartões com posições negativas' as issue_type,
    l.title as list_title,
    c.title as card_title,
    c.position,
    c.id as card_id
FROM trello_cards c
JOIN trello_lists l ON c.list_id = l.id
WHERE c.is_deleted = FALSE
AND c.position < 0
ORDER BY l.title, c.position;

-- 5. Verificar lacunas grandes nas posições
WITH position_gaps AS (
    SELECT 
        l.title as list_title,
        c.position,
        LAG(c.position) OVER (PARTITION BY l.id ORDER BY c.position) as prev_position,
        c.position - LAG(c.position) OVER (PARTITION BY l.id ORDER BY c.position) as gap
    FROM trello_cards c
    JOIN trello_lists l ON c.list_id = l.id
    WHERE c.is_deleted = FALSE
)
SELECT 
    'Lacunas grandes nas posições' as issue_type,
    list_title,
    prev_position,
    position,
    gap
FROM position_gaps
WHERE gap > 10  -- Lacunas maiores que 10
ORDER BY list_title, position;

-- 6. Verificar cartões órfãos (sem lista válida)
SELECT 
    'Cartões órfãos' as issue_type,
    c.id as card_id,
    c.title as card_title,
    c.list_id,
    'Lista não existe ou foi deletada' as problem
FROM trello_cards c
LEFT JOIN trello_lists l ON c.list_id = l.id
WHERE c.is_deleted = FALSE
AND (l.id IS NULL OR l.is_deleted = TRUE);

-- 7. Verificar se há transações em aberto ou locks
SELECT 
    'Transações ativas' as issue_type,
    pid,
    state,
    query_start,
    query,
    wait_event_type,
    wait_event
FROM pg_stat_activity 
WHERE state != 'idle' 
AND query LIKE '%trello_cards%'
OR query LIKE '%move_card_to_list%';

-- 8. Testar a função move_card_to_list com dados de exemplo
DO $$
DECLARE
    test_card_id UUID;
    test_source_list UUID;
    test_target_list UUID;
    test_result JSON;
BEGIN
    -- Buscar um cartão para teste
    SELECT c.id, c.list_id INTO test_card_id, test_source_list
    FROM trello_cards c
    JOIN trello_lists l ON c.list_id = l.id
    WHERE c.is_deleted = FALSE
    AND l.is_deleted = FALSE
    LIMIT 1;
    
    -- Buscar uma lista diferente para teste
    SELECT l.id INTO test_target_list
    FROM trello_lists l
    WHERE l.is_deleted = FALSE
    AND l.id != test_source_list
    LIMIT 1;
    
    IF test_card_id IS NOT NULL AND test_target_list IS NOT NULL THEN
        BEGIN
            -- Testar a função (sem realmente mover)
            RAISE NOTICE 'Testando função move_card_to_list...';
            RAISE NOTICE 'Card ID: %, Source: %, Target: %', test_card_id, test_source_list, test_target_list;
            
            -- Simular o teste sem executar
            RAISE NOTICE '✅ Função pode ser testada com estes parâmetros';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro ao testar função: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ Não foi possível encontrar dados para teste';
    END IF;
END;
$$;

-- 9. Verificar permissões RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('trello_cards', 'trello_lists', 'trello_activities')
ORDER BY tablename, policyname;

-- 10. Resumo do diagnóstico
SELECT 
    '=== RESUMO DO DIAGNÓSTICO ===' as title,
    'Execute as consultas acima para identificar problemas' as instruction,
    'Procure por ❌ nas mensagens de status' as tip;