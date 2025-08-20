-- 🧪 TESTE DA FUNÇÃO DE EXCLUSÃO DE QUADROS

-- 1. Verificar se a função existe
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    provolatile as volatility
FROM pg_proc 
WHERE proname = 'emergency_delete_board';

-- 2. Verificar permissões da função
SELECT 
    p.proname,
    r.rolname,
    a.privilege_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN information_schema.routine_privileges a ON a.routine_name = p.proname
LEFT JOIN pg_roles r ON r.rolname = a.grantee
WHERE p.proname = 'emergency_delete_board'
AND n.nspname = 'public';

-- 3. Listar quadros existentes (para teste)
SELECT 
    id,
    title,
    created_by,
    is_deleted,
    created_at
FROM trello_boards 
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 5;

-- 4. Função de teste (descomente e substitua o ID para testar)
-- SELECT emergency_delete_board('SEU_BOARD_ID_AQUI');

-- 5. Verificar se a exclusão funcionou (após executar o teste)
-- SELECT 
--     id,
--     title,
--     is_deleted,
--     updated_at
-- FROM trello_boards 
-- WHERE id = 'SEU_BOARD_ID_AQUI';

-- 6. Verificar listas e cartões também foram excluídos
-- SELECT 
--     'Lists' as type,
--     COUNT(*) as total,
--     COUNT(CASE WHEN is_deleted THEN 1 END) as deleted
-- FROM trello_lists 
-- WHERE board_id = 'SEU_BOARD_ID_AQUI'
-- UNION ALL
-- SELECT 
--     'Cards' as type,
--     COUNT(*) as total,
--     COUNT(CASE WHEN is_deleted THEN 1 END) as deleted
-- FROM trello_cards 
-- WHERE list_id IN (
--     SELECT id FROM trello_lists WHERE board_id = 'SEU_BOARD_ID_AQUI'
-- );

-- 7. Criar função de teste mais segura
CREATE OR REPLACE FUNCTION test_delete_board_function()
RETURNS TABLE(
    test_name TEXT,
    result TEXT,
    details TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    test_board_id UUID;
    function_exists BOOLEAN;
    delete_result BOOLEAN;
BEGIN
    -- Teste 1: Verificar se a função existe
    SELECT EXISTS(
        SELECT 1 FROM pg_proc WHERE proname = 'emergency_delete_board'
    ) INTO function_exists;
    
    RETURN QUERY SELECT 
        'Function Exists'::TEXT,
        CASE WHEN function_exists THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN function_exists THEN 'emergency_delete_board function found' 
             ELSE 'emergency_delete_board function NOT found' END::TEXT;
    
    -- Se a função não existe, parar aqui
    IF NOT function_exists THEN
        RETURN;
    END IF;
    
    -- Teste 2: Criar um quadro de teste
    INSERT INTO trello_boards (title, background_color, created_by)
    VALUES ('TESTE DELETE', '#ff0000', (SELECT auth.uid()))
    RETURNING id INTO test_board_id;
    
    RETURN QUERY SELECT 
        'Test Board Created'::TEXT,
        'PASS'::TEXT,
        ('Test board created with ID: ' || test_board_id::TEXT)::TEXT;
    
    -- Teste 3: Tentar excluir o quadro
    BEGIN
        SELECT emergency_delete_board(test_board_id) INTO delete_result;
        
        RETURN QUERY SELECT 
            'Delete Function Call'::TEXT,
            CASE WHEN delete_result THEN 'PASS' ELSE 'FAIL' END::TEXT,
            ('Function returned: ' || delete_result::TEXT)::TEXT;
            
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Delete Function Call'::TEXT,
            'ERROR'::TEXT,
            ('Error: ' || SQLERRM)::TEXT;
        RETURN;
    END;
    
    -- Teste 4: Verificar se o quadro foi marcado como excluído
    DECLARE
        is_deleted_check BOOLEAN;
    BEGIN
        SELECT is_deleted INTO is_deleted_check
        FROM trello_boards 
        WHERE id = test_board_id;
        
        RETURN QUERY SELECT 
            'Board Marked Deleted'::TEXT,
            CASE WHEN is_deleted_check THEN 'PASS' ELSE 'FAIL' END::TEXT,
            ('Board is_deleted = ' || is_deleted_check::TEXT)::TEXT;
    END;
    
    -- Limpeza: remover o quadro de teste
    DELETE FROM trello_boards WHERE id = test_board_id;
    
    RETURN QUERY SELECT 
        'Cleanup'::TEXT,
        'PASS'::TEXT,
        'Test board removed'::TEXT;
        
END;
$$;

-- 8. Executar teste
SELECT * FROM test_delete_board_function();

-- 9. Remover função de teste
DROP FUNCTION IF EXISTS test_delete_board_function();