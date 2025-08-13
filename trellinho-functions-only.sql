-- PARTE 2: Apenas as Funções do Sistema Trellinho
-- Execute esta parte DEPOIS de executar trellinho-tables-only.sql

-- Função para definir data de entrega
CREATE OR REPLACE FUNCTION set_card_due_date(
    card_uuid UUID,
    due_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    UPDATE trello_cards 
    SET due_date = set_card_due_date.due_date, updated_at = NOW()
    WHERE id = card_uuid;

    IF due_date > NOW() THEN
        INSERT INTO trello_notifications (user_id, card_id, type, title, message, scheduled_for)
        SELECT 
            auth.uid(),
            card_uuid,
            'due_date',
            'Prazo se aproximando',
            'O cartão vence em breve',
            due_date - INTERVAL '1 day'
        FROM trello_cards c WHERE c.id = card_uuid;
    END IF;

    INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
    VALUES (card_uuid, auth.uid(), 'due_date_set', json_build_object('due_date', due_date));

    SELECT row_to_json(c.*) INTO result FROM trello_cards c WHERE c.id = card_uuid;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;--
 Função para mover cartão entre listas
CREATE OR REPLACE FUNCTION move_card_to_list(
    card_uuid UUID,
    target_list_uuid UUID,
    new_position INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_list_id UUID;
    calculated_position INTEGER;
BEGIN
    SELECT list_id INTO old_list_id FROM trello_cards WHERE id = card_uuid;

    IF new_position IS NULL THEN
        SELECT COALESCE(MAX(position), -1) + 1 INTO calculated_position
        FROM trello_cards WHERE list_id = target_list_uuid AND is_deleted = FALSE;
    ELSE
        calculated_position := new_position;
    END IF;

    UPDATE trello_cards 
    SET list_id = target_list_uuid, position = calculated_position, updated_at = NOW()
    WHERE id = card_uuid;

    INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
    VALUES (card_uuid, auth.uid(), 'card_moved', 
            json_build_object('from_list', old_list_id, 'to_list', target_list_uuid));

    SELECT row_to_json(c.*) INTO result FROM trello_cards c WHERE c.id = card_uuid;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Função p
ara gerenciar etiquetas
CREATE OR REPLACE FUNCTION manage_card_labels(
    card_uuid UUID,
    label_ids UUID[]
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    DELETE FROM trello_card_labels WHERE card_id = card_uuid;

    IF array_length(label_ids, 1) > 0 THEN
        INSERT INTO trello_card_labels (card_id, label_id)
        SELECT card_uuid, unnest(label_ids);
    END IF;

    INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
    VALUES (card_uuid, auth.uid(), 'labels_updated', json_build_object('label_ids', label_ids));

    SELECT json_agg(
        json_build_object(
            'id', l.id,
            'name', l.name,
            'color', l.color
        )
    ) INTO result
    FROM trello_card_labels cl
    JOIN trello_labels l ON cl.label_id = l.id
    WHERE cl.card_id = card_uuid;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Fun
ção para buscar notificações do usuário
CREATE OR REPLACE FUNCTION get_user_notifications(
    limit_count INTEGER DEFAULT 50
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', n.id,
            'type', n.type,
            'title', n.title,
            'message', n.message,
            'is_read', n.is_read,
            'created_at', n.created_at,
            'card', json_build_object(
                'id', c.id,
                'title', c.title
            )
        ) ORDER BY n.created_at DESC
    ) INTO result
    FROM trello_notifications n
    LEFT JOIN trello_cards c ON n.card_id = c.id
    WHERE n.user_id = auth.uid()
    LIMIT limit_count;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_read(
    notification_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE trello_notifications 
    SET is_read = TRUE 
    WHERE id = notification_uuid AND user_id = auth.uid();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;