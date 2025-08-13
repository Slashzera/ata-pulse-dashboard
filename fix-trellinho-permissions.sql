-- Correção das Políticas RLS do Sistema Trellinho
-- Execute este arquivo para corrigir os problemas de permissão

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Users can view boards they are members of" ON trello_boards;
DROP POLICY IF EXISTS "Users can create boards" ON trello_boards;
DROP POLICY IF EXISTS "Board owners and admins can update boards" ON trello_boards;
DROP POLICY IF EXISTS "Board owners can delete boards" ON trello_boards;

DROP POLICY IF EXISTS "Users can view lists from accessible boards" ON trello_lists;
DROP POLICY IF EXISTS "Board members can manage lists" ON trello_lists;

DROP POLICY IF EXISTS "Users can view cards from accessible boards" ON trello_cards;
DROP POLICY IF EXISTS "Board members can manage cards" ON trello_cards;

-- Políticas mais permissivas para Quadros
CREATE POLICY "Enable all operations for authenticated users on boards" ON trello_boards
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas mais permissivas para Listas
CREATE POLICY "Enable all operations for authenticated users on lists" ON trello_lists
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas mais permissivas para Cartões
CREATE POLICY "Enable all operations for authenticated users on cards" ON trello_cards
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para outras tabelas
CREATE POLICY "Enable all operations for authenticated users on board_members" ON trello_board_members
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users on card_members" ON trello_card_members
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users on labels" ON trello_labels
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users on card_labels" ON trello_card_labels
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users on checklists" ON trello_checklists
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users on checklist_items" ON trello_checklist_items
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users on attachments" ON trello_attachments
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all operations for authenticated users on comments" ON trello_comments
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Função simplificada para buscar quadros do usuário
CREATE OR REPLACE FUNCTION get_user_boards_simple()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    background_color VARCHAR(7),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    member_role VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.background_color,
        b.created_by,
        b.created_at,
        b.updated_at,
        'owner'::VARCHAR(20) as member_role
    FROM trello_boards b
    WHERE b.is_deleted = FALSE 
    AND b.created_by = auth.uid()
    ORDER BY b.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função simplificada para buscar dados do quadro
CREATE OR REPLACE FUNCTION get_board_details_simple(board_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'board', row_to_json(b.*),
        'lists', COALESCE(lists_data.lists, '[]'::json)
    ) INTO result
    FROM trello_boards b
    LEFT JOIN (
        SELECT 
            l.board_id,
            json_agg(
                json_build_object(
                    'id', l.id,
                    'title', l.title,
                    'position', l.position,
                    'cards', COALESCE(cards_data.cards, '[]'::json)
                ) ORDER BY l.position
            ) as lists
        FROM trello_lists l
        LEFT JOIN (
            SELECT 
                c.list_id,
                json_agg(
                    json_build_object(
                        'id', c.id,
                        'title', c.title,
                        'description', c.description,
                        'position', c.position,
                        'due_date', c.due_date,
                        'created_by', c.created_by
                    ) ORDER BY c.position
                ) as cards
            FROM trello_cards c
            WHERE c.is_deleted = FALSE
            GROUP BY c.list_id
        ) cards_data ON l.id = cards_data.list_id
        WHERE l.is_deleted = FALSE
        GROUP BY l.board_id
    ) lists_data ON b.id = lists_data.board_id
    WHERE b.id = board_uuid 
    AND b.is_deleted = FALSE
    AND b.created_by = auth.uid();
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;