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
$$ LANGUAGE plpgsql SECURITY DEFINER;