-- Teste da função create_board_with_type
-- Verificar se a função está funcionando corretamente

-- 1. Verificar se a função existe com a assinatura correta
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc IS NOT NULL as has_source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';

-- 2. Verificar se as tabelas necessárias existem
SELECT 
    'trello_boards' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'trello_boards') as exists
UNION ALL
SELECT 
    'trello_board_types' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'trello_board_types') as exists
UNION ALL
SELECT 
    'trello_lists' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'trello_lists') as exists;

-- 3. Verificar se existem tipos de processo cadastrados
SELECT 
    COUNT(*) as total_board_types,
    COUNT(*) > 0 as has_board_types
FROM trello_board_types 
WHERE is_active = TRUE;

-- 4. Mostrar alguns tipos disponíveis
SELECT 
    id,
    name,
    color
FROM trello_board_types 
WHERE is_active = TRUE 
ORDER BY name 
LIMIT 5;

-- 5. Teste da função (descomente para executar)
/*
-- Primeiro, pegar um tipo de processo válido
DO $$
DECLARE
    test_board_type_id UUID;
    test_result JSON;
BEGIN
    -- Pegar o primeiro tipo de processo ativo
    SELECT id INTO test_board_type_id 
    FROM trello_board_types 
    WHERE is_active = TRUE 
    LIMIT 1;
    
    IF test_board_type_id IS NOT NULL THEN
        -- Testar a função
        SELECT create_board_with_type(
            '#0079bf',                           -- background_color
            'Descrição do processo de teste',    -- board_description  
            'Processo de Teste - ' || NOW(),     -- board_title
            test_board_type_id,                  -- board_type_uuid
            'Empresa Teste Ltda',                -- company
            'Objeto de teste para validação',    -- object_description
            'PROC-2024-' || EXTRACT(EPOCH FROM NOW())::INTEGER, -- process_number
            1500.50,                             -- process_value
            'João Silva'                         -- responsible_person
        ) INTO test_result;
        
        RAISE NOTICE 'Teste executado com sucesso! Resultado: %', test_result;
    ELSE
        RAISE NOTICE 'Nenhum tipo de processo encontrado. Execute primeiro o script de tipos de processo.';
    END IF;
END $$;
*/