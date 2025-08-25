-- Diagnóstico da ATA 085/2025 que não aparece na lista

-- 1. Verificar se a ATA 085/2025 existe na tabela
SELECT 
    'ATAs com número 085/2025 encontradas:' as info,
    id,
    n_ata,
    category,
    favorecido,
    objeto,
    valor,
    saldo_disponivel,
    is_deleted,
    created_at,
    updated_at
FROM atas 
WHERE n_ata LIKE '%085%' OR n_ata LIKE '%85%'
ORDER BY created_at DESC;

-- 2. Verificar ATAs deletadas (na lixeira)
SELECT 
    'ATAs 085/2025 na lixeira:' as info,
    id,
    n_ata,
    category,
    favorecido,
    is_deleted,
    created_at
FROM atas 
WHERE (n_ata LIKE '%085%' OR n_ata LIKE '%85%')
AND is_deleted = true;

-- 3. Verificar todas as ATAs recentes (últimas 10)
SELECT 
    'Últimas 10 ATAs criadas:' as info,
    id,
    n_ata,
    category,
    favorecido,
    is_deleted,
    created_at
FROM atas 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar ATAs por categoria
SELECT 
    'ATAs por categoria:' as info,
    category,
    COUNT(*) as total,
    COUNT(CASE WHEN is_deleted = false THEN 1 END) as ativas,
    COUNT(CASE WHEN is_deleted = true THEN 1 END) as deletadas
FROM atas 
GROUP BY category
ORDER BY category;

-- 5. Verificar se existe algum problema com a ATA 085/2025
SELECT 
    'Detalhes completos da ATA 085/2025:' as info,
    *
FROM atas 
WHERE n_ata = '085/2025';

-- 6. Verificar ATAs com números similares
SELECT 
    'ATAs com números similares:' as info,
    n_ata,
    category,
    favorecido,
    is_deleted,
    created_at
FROM atas 
WHERE n_ata SIMILAR TO '%(08[0-9]|09[0-9])/2025%'
ORDER BY n_ata;

-- 7. Se a ATA existe mas está marcada como deletada, restaurar
DO $$
DECLARE
    ata_record RECORD;
BEGIN
    -- Buscar ATA 085/2025 que pode estar deletada
    SELECT * INTO ata_record
    FROM atas 
    WHERE n_ata = '085/2025' 
    AND is_deleted = true
    LIMIT 1;
    
    IF FOUND THEN
        -- Restaurar a ATA
        UPDATE atas 
        SET is_deleted = false,
            updated_at = NOW()
        WHERE id = ata_record.id;
        
        RAISE NOTICE 'ATA 085/2025 foi restaurada! ID: %', ata_record.id;
    ELSE
        RAISE NOTICE 'ATA 085/2025 não encontrada como deletada';
    END IF;
END $$;

-- 8. Verificar novamente após possível restauração
SELECT 
    'Status final da ATA 085/2025:' as info,
    id,
    n_ata,
    category,
    favorecido,
    objeto,
    valor,
    saldo_disponivel,
    is_deleted,
    created_at,
    updated_at
FROM atas 
WHERE n_ata = '085/2025';

-- 9. Forçar refresh das views materializadas se existirem
DO $$
BEGIN
    -- Tentar refresh de views materializadas relacionadas a ATAs
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname LIKE '%ata%') THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY atas_stats;
        RAISE NOTICE 'Views materializadas atualizadas';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Não foi possível atualizar views materializadas: %', SQLERRM;
END $$;