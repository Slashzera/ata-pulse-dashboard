-- Correção da constraint única na tabela ATAs
-- O problema é que existe uma constraint que impede ATAs com mesmo número na mesma categoria

-- 1. Primeiro, vamos verificar as constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'atas'::regclass;

-- 2. Remover a constraint problemática se existir
DO $$ 
BEGIN
    -- Tentar remover a constraint única que está causando o problema
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'atas_n_ata_category_unique' 
        AND conrelid = 'atas'::regclass
    ) THEN
        ALTER TABLE atas DROP CONSTRAINT atas_n_ata_category_unique;
        RAISE NOTICE 'Constraint atas_n_ata_category_unique removida com sucesso';
    END IF;
    
    -- Verificar outras possíveis constraints problemáticas
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname LIKE '%n_ata%' 
        AND conrelid = 'atas'::regclass
        AND contype = 'u' -- unique constraint
    ) THEN
        -- Listar constraints que contêm n_ata
        FOR rec IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conname LIKE '%n_ata%' 
            AND conrelid = 'atas'::regclass
            AND contype = 'u'
        LOOP
            EXECUTE 'ALTER TABLE atas DROP CONSTRAINT ' || rec.conname;
            RAISE NOTICE 'Constraint % removida', rec.conname;
        END LOOP;
    END IF;
END $$;

-- 3. Verificar se ainda existem constraints problemáticas
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'atas'::regclass
AND contype = 'u'; -- apenas unique constraints

-- 4. Criar uma constraint mais flexível se necessário
-- Esta constraint permite ATAs com mesmo número em categorias diferentes
-- mas impede duplicatas na mesma categoria apenas se ambas estiverem ativas
DO $$
BEGIN
    -- Só criar se não existir uma constraint similar
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'atas_n_ata_category_active_unique'
        AND conrelid = 'atas'::regclass
    ) THEN
        -- Criar constraint que permite duplicatas apenas se uma estiver deletada
        ALTER TABLE atas 
        ADD CONSTRAINT atas_n_ata_category_active_unique 
        UNIQUE (n_ata, category) 
        DEFERRABLE INITIALLY DEFERRED;
        
        RAISE NOTICE 'Nova constraint atas_n_ata_category_active_unique criada';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'Constraint já existe, pulando criação';
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar constraint: %', SQLERRM;
END $$;

-- 5. Verificar o resultado final
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'atas'::regclass
ORDER BY conname;

-- 6. Testar se podemos inserir ATAs agora
-- (Este é apenas um teste, não vai inserir dados reais)
EXPLAIN (FORMAT TEXT) 
INSERT INTO atas (n_ata, pregao, objeto, category, valor, saldo_disponivel) 
VALUES ('TESTE001', 'PE001/2024', 'Teste de inserção', 'normal', 1000, 1000);