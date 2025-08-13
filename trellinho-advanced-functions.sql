-- Funções Avançadas do Sistema Trellinho
-- Salvar descrição, gerenciar checklists e ações dos cartões

-- Função para atualizar descrição do cartão
CREATE OR REPLACE FUNCTION update_card_description(
    card_uuid UUID,
    new_description TEXT
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Verificar se o usuário tem permissão para editar o cartão
    IF NOT EXISTS (
        SELECT 1 FROM trello_cards c
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE c.id = card_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este cartão';
    END IF;

    -- Atualizar a descrição
    UPDATE trello_cards 
    SET description = new_description, updated_at = NOW()
    WHERE id = card_uuid;

    -- Retornar o cartão atualizado
    SELECT row_to_json(c.*) INTO result
    FROM trello_cards c
    WHERE c.id = card_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar título do cartão
CREATE OR REPLACE FUNCTION update_card_title(
    card_uuid UUID,
    new_title VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_cards c
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE c.id = card_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este cartão';
    END IF;

    -- Atualizar o título
    UPDATE trello_cards 
    SET title = new_title, updated_at = NOW()
    WHERE id = card_uuid;

    -- Retornar o cartão atualizado
    SELECT row_to_json(c.*) INTO result
    FROM trello_cards c
    WHERE c.id = card_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar checklist
CREATE OR REPLACE FUNCTION create_checklist(
    card_uuid UUID,
    checklist_title VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    new_position INTEGER;
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_cards c
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE c.id = card_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este cartão';
    END IF;

    -- Obter próxima posição
    SELECT COALESCE(MAX(position), -1) + 1 INTO new_position
    FROM trello_checklists
    WHERE card_id = card_uuid;

    -- Inserir checklist
    INSERT INTO trello_checklists (card_id, title, position)
    VALUES (card_uuid, checklist_title, new_position)
    RETURNING row_to_json(trello_checklists.*) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar item ao checklist
CREATE OR REPLACE FUNCTION add_checklist_item(
    checklist_uuid UUID,
    item_text TEXT
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    new_position INTEGER;
BEGIN
    -- Verificar permissão através do checklist
    IF NOT EXISTS (
        SELECT 1 FROM trello_checklists cl
        JOIN trello_cards c ON cl.card_id = c.id
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE cl.id = checklist_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este checklist';
    END IF;

    -- Obter próxima posição
    SELECT COALESCE(MAX(position), -1) + 1 INTO new_position
    FROM trello_checklist_items
    WHERE checklist_id = checklist_uuid;

    -- Inserir item
    INSERT INTO trello_checklist_items (checklist_id, text, position)
    VALUES (checklist_uuid, item_text, new_position)
    RETURNING row_to_json(trello_checklist_items.*) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar/desmarcar item do checklist
CREATE OR REPLACE FUNCTION toggle_checklist_item(
    item_uuid UUID,
    is_completed BOOLEAN
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_checklist_items ci
        JOIN trello_checklists cl ON ci.checklist_id = cl.id
        JOIN trello_cards c ON cl.card_id = c.id
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE ci.id = item_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este item';
    END IF;

    -- Atualizar item
    UPDATE trello_checklist_items 
    SET 
        is_completed = toggle_checklist_item.is_completed,
        completed_at = CASE 
            WHEN toggle_checklist_item.is_completed THEN NOW() 
            ELSE NULL 
        END
    WHERE id = item_uuid
    RETURNING row_to_json(trello_checklist_items.*) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para editar item do checklist
CREATE OR REPLACE FUNCTION update_checklist_item(
    item_uuid UUID,
    new_text TEXT
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_checklist_items ci
        JOIN trello_checklists cl ON ci.checklist_id = cl.id
        JOIN trello_cards c ON cl.card_id = c.id
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE ci.id = item_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este item';
    END IF;

    -- Atualizar texto do item
    UPDATE trello_checklist_items 
    SET text = new_text
    WHERE id = item_uuid
    RETURNING row_to_json(trello_checklist_items.*) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para deletar item do checklist
CREATE OR REPLACE FUNCTION delete_checklist_item(
    item_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_checklist_items ci
        JOIN trello_checklists cl ON ci.checklist_id = cl.id
        JOIN trello_cards c ON cl.card_id = c.id
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE ci.id = item_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para deletar este item';
    END IF;

    -- Deletar item
    DELETE FROM trello_checklist_items WHERE id = item_uuid;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para deletar checklist completo
CREATE OR REPLACE FUNCTION delete_checklist(
    checklist_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_checklists cl
        JOIN trello_cards c ON cl.card_id = c.id
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE cl.id = checklist_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para deletar este checklist';
    END IF;

    -- Deletar todos os itens primeiro (cascade deve fazer isso automaticamente)
    DELETE FROM trello_checklist_items WHERE checklist_id = checklist_uuid;
    
    -- Deletar checklist
    DELETE FROM trello_checklists WHERE id = checklist_uuid;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar detalhes completos do cartão com checklists
CREATE OR REPLACE FUNCTION get_card_details(card_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'card', row_to_json(c.*),
        'checklists', COALESCE(checklists_data.checklists, '[]'::json)
    ) INTO result
    FROM trello_cards c
    LEFT JOIN (
        SELECT 
            cl.card_id,
            json_agg(
                json_build_object(
                    'id', cl.id,
                    'title', cl.title,
                    'position', cl.position,
                    'created_at', cl.created_at,
                    'items', COALESCE(items_data.items, '[]'::json)
                ) ORDER BY cl.position
            ) as checklists
        FROM trello_checklists cl
        LEFT JOIN (
            SELECT 
                ci.checklist_id,
                json_agg(
                    json_build_object(
                        'id', ci.id,
                        'text', ci.text,
                        'is_completed', ci.is_completed,
                        'position', ci.position,
                        'created_at', ci.created_at,
                        'completed_at', ci.completed_at
                    ) ORDER BY ci.position
                ) as items
            FROM trello_checklist_items ci
            GROUP BY ci.checklist_id
        ) items_data ON cl.id = items_data.checklist_id
        GROUP BY cl.card_id
    ) checklists_data ON c.id = checklists_data.card_id
    WHERE c.id = card_uuid 
    AND c.is_deleted = FALSE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para arquivar cartão
CREATE OR REPLACE FUNCTION archive_card(card_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_cards c
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE c.id = card_uuid 
        AND (b.created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM trello_board_members bm 
            WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        ))
    ) THEN
        RAISE EXCEPTION 'Sem permissão para arquivar este cartão';
    END IF;

    -- Marcar como deletado (soft delete)
    UPDATE trello_cards 
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE id = card_uuid;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;