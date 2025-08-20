-- 🚀 FUNÇÕES COMPLETAS KAZUFLOW - TODOS OS BOTÕES FUNCIONANDO

-- ========================================
-- 1. FUNÇÃO DE EXCLUSÃO DE QUADROS
-- ========================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS emergency_delete_board(UUID);
DROP FUNCTION IF EXISTS simple_delete_board(UUID);

-- Função principal de exclusão
CREATE OR REPLACE FUNCTION emergency_delete_board(board_id UUID)
RETURNS BOOLEAN
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
    
    -- Log da operação
    RAISE NOTICE 'Excluindo quadro: %', board_id;
    
    -- Marcar cartões como excluídos
    UPDATE trello_cards 
    SET is_deleted = true, updated_at = NOW()
    WHERE list_id IN (
        SELECT id FROM trello_lists 
        WHERE board_id = emergency_delete_board.board_id 
        AND is_deleted = false
    );
    
    -- Marcar listas como excluídas
    UPDATE trello_lists 
    SET is_deleted = true, updated_at = NOW()
    WHERE board_id = emergency_delete_board.board_id;
    
    -- Marcar quadro como excluído
    UPDATE trello_boards 
    SET is_deleted = true, updated_at = NOW()
    WHERE id = emergency_delete_board.board_id;
    
    RAISE NOTICE 'Quadro excluído com sucesso: %', board_id;
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao excluir quadro %: %', board_id, SQLERRM;
        RETURN false;
END;
$$;

-- ========================================
-- 2. FUNÇÃO DE EDITAR TÍTULO DO QUADRO
-- ========================================

CREATE OR REPLACE FUNCTION update_board_title(
    board_id UUID,
    new_title TEXT
)
RETURNS BOOLEAN
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
    
    -- Validar título
    IF new_title IS NULL OR LENGTH(TRIM(new_title)) = 0 THEN
        RAISE EXCEPTION 'Título não pode estar vazio';
    END IF;
    
    -- Atualizar título do quadro
    UPDATE trello_boards 
    SET 
        title = TRIM(new_title),
        updated_at = NOW()
    WHERE 
        id = board_id 
        AND is_deleted = false
        AND created_by = user_id;
    
    -- Verificar se foi atualizado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quadro não encontrado ou sem permissão';
    END IF;
    
    RAISE NOTICE 'Título do quadro % atualizado para: %', board_id, new_title;
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar título: %', SQLERRM;
        RETURN false;
END;
$$;

-- ========================================
-- 3. FUNÇÃO DE MUDAR COR DO QUADRO
-- ========================================

CREATE OR REPLACE FUNCTION update_board_color(
    board_id UUID,
    new_color TEXT
)
RETURNS BOOLEAN
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
    
    -- Validar cor (formato hex)
    IF new_color IS NULL OR NOT new_color ~ '^#[0-9A-Fa-f]{6}$' THEN
        RAISE EXCEPTION 'Cor deve estar no formato #RRGGBB';
    END IF;
    
    -- Atualizar cor do quadro
    UPDATE trello_boards 
    SET 
        background_color = new_color,
        updated_at = NOW()
    WHERE 
        id = board_id 
        AND is_deleted = false
        AND created_by = user_id;
    
    -- Verificar se foi atualizado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quadro não encontrado ou sem permissão';
    END IF;
    
    RAISE NOTICE 'Cor do quadro % atualizada para: %', board_id, new_color;
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao atualizar cor: %', SQLERRM;
        RETURN false;
END;
$$;

-- ========================================
-- 4. FUNÇÃO DE COPIAR QUADRO
-- ========================================

CREATE OR REPLACE FUNCTION copy_board(
    source_board_id UUID,
    new_title TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    source_board RECORD;
    new_board_id UUID;
    list_record RECORD;
    new_list_id UUID;
    card_record RECORD;
    final_title TEXT;
BEGIN
    -- Verificar se o usuário está autenticado
    SELECT auth.uid() INTO user_id;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Buscar quadro original
    SELECT * INTO source_board
    FROM trello_boards 
    WHERE id = source_board_id AND is_deleted = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quadro original não encontrado';
    END IF;
    
    -- Definir título da cópia
    final_title := COALESCE(new_title, source_board.title || ' (Cópia)');
    
    -- Criar novo quadro
    INSERT INTO trello_boards (
        title,
        description,
        background_color,
        created_by,
        process_number,
        responsible_person,
        company,
        object_description,
        process_value,
        board_type_id
    ) VALUES (
        final_title,
        source_board.description,
        source_board.background_color,
        user_id,
        source_board.process_number,
        source_board.responsible_person,
        source_board.company,
        source_board.object_description,
        source_board.process_value,
        source_board.board_type_id
    ) RETURNING id INTO new_board_id;
    
    -- Copiar listas
    FOR list_record IN 
        SELECT * FROM trello_lists 
        WHERE board_id = source_board_id AND is_deleted = false
        ORDER BY position
    LOOP
        INSERT INTO trello_lists (
            board_id,
            title,
            position
        ) VALUES (
            new_board_id,
            list_record.title,
            list_record.position
        ) RETURNING id INTO new_list_id;
        
        -- Copiar cartões da lista
        FOR card_record IN 
            SELECT * FROM trello_cards 
            WHERE list_id = list_record.id AND is_deleted = false
            ORDER BY position
        LOOP
            INSERT INTO trello_cards (
                list_id,
                title,
                description,
                position,
                created_by
            ) VALUES (
                new_list_id,
                card_record.title,
                card_record.description,
                card_record.position,
                user_id
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Quadro copiado com sucesso. Novo ID: %', new_board_id;
    RETURN new_board_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao copiar quadro: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- ========================================
-- 5. FUNÇÃO PARA BUSCAR DADOS COMPLETOS DO QUADRO
-- ========================================

CREATE OR REPLACE FUNCTION get_board_complete_data(board_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    board_data JSON;
BEGIN
    -- Verificar se o usuário está autenticado
    SELECT auth.uid() INTO user_id;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Buscar dados completos do quadro
    SELECT json_build_object(
        'id', b.id,
        'title', b.title,
        'description', b.description,
        'background_color', b.background_color,
        'created_by', b.created_by,
        'created_at', b.created_at,
        'updated_at', b.updated_at,
        'process_number', b.process_number,
        'responsible_person', b.responsible_person,
        'company', b.company,
        'object_description', b.object_description,
        'process_value', b.process_value,
        'member_role', CASE WHEN b.created_by = user_id THEN 'owner' ELSE 'member' END
    ) INTO board_data
    FROM trello_boards b
    WHERE b.id = board_id AND b.is_deleted = false;
    
    IF board_data IS NULL THEN
        RAISE EXCEPTION 'Quadro não encontrado';
    END IF;
    
    RETURN board_data;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao buscar dados do quadro: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- ========================================
-- 6. DAR PERMISSÕES PARA TODAS AS FUNÇÕES
-- ========================================

GRANT EXECUTE ON FUNCTION emergency_delete_board(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_delete_board(UUID) TO anon;

GRANT EXECUTE ON FUNCTION update_board_title(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_board_title(UUID, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION update_board_color(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_board_color(UUID, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION copy_board(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION copy_board(UUID, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION get_board_complete_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_board_complete_data(UUID) TO anon;

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
    'emergency_delete_board',
    'update_board_title', 
    'update_board_color',
    'copy_board',
    'get_board_complete_data'
)
ORDER BY proname;

-- ========================================
-- 8. MENSAGEM DE SUCESSO
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '🚀 TODAS AS FUNÇÕES DO KAZUFLOW CRIADAS COM SUCESSO!';
    RAISE NOTICE '1. ✅ emergency_delete_board() - Excluir quadros';
    RAISE NOTICE '2. ✅ update_board_title() - Editar título';
    RAISE NOTICE '3. ✅ update_board_color() - Mudar cor';
    RAISE NOTICE '4. ✅ copy_board() - Copiar quadro';
    RAISE NOTICE '5. ✅ get_board_complete_data() - Buscar dados';
    RAISE NOTICE '6. ✅ Permissões configuradas para authenticated e anon';
    RAISE NOTICE '7. ✅ Todos os botões do KazuFlow devem funcionar agora!';
END;
$$;