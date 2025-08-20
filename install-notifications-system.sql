-- Instalação do Sistema de Notificações KazuFlow
-- Execute este arquivo no Supabase SQL Editor

-- 1. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'card_created', 'card_moved', 'card_updated', 'board_created', 'board_deleted'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Dados adicionais (IDs, nomes, etc.)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- 5. Criar políticas de segurança
-- Usuários só podem ver suas próprias notificações
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem marcar suas notificações como lidas
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Sistema pode criar notificações para qualquer usuário
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Usuários podem deletar suas próprias notificações
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Remover funções existentes se houver
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, JSONB);
DROP FUNCTION IF EXISTS mark_notification_read(UUID);
DROP FUNCTION IF EXISTS mark_all_notifications_read();
DROP FUNCTION IF EXISTS cleanup_old_notifications();

-- 7. Função para criar notificações automaticamente
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro ao criar notificação: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- 8. Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- 9. Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = NOW()
    WHERE user_id = auth.uid() AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 10. Função para deletar notificações antigas (mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END;
$$;

-- 11. Remover triggers existentes se houver
DROP TRIGGER IF EXISTS trigger_notify_card_created ON trello_cards;
DROP TRIGGER IF EXISTS trigger_notify_card_moved ON trello_cards;
DROP TRIGGER IF EXISTS trigger_notify_board_created ON trello_boards;

-- 12. Remover funções de trigger existentes se houver
DROP FUNCTION IF EXISTS notify_card_created();
DROP FUNCTION IF EXISTS notify_card_moved();
DROP FUNCTION IF EXISTS notify_board_created();

-- 13. Função de trigger para criação de cartões
CREATE OR REPLACE FUNCTION notify_card_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    board_title TEXT;
    list_title TEXT;
    board_users UUID[];
    user_id UUID;
BEGIN
    -- Buscar informações do quadro e lista
    SELECT b.title, l.title INTO board_title, list_title
    FROM trello_boards b
    JOIN trello_lists l ON l.board_id = b.id
    WHERE l.id = NEW.list_id;
    
    -- Buscar todos os usuários que têm acesso ao quadro
    SELECT ARRAY_AGG(DISTINCT created_by) INTO board_users
    FROM trello_boards b
    JOIN trello_lists l ON l.board_id = b.id
    WHERE l.id = NEW.list_id;
    
    -- Criar notificação para cada usuário (exceto quem criou)
    FOREACH user_id IN ARRAY board_users
    LOOP
        IF user_id != NEW.created_by THEN
            PERFORM create_notification(
                user_id,
                'card_created',
                'Novo cartão criado',
                'O cartão "' || NEW.title || '" foi criado na lista "' || list_title || '" do quadro "' || board_title || '"',
                json_build_object(
                    'card_id', NEW.id,
                    'card_title', NEW.title,
                    'list_title', list_title,
                    'board_title', board_title,
                    'created_by', NEW.created_by
                )
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no trigger notify_card_created: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 14. Função de trigger para movimentação de cartões
CREATE OR REPLACE FUNCTION notify_card_moved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    board_title TEXT;
    old_list_title TEXT;
    new_list_title TEXT;
    board_users UUID[];
    user_id UUID;
BEGIN
    -- Verificar se o cartão foi realmente movido de lista
    IF OLD.list_id != NEW.list_id THEN
        -- Buscar informações das listas e quadro
        SELECT b.title, ol.title, nl.title INTO board_title, old_list_title, new_list_title
        FROM trello_boards b
        JOIN trello_lists ol ON ol.id = OLD.list_id
        JOIN trello_lists nl ON nl.id = NEW.list_id
        WHERE b.id = ol.board_id;
        
        -- Buscar usuários do quadro
        SELECT ARRAY_AGG(DISTINCT created_by) INTO board_users
        FROM trello_boards b
        JOIN trello_lists l ON l.board_id = b.id
        WHERE l.id = NEW.list_id;
        
        -- Criar notificações
        FOREACH user_id IN ARRAY board_users
        LOOP
            PERFORM create_notification(
                user_id,
                'card_moved',
                'Cartão movido',
                'O cartão "' || NEW.title || '" foi movido de "' || old_list_title || '" para "' || new_list_title || '" no quadro "' || board_title || '"',
                json_build_object(
                    'card_id', NEW.id,
                    'card_title', NEW.title,
                    'old_list_title', old_list_title,
                    'new_list_title', new_list_title,
                    'board_title', board_title
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no trigger notify_card_moved: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 15. Função de trigger para criação de quadros
CREATE OR REPLACE FUNCTION notify_board_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Notificar o próprio usuário sobre a criação do quadro
    PERFORM create_notification(
        NEW.created_by,
        'board_created',
        'Quadro criado com sucesso',
        'O quadro "' || NEW.title || '" foi criado com sucesso',
        json_build_object(
            'board_id', NEW.id,
            'board_title', NEW.title
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no trigger notify_board_created: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 16. Criar os triggers
CREATE TRIGGER trigger_notify_card_created
    AFTER INSERT ON trello_cards
    FOR EACH ROW EXECUTE FUNCTION notify_card_created();

CREATE TRIGGER trigger_notify_card_moved
    AFTER UPDATE ON trello_cards
    FOR EACH ROW EXECUTE FUNCTION notify_card_moved();

CREATE TRIGGER trigger_notify_board_created
    AFTER INSERT ON trello_boards
    FOR EACH ROW EXECUTE FUNCTION notify_board_created();

-- 17. Dar permissões
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR(50), VARCHAR(255), TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;

-- 18. Criar algumas notificações de exemplo (opcional - descomente para testar)
/*
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        PERFORM create_notification(
            current_user_id,
            'card_created',
            'Bem-vindo ao Sistema de Notificações!',
            'O sistema de notificações foi instalado com sucesso. Você receberá notificações sobre atividades nos seus quadros.',
            '{"welcome": true}'
        );
        
        PERFORM create_notification(
            current_user_id,
            'board_created',
            'Sistema Configurado',
            'Todas as funcionalidades de notificação estão ativas e funcionando.',
            '{"system_ready": true}'
        );
    END IF;
END $$;
*/

-- 19. Verificar se tudo foi criado corretamente
SELECT 
    'Tabela notifications' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status
UNION ALL
SELECT 
    'Função create_notification' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_notification') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status
UNION ALL
SELECT 
    'Função mark_notification_read' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_notification_read') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status
UNION ALL
SELECT 
    'Função mark_all_notifications_read' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_all_notifications_read') 
         THEN '✅ Criada' 
         ELSE '❌ Não encontrada' 
    END as status
UNION ALL
SELECT 
    'Trigger notify_card_created' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_card_created') 
         THEN '✅ Criado' 
         ELSE '❌ Não encontrado' 
    END as status
UNION ALL
SELECT 
    'Trigger notify_card_moved' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_card_moved') 
         THEN '✅ Criado' 
         ELSE '❌ Não encontrado' 
    END as status
UNION ALL
SELECT 
    'Trigger notify_board_created' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_board_created') 
         THEN '✅ Criado' 
         ELSE '❌ Não encontrado' 
    END as status;

-- 20. Mensagem final
SELECT '🎉 Sistema de Notificações instalado com sucesso!' as message;