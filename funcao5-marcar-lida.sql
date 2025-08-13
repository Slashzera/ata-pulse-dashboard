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