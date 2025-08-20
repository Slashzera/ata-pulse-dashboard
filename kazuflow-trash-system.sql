-- 🗑️ SISTEMA DE LIXEIRA PARA QUADROS KAZUFLOW

-- ========================================
-- 1. VERIFICAR SE TABELA TRASH JÁ EXISTE
-- ========================================

-- Se não existir, criar tabela trash
CREATE TABLE IF NOT EXISTS trash (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_type VARCHAR(50) NOT NULL,
    item_id UUID NOT NULL,
    item_data JSONB NOT NULL,
    deleted_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_trash_item_type ON trash(item_type);
CREATE INDEX IF NOT EXISTS idx_trash_deleted_by ON trash(deleted_by);
CREATE INDEX IF NOT EXISTS idx_trash_deleted_at ON trash(deleted_at);

-- ========================================
-- 2. FUNÇÃO PARA MOVER QUADRO PARA LIXEIRA
-- ========================================

CREATE OR REPLACE FUNCTION move_board_to_trash(board_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    board_data JSONB;
    board_record RECORD;
    lists_data JSONB;
    cards_data JSONB;
BEGIN
    -- Verificar se o usuário está autenticado
    SELECT auth.uid() INTO user_id;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Buscar dados completos do quadro
    SELECT * INTO board_record
    FROM trello_boards 
    WHERE id = board_id AND is_deleted = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quadro não encontrado ou já excluído';
    END IF;
    
    -- Verificar se o usuário tem permissão (é o dono)
    IF board_record.created_by != user_id THEN
        RAISE EXCEPTION 'Usuário não tem permissão para excluir este quadro';
    END IF;
    
    -- Buscar todas as listas do quadro
    SELECT json_agg(
        json_build_object(
            'id', l.id,
            'title', l.title,
            'position', l.position,
            'created_at', l.created_at,
            'updated_at', l.updated_at
        )
    ) INTO lists_data
    FROM trello_lists l
    WHERE l.board_id = board_id AND l.is_deleted = false;
    
    -- Buscar todos os cartões das listas
    SELECT json_agg(
        json_build_object(
            'id', c.id,
            'list_id', c.list_id,
            'title', c.title,
            'description', c.description,
            'position', c.position,
            'due_date', c.due_date,
            'created_by', c.created_by,
            'created_at', c.created_at,
            'updated_at', c.updated_at
        )
    ) INTO cards_data
    FROM trello_cards c
    WHERE c.list_id IN (
        SELECT l.id FROM trello_lists l 
        WHERE l.board_id = board_id AND l.is_deleted = false
    ) AND c.is_deleted = false;
    
    -- Montar dados completos para a lixeira
    board_data := json_build_object(
        'board', json_build_object(
            'id', board_record.id,
            'title', board_record.title,
            'description', board_record.description,
            'background_color', board_record.background_color,
            'created_by', board_record.created_by,
            'created_at', board_record.created_at,
            'updated_at', board_record.updated_at,
            'process_number', board_record.process_number,
            'responsible_person', board_record.responsible_person,
            'company', board_record.company,
            'object_description', board_record.object_description,
            'process_value', board_record.process_value,
            'board_type_id', board_record.board_type_id
        ),
        'lists', COALESCE(lists_data, '[]'::json),
        'cards', COALESCE(cards_data, '[]'::json)
    );
    
    -- Inserir na lixeira
    INSERT INTO trash (
        item_type,
        item_id,
        item_data,
        deleted_by
    ) VALUES (
        'kazuflow_board',
        board_id,
        board_data,
        user_id
    );
    
    -- Marcar quadro como excluído (soft delete)
    UPDATE trello_boards 
    SET is_deleted = true, updated_at = NOW()
    WHERE id = board_id;
    
    -- Marcar listas como excluídas
    UPDATE trello_lists 
    SET is_deleted = true, updated_at = NOW()
    WHERE board_id = board_id;
    
    -- Marcar cartões como excluídos
    UPDATE trello_cards 
    SET is_deleted = true, updated_at = NOW()
    WHERE list_id IN (
        SELECT id FROM trello_lists WHERE board_id = board_id
    );
    
    RAISE NOTICE 'Quadro % movido para lixeira com sucesso', board_id;
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao mover quadro para lixeira: %', SQLERRM;
        RETURN false;
END;
$$;

-- ========================================
-- 3. FUNÇÃO PARA RESTAURAR QUADRO DA LIXEIRA
-- ========================================

CREATE OR REPLACE FUNCTION restore_board_from_trash(trash_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    trash_record RECORD;
    board_data JSONB;
    list_data JSONB;
    card_data JSONB;
BEGIN
    -- Verificar se o usuário está autenticado
    SELECT auth.uid() INTO user_id;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Buscar item na lixeira
    SELECT * INTO trash_record
    FROM trash 
    WHERE id = trash_id 
    AND item_type = 'kazuflow_board'
    AND deleted_by = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item não encontrado na lixeira ou sem permissão';
    END IF;
    
    -- Extrair dados do quadro
    board_data := trash_record.item_data->'board';
    
    -- Restaurar quadro
    UPDATE trello_boards 
    SET is_deleted = false, updated_at = NOW()
    WHERE id = (board_data->>'id')::UUID;
    
    -- Restaurar listas
    FOR list_data IN 
        SELECT * FROM json_array_elements(trash_record.item_data->'lists')
    LOOP
        UPDATE trello_lists 
        SET is_deleted = false, updated_at = NOW()
        WHERE id = (list_data->>'id')::UUID;
    END LOOP;
    
    -- Restaurar cartões
    FOR card_data IN 
        SELECT * FROM json_array_elements(trash_record.item_data->'cards')
    LOOP
        UPDATE trello_cards 
        SET is_deleted = false, updated_at = NOW()
        WHERE id = (card_data->>'id')::UUID;
    END LOOP;
    
    -- Remover da lixeira
    DELETE FROM trash WHERE id = trash_id;
    
    RAISE NOTICE 'Quadro restaurado da lixeira com sucesso';
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao restaurar quadro da lixeira: %', SQLERRM;
        RETURN false;
END;
$$;

-- ========================================
-- 4. FUNÇÃO PARA EXCLUIR PERMANENTEMENTE
-- ========================================

CREATE OR REPLACE FUNCTION permanently_delete_board(trash_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    trash_record RECORD;
    board_data JSONB;
    list_data JSONB;
    card_data JSONB;
BEGIN
    -- Verificar se o usuário está autenticado
    SELECT auth.uid() INTO user_id;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Buscar item na lixeira
    SELECT * INTO trash_record
    FROM trash 
    WHERE id = trash_id 
    AND item_type = 'kazuflow_board'
    AND deleted_by = user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item não encontrado na lixeira ou sem permissão';
    END IF;
    
    -- Extrair dados do quadro
    board_data := trash_record.item_data->'board';
    
    -- Excluir cartões permanentemente
    FOR card_data IN 
        SELECT * FROM json_array_elements(trash_record.item_data->'cards')
    LOOP
        DELETE FROM trello_cards 
        WHERE id = (card_data->>'id')::UUID;
    END LOOP;
    
    -- Excluir listas permanentemente
    FOR list_data IN 
        SELECT * FROM json_array_elements(trash_record.item_data->'lists')
    LOOP
        DELETE FROM trello_lists 
        WHERE id = (list_data->>'id')::UUID;
    END LOOP;
    
    -- Excluir quadro permanentemente
    DELETE FROM trello_boards 
    WHERE id = (board_data->>'id')::UUID;
    
    -- Remover da lixeira
    DELETE FROM trash WHERE id = trash_id;
    
    RAISE NOTICE 'Quadro excluído permanentemente';
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao excluir permanentemente: %', SQLERRM;
        RETURN false;
END;
$$;

-- ========================================
-- 5. FUNÇÃO PARA LISTAR ITENS NA LIXEIRA
-- ========================================

CREATE OR REPLACE FUNCTION get_kazuflow_trash_items()
RETURNS TABLE(
    id UUID,
    board_title TEXT,
    board_id UUID,
    deleted_at TIMESTAMP WITH TIME ZONE,
    item_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Verificar se o usuário está autenticado
    SELECT auth.uid() INTO user_id;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id,
        (t.item_data->'board'->>'title')::TEXT as board_title,
        (t.item_data->'board'->>'id')::UUID as board_id,
        t.deleted_at,
        t.item_data
    FROM trash t
    WHERE t.item_type = 'kazuflow_board'
    AND t.deleted_by = user_id
    ORDER BY t.deleted_at DESC;
    
END;
$$;

-- ========================================
-- 6. DAR PERMISSÕES PARA TODAS AS FUNÇÕES
-- ========================================

GRANT EXECUTE ON FUNCTION move_board_to_trash(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_board_to_trash(UUID) TO anon;

GRANT EXECUTE ON FUNCTION restore_board_from_trash(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_board_from_trash(UUID) TO anon;

GRANT EXECUTE ON FUNCTION permanently_delete_board(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION permanently_delete_board(UUID) TO anon;

GRANT EXECUTE ON FUNCTION get_kazuflow_trash_items() TO authenticated;
GRANT EXECUTE ON FUNCTION get_kazuflow_trash_items() TO anon;

-- Permissões na tabela trash
GRANT SELECT, INSERT, UPDATE, DELETE ON trash TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trash TO anon;

-- ========================================
-- 7. VERIFICAR SE TODAS AS FUNÇÕES FORAM CRIADAS
-- ========================================

SELECT 
    proname as function_name,
    prosecdef as security_definer,
    provolatile as volatility,
    pronargs as num_args
FROM pg_proc 
WHERE proname IN (
    'move_board_to_trash',
    'restore_board_from_trash',
    'permanently_delete_board',
    'get_kazuflow_trash_items'
)
ORDER BY proname;

-- ========================================
-- 8. MENSAGEM DE SUCESSO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🗑️ SISTEMA DE LIXEIRA KAZUFLOW CRIADO COM SUCESSO!';
    RAISE NOTICE '1. ✅ move_board_to_trash() - Mover quadro para lixeira';
    RAISE NOTICE '2. ✅ restore_board_from_trash() - Restaurar da lixeira';
    RAISE NOTICE '3. ✅ permanently_delete_board() - Excluir permanentemente';
    RAISE NOTICE '4. ✅ get_kazuflow_trash_items() - Listar itens na lixeira';
    RAISE NOTICE '5. ✅ Tabela trash configurada';
    RAISE NOTICE '6. ✅ Permissões configuradas';
    RAISE NOTICE '7. ✅ Sistema de lixeira pronto para uso!';
END;
$$;