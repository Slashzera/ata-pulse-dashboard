-- Debug: Verificar se o filtro está funcionando

-- 1. Ver todas as ATAs (incluindo deletadas)
SELECT id, n_ata, is_deleted, deleted_at, created_at 
FROM atas 
ORDER BY n_ata;

-- 2. Ver apenas ATAs ativas (como deveria aparecer na lista)
SELECT id, n_ata, is_deleted, deleted_at, created_at 
FROM atas 
WHERE (is_deleted IS NULL OR is_deleted = false)
ORDER BY n_ata;

-- 3. Ver apenas ATAs na lixeira
SELECT id, n_ata, is_deleted, deleted_at, created_at 
FROM atas 
WHERE is_deleted = true
ORDER BY deleted_at DESC;

-- 4. Testar a view trash_items
SELECT * FROM trash_items WHERE table_name = 'atas';

-- 5. Ver logs recentes
SELECT * FROM trash_log 
WHERE table_name = 'atas' 
ORDER BY created_at DESC 
LIMIT 5;