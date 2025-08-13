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
$$ LANGUAGE plpgsql SECURITY DEFINER;