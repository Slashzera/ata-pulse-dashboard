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