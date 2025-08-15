-- Teste simples para verificar a correção de duplicação

-- 1. Verificar se existem quadros duplicados (sem erro de GROUP BY)
SELECT 
    title,
    created_by,
    DATE(created_at) as creation_date,
    COUNT(*) as duplicates
FROM trello_boards 
WHERE is_deleted = false
GROUP BY title, created_by, DATE(created_at)
HAVING COUNT(*) > 1
ORDER BY duplicates DESC
LIMIT 10;

-- 2. Contar total de quadros vs combinações únicas
SELECT 
    COUNT(*) as total_boards,
    COUNT(DISTINCT CONCAT(title, '|', created_by::text, '|', DATE(created_at)::text)) as unique_combinations,
    COUNT(*) - COUNT(DISTINCT CONCAT(title, '|', created_by::text, '|', DATE(created_at)::text)) as potential_duplicates
FROM trello_boards 
WHERE is_deleted = false;

-- 3. Verificar se as funções existem
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('prevent_board_duplication', 'create_board_safe')
AND routine_schema = 'public';

-- 4. Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_prevent_board_duplication';

-- 5. Teste de criação segura (comentado para não executar automaticamente)
/*
SELECT create_board_safe(
    'Teste de Duplicação',
    'Teste para verificar se a função previne duplicatas',
    '#0079bf',
    NULL,
    'TESTE-001',
    'Usuário Teste',
    'Empresa Teste',
    'Objeto de teste',
    1000.00
);
*/