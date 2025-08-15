-- PASSO 1: Criar função para prevenir duplicação
CREATE OR REPLACE FUNCTION prevent_duplicate_board_creation()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = NEW.title
    AND created_by = NEW.created_by
    AND created_at > (NOW() - INTERVAL '5 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro já foi criado recentemente. Aguarde alguns segundos.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 2: Aplicar trigger
DROP TRIGGER IF EXISTS prevent_duplicate_board_trigger ON trello_boards;
CREATE TRIGGER prevent_duplicate_board_trigger
    BEFORE INSERT ON trello_boards
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_board_creation();

-- PASSO 3: Limpar duplicados existentes
UPDATE trello_boards 
SET is_deleted = true 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY title, created_by ORDER BY created_at) as rn
        FROM trello_boards 
        WHERE is_deleted = false
    ) ranked 
    WHERE rn > 1
);

-- PASSO 4: Remover políticas antigas
DROP POLICY IF EXISTS "Users can only see their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only create their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only update their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only delete their own boards" ON trello_boards;

-- PASSO 5: Criar política unificada
CREATE POLICY "Users can manage their own boards" ON trello_boards
    FOR ALL USING (auth.uid() = created_by);

-- PASSO 6: Atualizar função get_user_boards_simple
CREATE OR REPLACE FUNCTION get_user_boards_simple()
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    background_color TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    member_role TEXT
) AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT 
        tb.id,
        tb.title,
        tb.description,
        tb.background_color,
        tb.created_by,
        tb.created_at,
        tb.updated_at,
        'owner'::TEXT as member_role
    FROM trello_boards tb
    WHERE tb.created_by = auth.uid()
    AND tb.is_deleted = false
    ORDER BY tb.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 7: Atualizar função create_board_with_type
CREATE OR REPLACE FUNCTION create_board_with_type(
    board_title TEXT,
    board_description TEXT DEFAULT NULL,
    background_color TEXT DEFAULT '#0079bf',
    board_type_uuid UUID DEFAULT NULL,
    process_number TEXT DEFAULT NULL,
    responsible_person TEXT DEFAULT NULL,
    company TEXT DEFAULT NULL,
    object_description TEXT DEFAULT NULL,
    process_value DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    new_board_id UUID;
    result JSON;
    existing_count INTEGER;
BEGIN
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar duplicação
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = board_title
    AND created_by = current_user_id
    AND created_at > (NOW() - INTERVAL '10 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro já foi criado recentemente.';
    END IF;
    
    -- Criar quadro
    INSERT INTO trello_boards (title, description, background_color, created_by)
    VALUES (board_title, board_description, background_color, current_user_id)
    RETURNING id INTO new_board_id;
    
    -- Criar listas
    IF board_type_uuid IS NOT NULL THEN
        INSERT INTO trello_lists (board_id, title, position) VALUES
        (new_board_id, 'Documentação', 0),
        (new_board_id, 'Análise', 1),
        (new_board_id, 'Aprovação', 2),
        (new_board_id, 'Execução', 3),
        (new_board_id, 'Finalizado', 4);
    ELSE
        INSERT INTO trello_lists (board_id, title, position) VALUES
        (new_board_id, 'A Fazer', 0),
        (new_board_id, 'Em Progresso', 1),
        (new_board_id, 'Concluído', 2);
    END IF;
    
    -- Retornar resultado
    SELECT json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'background_color', background_color,
        'created_by', created_by,
        'created_at', created_at,
        'updated_at', updated_at,
        'member_role', 'owner'
    ) INTO result
    FROM trello_boards
    WHERE id = new_board_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 8: Garantir permissões
GRANT EXECUTE ON FUNCTION get_user_boards_simple TO authenticated;
GRANT EXECUTE ON FUNCTION create_board_with_type TO authenticated;

-- PASSO 9: Verificações finais
SELECT 'Correção aplicada!' as status;

SELECT COUNT(*) as total_boards_ativos FROM trello_boards WHERE is_deleted = false;

SELECT COUNT(*) as duplicados_restantes FROM (
    SELECT title, created_by
    FROM trello_boards
    WHERE is_deleted = false
    GROUP BY title, created_by
    HAVING COUNT(*) > 1
) duplicates;