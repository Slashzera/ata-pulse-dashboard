-- Teste da implementação das listas padrão para processos administrativos
-- Este arquivo testa se a função create_board_with_type está criando as listas corretas

-- 1. Verificar se a função existe e está correta
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.pronargs as num_args,
    p.prosrc LIKE '%Pendente de Cadastro%' as has_default_lists
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public'
ORDER BY p.pronargs;

-- 2. Verificar se existem tipos de processo para teste
SELECT 
    id,
    name,
    color,
    is_active
FROM trello_board_types 
WHERE is_active = TRUE 
LIMIT 5;

-- 3. Teste prático (descomente para executar)
/*
DO $
DECLARE
    test_board_type_id UUID;
    test_result JSON;
    board_id UUID;
    lists_count INTEGER;
    expected_lists TEXT[] := ARRAY[
        'Pendente de Cadastro',
        'Em Análise pelo Processante', 
        'Confeccionando Autorização de Fornecimento',
        'Fundo Municipal de Saúde - Aguardando Autorizo de Empenho',
        'Empenho - Subsecretaria de Execução Orçamentária',
        'Procuradoria-Geral do Município - Fazer Contrato',
        'Processo Finalizado - Arquivado no Fundo Municipal de Saúde',
        'Processo no Armário com Saldo Disponível - Aguardando Pedido Departamento'
    ];
    list_titles TEXT[];
BEGIN
    -- Buscar um tipo de processo para teste
    SELECT id INTO test_board_type_id 
    FROM trello_board_types 
    WHERE is_active = TRUE 
    LIMIT 1;
    
    IF test_board_type_id IS NOT NULL THEN
        -- Criar um quadro de teste
        SELECT create_board_with_type(
            '#0079bf',                                    -- background_color
            'Descrição do processo de teste',             -- board_description  
            'TESTE - Processo Automático',                -- board_title
            test_board_type_id,                          -- board_type_uuid
            'Empresa Teste Ltda',                        -- company
            'Objeto: Aquisição de material de teste',    -- object_description
            'PROC-2024-TESTE-001',                       -- process_number
            1500.00,                                     -- process_value
            'João da Silva'                              -- responsible_person
        ) INTO test_result;
        
        -- Extrair ID do quadro criado
        board_id := (test_result->>'id')::UUID;
        
        -- Verificar quantas listas foram criadas
        SELECT COUNT(*) INTO lists_count
        FROM trello_lists 
        WHERE board_id = board_id 
        AND is_deleted = FALSE;
        
        -- Buscar títulos das listas criadas
        SELECT array_agg(title ORDER BY position) INTO list_titles
        FROM trello_lists 
        WHERE board_id = board_id 
        AND is_deleted = FALSE;
        
        -- Exibir resultados do teste
        RAISE NOTICE '=== RESULTADO DO TESTE ===';
        RAISE NOTICE 'Quadro criado: %', board_id;
        RAISE NOTICE 'Número de listas criadas: % (esperado: 8)', lists_count;
        RAISE NOTICE 'Listas criadas: %', list_titles;
        
        -- Verificar se as listas estão corretas
        IF lists_count = 8 AND list_titles = expected_lists THEN
            RAISE NOTICE '✅ TESTE PASSOU: Todas as listas foram criadas corretamente!';
        ELSE
            RAISE NOTICE '❌ TESTE FALHOU: Listas não conferem com o esperado';
            RAISE NOTICE 'Esperado: %', expected_lists;
            RAISE NOTICE 'Recebido: %', list_titles;
        END IF;
        
        -- Limpar dados de teste (opcional - descomente para limpar)
        -- DELETE FROM trello_cards WHERE list_id IN (SELECT id FROM trello_lists WHERE board_id = board_id);
        -- DELETE FROM trello_lists WHERE board_id = board_id;
        -- DELETE FROM trello_boards WHERE id = board_id;
        -- RAISE NOTICE 'Dados de teste removidos';
        
    ELSE
        RAISE NOTICE '❌ ERRO: Nenhum tipo de processo encontrado para teste';
    END IF;
END;
$;
*/

-- 4. Consulta para verificar listas de um quadro específico (substitua o ID)
/*
SELECT 
    b.title as board_title,
    l.title as list_title,
    l.position,
    l.created_at
FROM trello_boards b
JOIN trello_lists l ON b.id = l.board_id
WHERE b.id = 'SEU_BOARD_ID_AQUI'  -- Substitua pelo ID do quadro
AND l.is_deleted = FALSE
ORDER BY l.position;
*/

-- 5. Verificar últimos quadros criados com suas listas
SELECT 
    b.title as board_title,
    b.process_number,
    b.created_at as board_created,
    COUNT(l.id) as lists_count,
    string_agg(l.title, ' | ' ORDER BY l.position) as list_titles
FROM trello_boards b
LEFT JOIN trello_lists l ON b.id = l.board_id AND l.is_deleted = FALSE
WHERE b.created_at > NOW() - INTERVAL '1 day'  -- Quadros criados nas últimas 24h
GROUP BY b.id, b.title, b.process_number, b.created_at
ORDER BY b.created_at DESC
LIMIT 5;