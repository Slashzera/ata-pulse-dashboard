-- 🔧 CORREÇÃO DAS FUNÇÕES DO MENU KAZUFLOW

-- ========================================
-- 1. FUNÇÃO DE EDITAR TÍTULO DO QUADRO
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
        AND is_deleted = false;
    
    -- Verificar se foi atualizado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quadro não encontrado';
    END IF;
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- ========================================
-- 2. FUNÇÃO DE MUDAR COR DO QUADRO
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
        AND is_deleted = false;
    
    -- Verificar se foi atualizado
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quadro não encontrado';
    END IF;
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- ========================================
-- 3. FUNÇÃO DE COPIAR QUADRO
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
    
    RETURN new_board_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- ========================================
-- 4. FUNÇÃO DE EXCLUSÃO DE QUADROS
-- ========================================

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
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- ========================================
-- 5. DAR PERMISSÕES PARA TODAS AS FUNÇÕES
-- ========================================

GRANT EXECUTE ON FUNCTION update_board_title(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_board_title(UUID, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION update_board_color(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_board_color(UUID, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION copy_board(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION copy_board(UUID, TEXT) TO anon;

GRANT EXECUTE ON FUNCTION emergency_delete_board(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION emergency_delete_board(UUID) TO anon;

-- ========================================
-- 6. VERIFICAR SE AS FUNÇÕES FORAM CRIADAS
-- ========================================

SELECT 
    'Função criada: ' || proname as status
FROM pg_proc 
WHERE proname IN (
    'update_board_title',
    'update_board_color', 
    'copy_board',
    'emergency_delete_board'
)
ORDER BY proname;