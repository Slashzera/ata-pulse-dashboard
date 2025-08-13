-- Sistema de Lixeira - Migração SQL para Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar colunas de controle de lixeira nas tabelas existentes
ALTER TABLE public.atas 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Verificar se existe tabela TAC e adicionar colunas se existir
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tac') THEN
        ALTER TABLE public.tac 
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Criar tabela de log de lixeira para auditoria
CREATE TABLE IF NOT EXISTS public.trash_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('deleted', 'restored', 'permanently_deleted')),
    user_id UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    restored_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Habilitar RLS na tabela trash_log
ALTER TABLE public.trash_log ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para trash_log
CREATE POLICY "Allow authenticated users to view trash log" 
    ON public.trash_log 
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow authenticated users to insert trash log" 
    ON public.trash_log 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_atas_deleted ON public.atas(is_deleted, deleted_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_deleted ON public.pedidos(is_deleted, deleted_at);
CREATE INDEX IF NOT EXISTS idx_trash_log_table_record ON public.trash_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_trash_log_user ON public.trash_log(user_id);

-- 6. Função para mover item para lixeira (soft delete)
CREATE OR REPLACE FUNCTION public.move_to_trash(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_query TEXT;
    record_exists INTEGER := 0;
BEGIN
    -- Verificar se a tabela é válida
    IF p_table_name NOT IN ('atas', 'pedidos', 'tac') THEN
        RAISE EXCEPTION 'Tabela não suportada: %', p_table_name;
    END IF;

    -- Construir e executar query dinâmica
    sql_query := format('
        UPDATE public.%I 
        SET is_deleted = TRUE, 
            deleted_at = now(), 
            deleted_by = %L 
        WHERE id = %L AND (is_deleted = FALSE OR is_deleted IS NULL)
    ', p_table_name, p_user_id, p_record_id);
    
    EXECUTE sql_query;
    
    -- Verificar se algum registro foi afetado
    GET DIAGNOSTICS record_exists = ROW_COUNT;
    
    IF record_exists > 0 THEN
        -- Registrar no log
        INSERT INTO public.trash_log (table_name, record_id, action, user_id, deleted_at)
        VALUES (p_table_name, p_record_id, 'deleted', p_user_id, now());
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 7. Função para restaurar item da lixeira
CREATE OR REPLACE FUNCTION public.restore_from_trash(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_query TEXT;
    record_exists INTEGER := 0;
BEGIN
    -- Verificar se a tabela é válida
    IF p_table_name NOT IN ('atas', 'pedidos', 'tac') THEN
        RAISE EXCEPTION 'Tabela não suportada: %', p_table_name;
    END IF;

    -- Construir e executar query dinâmica
    sql_query := format('
        UPDATE public.%I 
        SET is_deleted = FALSE, 
            deleted_at = NULL, 
            deleted_by = NULL 
        WHERE id = %L AND is_deleted = TRUE
    ', p_table_name, p_record_id);
    
    EXECUTE sql_query;
    
    -- Verificar se algum registro foi afetado
    GET DIAGNOSTICS record_exists = ROW_COUNT;
    
    IF record_exists > 0 THEN
        -- Registrar no log
        INSERT INTO public.trash_log (table_name, record_id, action, user_id, restored_at)
        VALUES (p_table_name, p_record_id, 'restored', p_user_id, now());
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- 8. Função para excluir permanentemente
CREATE OR REPLACE FUNCTION public.permanently_delete(
    p_table_name TEXT,
    p_record_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sql_query TEXT;
    record_exists INTEGER := 0;
BEGIN
    -- Verificar se a tabela é válida
    IF p_table_name NOT IN ('atas', 'pedidos', 'tac') THEN
        RAISE EXCEPTION 'Tabela não suportada: %', p_table_name;
    END IF;

    -- Registrar no log antes de excluir
    INSERT INTO public.trash_log (table_name, record_id, action, user_id)
    VALUES (p_table_name, p_record_id, 'permanently_deleted', p_user_id);

    -- Construir e executar query dinâmica
    sql_query := format('DELETE FROM public.%I WHERE id = %L AND is_deleted = TRUE', p_table_name, p_record_id);
    
    EXECUTE sql_query;
    
    -- Verificar se algum registro foi afetado
    GET DIAGNOSTICS record_exists = ROW_COUNT;
    
    RETURN record_exists > 0;
END;
$$;

-- 9. View para listar itens na lixeira
CREATE OR REPLACE VIEW public.trash_items AS
SELECT 
    'atas' as table_name,
    id,
    n_ata as title,
    objeto as description,
    deleted_at,
    deleted_by,
    created_at
FROM public.atas 
WHERE is_deleted = TRUE

UNION ALL

SELECT 
    'pedidos' as table_name,
    id,
    departamento as title,
    descricao as description,
    deleted_at,
    deleted_by,
    created_at
FROM public.pedidos 
WHERE is_deleted = TRUE;

-- 10. Atualizar políticas RLS existentes para considerar itens deletados
-- Para ATAs - mostrar apenas itens não deletados por padrão
DROP POLICY IF EXISTS "Allow all operations on atas" ON public.atas;
CREATE POLICY "Allow select non-deleted atas" 
    ON public.atas 
    FOR SELECT 
    USING (is_deleted = FALSE OR is_deleted IS NULL);

CREATE POLICY "Allow insert atas" 
    ON public.atas 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow update atas" 
    ON public.atas 
    FOR UPDATE 
    USING (true);

CREATE POLICY "Allow delete atas" 
    ON public.atas 
    FOR DELETE 
    USING (true);

-- Para Pedidos - mostrar apenas itens não deletados por padrão
DROP POLICY IF EXISTS "Allow all operations on pedidos" ON public.pedidos;
CREATE POLICY "Allow select non-deleted pedidos" 
    ON public.pedidos 
    FOR SELECT 
    USING (is_deleted = FALSE OR is_deleted IS NULL);

CREATE POLICY "Allow insert pedidos" 
    ON public.pedidos 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow update pedidos" 
    ON public.pedidos 
    FOR UPDATE 
    USING (true);

CREATE POLICY "Allow delete pedidos" 
    ON public.pedidos 
    FOR DELETE 
    USING (true);

-- 11. Função para limpeza automática da lixeira (itens mais antigos que 30 dias)
CREATE OR REPLACE FUNCTION public.cleanup_trash()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Excluir ATAs antigas da lixeira
    DELETE FROM public.atas 
    WHERE is_deleted = TRUE 
    AND deleted_at < (now() - INTERVAL '30 days');
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Excluir Pedidos antigos da lixeira
    DELETE FROM public.pedidos 
    WHERE is_deleted = TRUE 
    AND deleted_at < (now() - INTERVAL '30 days');
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Excluir TACs antigos da lixeira (se a tabela existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tac') THEN
        EXECUTE 'DELETE FROM public.tac WHERE is_deleted = TRUE AND deleted_at < (now() - INTERVAL ''30 days'')';
        GET DIAGNOSTICS temp_count = ROW_COUNT;
        deleted_count := deleted_count + temp_count;
    END IF;
    
    RETURN deleted_count;
END;
$$;

-- 12. Comentários para documentação
COMMENT ON TABLE public.trash_log IS 'Log de auditoria para operações de lixeira';
COMMENT ON FUNCTION public.move_to_trash IS 'Move um registro para a lixeira (soft delete)';
COMMENT ON FUNCTION public.restore_from_trash IS 'Restaura um registro da lixeira';
COMMENT ON FUNCTION public.permanently_delete IS 'Exclui permanentemente um registro da lixeira';
COMMENT ON FUNCTION public.cleanup_trash IS 'Remove automaticamente itens da lixeira mais antigos que 30 dias';
COMMENT ON VIEW public.trash_items IS 'View unificada para visualizar todos os itens na lixeira';

-- 13. Função para adicionar suporte de lixeira a uma nova tabela
CREATE OR REPLACE FUNCTION public.add_trash_support_to_table(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = add_trash_support_to_table.table_name) THEN
        RAISE EXCEPTION 'Tabela % não existe', table_name;
    END IF;
    
    -- Adicionar colunas de lixeira
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE', table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id)', table_name);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE', table_name);
    
    -- Criar índice
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_deleted ON public.%I(is_deleted, deleted_at)', table_name, table_name);
    
    RETURN TRUE;
END;
$$;

-- 14. Função para recriar a view trash_items incluindo todas as tabelas com suporte
CREATE OR REPLACE FUNCTION public.refresh_trash_items_view()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    view_sql TEXT := '';
    table_rec RECORD;
    first_table BOOLEAN := TRUE;
BEGIN
    -- Construir SQL da view dinamicamente
    view_sql := 'CREATE OR REPLACE VIEW public.trash_items AS ';
    
    -- ATAs
    IF first_table THEN
        first_table := FALSE;
    ELSE
        view_sql := view_sql || ' UNION ALL ';
    END IF;
    
    view_sql := view_sql || '
    SELECT 
        ''atas'' as table_name,
        id,
        n_ata as title,
        objeto as description,
        deleted_at,
        deleted_by,
        created_at
    FROM public.atas 
    WHERE is_deleted = TRUE';
    
    -- Pedidos
    view_sql := view_sql || ' UNION ALL 
    SELECT 
        ''pedidos'' as table_name,
        id,
        departamento as title,
        descricao as description,
        deleted_at,
        deleted_by,
        created_at
    FROM public.pedidos 
    WHERE is_deleted = TRUE';
    
    -- Verificar se TAC existe e adicionar
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tac') THEN
        view_sql := view_sql || ' UNION ALL 
        SELECT 
            ''tac'' as table_name,
            id,
            COALESCE(numero, ''TAC'') as title,
            COALESCE(objeto, ''Termo de Adesão'') as description,
            deleted_at,
            deleted_by,
            created_at
        FROM public.tac 
        WHERE is_deleted = TRUE';
    END IF;
    
    -- Executar a criação da view
    EXECUTE view_sql;
END;
$$;

-- Executar a função para criar a view inicial
SELECT refresh_trash_items_view();

-- Mensagem de sucesso
SELECT 'Sistema de lixeira criado com sucesso! 🗑️' as status;