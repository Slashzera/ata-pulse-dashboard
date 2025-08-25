-- Correção simples da constraint de ATAs
-- Remove constraints problemáticas que impedem a criação de ATAs

-- Remover todas as constraints únicas problemáticas na tabela atas
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar e remover constraints únicas que envolvem n_ata
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'atas'::regclass
        AND contype = 'u' -- unique constraints
        AND pg_get_constraintdef(oid) LIKE '%n_ata%'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE atas DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
            RAISE NOTICE 'Removida constraint: %', constraint_record.conname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao remover constraint %: %', constraint_record.conname, SQLERRM;
        END;
    END LOOP;
    
    -- Verificar se ainda existem constraints problemáticas
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'atas'::regclass
        AND contype = 'u'
        AND pg_get_constraintdef(oid) LIKE '%n_ata%'
    ) THEN
        RAISE NOTICE 'Ainda existem constraints problemáticas!';
    ELSE
        RAISE NOTICE 'Todas as constraints problemáticas foram removidas com sucesso!';
    END IF;
END $$;

-- Verificar o resultado
SELECT 
    'Constraints restantes na tabela atas:' as info,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'atas'::regclass
AND contype = 'u'
ORDER BY conname;