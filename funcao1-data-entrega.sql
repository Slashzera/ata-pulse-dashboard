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
            'O cartao vence em breve',
            due_date - INTERVAL '1 day'
        FROM trello_cards c WHERE c.id = card_uuid;
    END IF;

    INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
    VALUES (card_uuid, auth.uid(), 'due_date_set', json_build_object('due_date', due_date));

    SELECT row_to_json(c.*) INTO result FROM trello_cards c WHERE c.id = card_uuid;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;