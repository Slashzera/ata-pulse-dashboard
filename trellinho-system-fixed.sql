-- Sistema Completo Trellinho - Funcionalidades Avançadas (CORRIGIDO)
-- Datas, Etiquetas, Movimentação, Automação, Anexos e Visualizações

-- Tabela para Notificações e Lembretes
CREATE TABLE IF NOT EXISTS trello_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'due_date', 'assignment', 'comment', 'move'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para Automações (Butler)
CREATE TABLE IF NOT EXISTS trello_automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES trello_boards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- 'card_moved', 'due_date', 'label_added'
    trigger_conditions JSONB,
    action_type VARCHAR(50) NOT NULL, -- 'move_card', 'add_label', 'assign_member'
    action_parameters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para Histórico de Atividades
CREATE TABLE IF NOT EXISTS trello_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trello_notifications_user_id ON trello_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_trello_notifications_card_id ON trello_notifications(card_id);
CREATE INDEX IF NOT EXISTS idx_trello_automations_board_id ON trello_automations(board_id);
CREATE INDEX IF NOT EXISTS idx_trello_activities_card_id ON trello_activities(card_id);

-- Políticas RLS para novas tabelas
ALTER TABLE trello_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notifications" ON trello_notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Board members can manage automations" ON trello_automations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trello_boards b
            WHERE b.id = board_id AND b.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view activities from accessible cards" ON trello_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trello_cards c
            JOIN trello_lists l ON c.list_id = l.id
            JOIN trello_boards b ON l.board_id = b.id
            WHERE c.id = card_id AND b.created_by = auth.uid()
        )
    );-
- Função para definir data de entrega
CREATE OR REPLACE FUNCTION set_card_due_date(
    card_uuid UUID,
    due_date TIMESTAMP WITH TIME ZONE
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
        WHERE c.id = card_uuid AND b.created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este cartão';
    END IF;

    -- Atualizar data de entrega
    UPDATE trello_cards 
    SET due_date = set_card_due_date.due_date, updated_at = NOW()
    WHERE id = card_uuid;

    -- Criar notificação se a data for futura
    IF due_date > NOW() THEN
        INSERT INTO trello_notifications (user_id, card_id, type, title, message, scheduled_for)
        SELECT 
            auth.uid(),
            card_uuid,
            'due_date',
            'Prazo se aproximando',
            'O cartão "' || c.title || '" vence em breve',
            due_date - INTERVAL '1 day'
        FROM trello_cards c WHERE c.id = card_uuid;
    END IF;

    -- Registrar atividade
    INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
    VALUES (card_uuid, auth.uid(), 'due_date_set', json_build_object('due_date', due_date));

    -- Retornar cartão atualizado
    SELECT row_to_json(c.*) INTO result FROM trello_cards c WHERE c.id = card_uuid;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para mover cartão entre listas
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
    -- Verificar permissão
    IF NOT EXISTS (
        SELECT 1 FROM trello_cards c
        JOIN trello_lists l ON c.list_id = l.id
        JOIN trello_boards b ON l.board_id = b.id
        WHERE c.id = card_uuid AND b.created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Sem permissão para mover este cartão';
    END IF;

    -- Obter lista atual
    SELECT list_id INTO old_list_id FROM trello_cards WHERE id = card_uuid;

    -- Calcular nova posição se não fornecida
    IF new_position IS NULL THEN
        SELECT COALESCE(MAX(position), -1) + 1 INTO calculated_position
        FROM trello_cards WHERE list_id = target_list_uuid AND is_deleted = FALSE;
    ELSE
        calculated_position := new_position;
    END IF;

    -- Mover cartão
    UPDATE trello_cards 
    SET list_id = target_list_uuid, position = calculated_position, updated_at = NOW()
    WHERE id = card_uuid;

    -- Registrar atividade
    INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
    VALUES (card_uuid, auth.uid(), 'card_moved', 
            json_build_object('from_list', old_list_id, 'to_list', target_list_uuid));

    -- Retornar cartão atualizado
    SELECT row_to_json(c.*) INTO result FROM trello_cards c WHERE c.id = card_uuid;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Fu
nção para gerenciar etiquetas
CREATE OR REPLACE FUNCTION manage_card_labels(
    card_uuid UUID,
    label_ids UUID[]
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
        WHERE c.id = card_uuid AND b.created_by = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Sem permissão para editar este cartão';
    END IF;

    -- Remover etiquetas existentes
    DELETE FROM trello_card_labels WHERE card_id = card_uuid;

    -- Adicionar novas etiquetas
    IF array_length(label_ids, 1) > 0 THEN
        INSERT INTO trello_card_labels (card_id, label_id)
        SELECT card_uuid, unnest(label_ids);
    END IF;

    -- Registrar atividade
    INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
    VALUES (card_uuid, auth.uid(), 'labels_updated', json_build_object('label_ids', label_ids));

    -- Retornar etiquetas atualizadas
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

-- Função para buscar notificações do usuário
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