-- PARTE 1: Apenas as Tabelas do Sistema Trellinho
-- Execute esta parte primeiro para criar as estruturas básicas

-- Tabela para Notificações e Lembretes
CREATE TABLE IF NOT EXISTS trello_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
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
    trigger_type VARCHAR(50) NOT NULL,
    trigger_conditions JSONB,
    action_type VARCHAR(50) NOT NULL,
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

-- Políticas básicas
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
    );