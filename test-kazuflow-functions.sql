-- 🧪 TESTE COMPLETO DAS FUNÇÕES KAZUFLOW

-- ========================================
-- 1. VERIFICAR SE TODAS AS FUNÇÕES EXISTEM
-- ========================================

SELECT 
    proname as "Função",
    CASE WHEN prosecdef THEN 'Sim' ELSE 'Não' END as "Security Definer",
    pronargs as "Parâmetros"
FROM pg_proc 
WHERE proname IN (
    'emergency_delete_board',
    'update_board_title', 
    'update_board_color',
    'copy_board',
    'get_board_complete_data'
)
ORDER BY proname;

-- ========================================
-- 2. LISTAR QUADROS PARA TESTE
-- ========================================

SELECT 
    id,
    title,
    background_color,
    created_by,
    is_deleted,
    created_at
FROM trello_boards 
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 3. TESTE DA FUNÇÃO DE BUSCAR DADOS
-- ========================================

-- Descomente e substitua o ID para testar:
-- SELECT get_board_complete_data('SEU_BOARD_ID_AQUI');

-- ========================================
-- 4. TESTE DA FUNÇÃO DE EDITAR TÍTULO
-- ========================================

-- Descomente e substitua o ID para testar:
-- SELECT update_board_title('SEU_BOARD_ID_AQUI', 'Novo Título de Teste');

-- ========================================
-- 5. TESTE DA FUNÇÃO DE MUDAR COR
-- ========================================

-- Descomente e substitua o ID para testar:
-- SELECT update_board_color('SEU_BOARD_ID_AQUI', '#ff5733');

-- ========================================
-- 6. TESTE DA FUNÇÃO DE COPIAR QUADRO
-- ========================================

-- Descomente e substitua o ID para testar:
-- SELECT copy_board('SEU_BOARD_ID_AQUI', 'Cópia do Quadro Teste');

-- ========================================
-- 7. TESTE DA FUNÇÃO DE EXCLUSÃO
-- ========================================

-- Descomente e substitua o ID para testar:
-- SELECT emergency_delete_board('SEU_BOARD_ID_AQUI');

-- ========================================
-- 8. VERIFICAR PERMISSÕES DAS FUNÇÕES
-- ========================================

SELECT 
    p.proname as "Função",
    r.rolname as "Role",
    a.privilege_type as "Permissão"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN information_schema.routine_privileges a ON a.routine_name = p.proname
LEFT JOIN pg_roles r ON r.rolname = a.grantee
WHERE p.proname IN (
    'emergency_delete_board',
    'update_board_title', 
    'update_board_color',
    'copy_board',
    'get_board_complete_data'
)
AND n.nspname = 'public'
ORDER BY p.proname, r.rolname;

-- ========================================
-- 9. FUNÇÃO DE TESTE AUTOMATIZADO
-- ========================================

CREATE OR REPLACE FUNCTION test_all_kazuflow_functions()
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
    test_result BOOLEAN;
    new_board_id UUID;
BEGIN
    -- Teste 1: Verificar se todas as funções existem
    SELECT COUNT(*) = 5 INTO function_exists
    FROM pg_proc 
    WHERE proname IN (
        'emergency_delete_board',
        'update_board_title', 
        'update_board_color',
        'copy_board',
        'get_board_complete_data'
    );
    
    RETURN QUERY SELECT 
        'Funções Existem'::TEXT,
        CASE WHEN function_exists THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN function_exists THEN 'Todas as 5 funções encontradas' 
             ELSE 'Algumas funções estão faltando' END::TEXT;
    
    -- Se as funções não existem, parar aqui
    IF NOT function_exists THEN
        RETURN;
    END IF;
    
    -- Teste 2: Criar um quadro de teste
    INSERT INTO trello_boards (title, background_color, created_by)
    VALUES ('TESTE KAZUFLOW', '#0079bf', (SELECT auth.uid()))
    RETURNING id INTO test_board_id;
    
    RETURN QUERY SELECT 
        'Quadro de Teste Criado'::TEXT,
        'PASS'::TEXT,
        ('Quadro criado com ID: ' || test_board_id::TEXT)::TEXT;
    
    -- Teste 3: Buscar dados do quadro
    BEGIN
        PERFORM get_board_complete_data(test_board_id);
        RETURN QUERY SELECT 
            'Buscar Dados'::TEXT,
            'PASS'::TEXT,
            'Função get_board_complete_data funcionou'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Buscar Dados'::TEXT,
            'FAIL'::TEXT,
            ('Erro: ' || SQLERRM)::TEXT;
    END;
    
    -- Teste 4: Editar título
    BEGIN
        SELECT update_board_title(test_board_id, 'Título Editado') INTO test_result;
        RETURN QUERY SELECT 
            'Editar Título'::TEXT,
            CASE WHEN test_result THEN 'PASS' ELSE 'FAIL' END::TEXT,
            ('Resultado: ' || test_result::TEXT)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Editar Título'::TEXT,
            'FAIL'::TEXT,
            ('Erro: ' || SQLERRM)::TEXT;
    END;
    
    -- Teste 5: Mudar cor
    BEGIN
        SELECT update_board_color(test_board_id, '#ff5733') INTO test_result;
        RETURN QUERY SELECT 
            'Mudar Cor'::TEXT,
            CASE WHEN test_result THEN 'PASS' ELSE 'FAIL' END::TEXT,
            ('Resultado: ' || test_result::TEXT)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Mudar Cor'::TEXT,
            'FAIL'::TEXT,
            ('Erro: ' || SQLERRM)::TEXT;
    END;
    
    -- Teste 6: Copiar quadro
    BEGIN
        SELECT copy_board(test_board_id, 'Cópia de Teste') INTO new_board_id;
        RETURN QUERY SELECT 
            'Copiar Quadro'::TEXT,
            CASE WHEN new_board_id IS NOT NULL THEN 'PASS' ELSE 'FAIL' END::TEXT,
            ('Novo quadro ID: ' || COALESCE(new_board_id::TEXT, 'NULL'))::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Copiar Quadro'::TEXT,
            'FAIL'::TEXT,
            ('Erro: ' || SQLERRM)::TEXT;
    END;
    
    -- Teste 7: Excluir quadro
    BEGIN
        SELECT emergency_delete_board(test_board_id) INTO test_result;
        RETURN QUERY SELECT 
            'Excluir Quadro'::TEXT,
            CASE WHEN test_result THEN 'PASS' ELSE 'FAIL' END::TEXT,
            ('Resultado: ' || test_result::TEXT)::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Excluir Quadro'::TEXT,
            'FAIL'::TEXT,
            ('Erro: ' || SQLERRM)::TEXT;
    END;
    
    -- Limpeza: remover quadros de teste
    DELETE FROM trello_boards WHERE id IN (test_board_id, new_board_id);
    
    RETURN QUERY SELECT 
        'Limpeza'::TEXT,
        'PASS'::TEXT,
        'Quadros de teste removidos'::TEXT;
        
END;
$$;

-- ========================================
-- 10. EXECUTAR TESTE AUTOMATIZADO
-- ========================================

-- Descomente para executar o teste:
-- SELECT * FROM test_all_kazuflow_functions();

-- ========================================
-- 11. REMOVER FUNÇÃO DE TESTE
-- ========================================

-- Descomente para remover a função de teste:
-- DROP FUNCTION IF EXISTS test_all_kazuflow_functions();