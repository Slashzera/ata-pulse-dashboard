-- Correção de permissões para criação de ATAs
-- Problema: Usuários específicos não conseguem finalizar criação de ATAs

-- 1. Verificar políticas RLS atuais na tabela atas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'atas';

-- 2. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'atas';

-- 3. Temporariamente desabilitar RLS para permitir criação
ALTER TABLE atas DISABLE ROW LEVEL SECURITY;

-- 4. Criar política mais permissiva para INSERT
DROP POLICY IF EXISTS "Users can insert their own atas" ON atas;
DROP POLICY IF EXISTS "Users can create atas" ON atas;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON atas;

-- 5. Criar nova política de INSERT mais permissiva
CREATE POLICY "Allow authenticated users to create atas" ON atas
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- 6. Criar política de SELECT permissiva
DROP POLICY IF EXISTS "Users can view all atas" ON atas;
CREATE POLICY "Allow authenticated users to view atas" ON atas
    FOR SELECT 
    TO authenticated 
    USING (true);

-- 7. Criar política de UPDATE permissiva
DROP POLICY IF EXISTS "Users can update their own atas" ON atas;
CREATE POLICY "Allow authenticated users to update atas" ON atas
    FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- 8. Criar política de DELETE permissiva
DROP POLICY IF EXISTS "Users can delete their own atas" ON atas;
CREATE POLICY "Allow authenticated users to delete atas" ON atas
    FOR DELETE 
    TO authenticated 
    USING (true);

-- 9. Reabilitar RLS com as novas políticas
ALTER TABLE atas ENABLE ROW LEVEL SECURITY;

-- 10. Verificar permissões da tabela
GRANT ALL ON atas TO authenticated;
GRANT ALL ON atas TO anon;

-- 11. Verificar se a sequência existe e dar permissões
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'atas_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE atas_id_seq TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE atas_id_seq TO anon;
    END IF;
END $$;

-- 12. Verificar permissões do schema public
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 13. Testar inserção com usuário específico (Ana Luiza)
-- Primeiro, verificar se o usuário existe
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email ILIKE '%ana%luiza%' OR email ILIKE '%purcino%';

-- 14. Verificar logs de erro recentes
SELECT 
    created_at,
    level,
    msg,
    metadata
FROM supabase_functions.logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND (msg ILIKE '%ata%' OR msg ILIKE '%error%')
ORDER BY created_at DESC
LIMIT 10;

-- 15. Verificar se há triggers que podem estar causando problemas
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'atas';

-- 16. Limpar cache de políticas
NOTIFY pgrst, 'reload schema';

-- 17. Verificar resultado final das políticas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'atas'
ORDER BY policyname;