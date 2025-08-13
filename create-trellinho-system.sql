-- Sistema Trellinho - Estrutura do Banco de Dados
-- Criação das tabelas para o sistema de gerenciamento de projetos estilo Trello

-- Tabela de Quadros (Boards)
CREATE TABLE IF NOT EXISTS trello_boards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    background_color VARCHAR(7) DEFAULT '#0079bf',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabela de Listas (Lists)
CREATE TABLE IF NOT EXISTS trello_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES trello_boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabela de Cartões (Cards)
CREATE TABLE IF NOT EXISTS trello_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES trello_lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Tabela de Membros do Quadro
CREATE TABLE IF NOT EXISTS trello_board_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES trello_boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(board_id, user_id)
);

-- Tabela de Membros do Cartão
CREATE TABLE IF NOT EXISTS trello_card_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(card_id, user_id)
);

-- Tabela de Etiquetas (Labels)
CREATE TABLE IF NOT EXISTS trello_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    board_id UUID REFERENCES trello_boards(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#61bd4f',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Etiquetas dos Cartões
CREATE TABLE IF NOT EXISTS trello_card_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    label_id UUID REFERENCES trello_labels(id) ON DELETE CASCADE,
    UNIQUE(card_id, label_id)
);

-- Tabela de Checklists
CREATE TABLE IF NOT EXISTS trello_checklists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Itens do Checklist
CREATE TABLE IF NOT EXISTS trello_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checklist_id UUID REFERENCES trello_checklists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Anexos
CREATE TABLE IF NOT EXISTS trello_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS trello_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_trello_boards_created_by ON trello_boards(created_by);
CREATE INDEX IF NOT EXISTS idx_trello_lists_board_id ON trello_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_trello_cards_list_id ON trello_cards(list_id);
CREATE INDEX IF NOT EXISTS idx_trello_board_members_board_id ON trello_board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_trello_card_members_card_id ON trello_card_members(card_id);
CREATE INDEX IF NOT EXISTS idx_trello_labels_board_id ON trello_labels(board_id);
CREATE INDEX IF NOT EXISTS idx_trello_checklists_card_id ON trello_checklists(card_id);
CREATE INDEX IF NOT EXISTS idx_trello_attachments_card_id ON trello_attachments(card_id);
CREATE INDEX IF NOT EXISTS idx_trello_comments_card_id ON trello_comments(card_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trello_boards_updated_at BEFORE UPDATE ON trello_boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trello_lists_updated_at BEFORE UPDATE ON trello_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trello_cards_updated_at BEFORE UPDATE ON trello_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trello_comments_updated_at BEFORE UPDATE ON trello_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE trello_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_card_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trello_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para Quadros
CREATE POLICY "Users can view boards they are members of" ON trello_boards
    FOR SELECT USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM trello_board_members 
            WHERE board_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create boards" ON trello_boards
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Board owners and admins can update boards" ON trello_boards
    FOR UPDATE USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM trello_board_members 
            WHERE board_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Board owners can delete boards" ON trello_boards
    FOR DELETE USING (auth.uid() = created_by);

-- Políticas para Listas
CREATE POLICY "Users can view lists from accessible boards" ON trello_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trello_boards b
            LEFT JOIN trello_board_members bm ON b.id = bm.board_id
            WHERE b.id = board_id AND (
                b.created_by = auth.uid() OR 
                (bm.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage lists" ON trello_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trello_boards b
            LEFT JOIN trello_board_members bm ON b.id = bm.board_id
            WHERE b.id = board_id AND (
                b.created_by = auth.uid() OR 
                (bm.user_id = auth.uid())
            )
        )
    );

-- Políticas similares para outras tabelas
CREATE POLICY "Users can view cards from accessible boards" ON trello_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trello_lists l
            JOIN trello_boards b ON l.board_id = b.id
            LEFT JOIN trello_board_members bm ON b.id = bm.board_id
            WHERE l.id = list_id AND (
                b.created_by = auth.uid() OR 
                (bm.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage cards" ON trello_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trello_lists l
            JOIN trello_boards b ON l.board_id = b.id
            LEFT JOIN trello_board_members bm ON b.id = bm.board_id
            WHERE l.id = list_id AND (
                b.created_by = auth.uid() OR 
                (bm.user_id = auth.uid())
            )
        )
    );

-- Funções auxiliares
CREATE OR REPLACE FUNCTION get_user_boards()
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    background_color VARCHAR(7),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    member_role VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.description,
        b.background_color,
        b.created_by,
        b.created_at,
        b.updated_at,
        COALESCE(bm.role, 'owner') as member_role
    FROM trello_boards b
    LEFT JOIN trello_board_members bm ON b.id = bm.board_id AND bm.user_id = auth.uid()
    WHERE b.is_deleted = FALSE AND (
        b.created_by = auth.uid() OR 
        bm.user_id = auth.uid()
    )
    ORDER BY b.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_board_with_lists_and_cards(board_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'board', row_to_json(b.*),
        'lists', COALESCE(lists_data.lists, '[]'::json)
    ) INTO result
    FROM trello_boards b
    LEFT JOIN (
        SELECT 
            l.board_id,
            json_agg(
                json_build_object(
                    'id', l.id,
                    'title', l.title,
                    'position', l.position,
                    'cards', COALESCE(cards_data.cards, '[]'::json)
                ) ORDER BY l.position
            ) as lists
        FROM trello_lists l
        LEFT JOIN (
            SELECT 
                c.list_id,
                json_agg(
                    json_build_object(
                        'id', c.id,
                        'title', c.title,
                        'description', c.description,
                        'position', c.position,
                        'due_date', c.due_date,
                        'created_by', c.created_by
                    ) ORDER BY c.position
                ) as cards
            FROM trello_cards c
            WHERE c.is_deleted = FALSE
            GROUP BY c.list_id
        ) cards_data ON l.id = cards_data.list_id
        WHERE l.is_deleted = FALSE
        GROUP BY l.board_id
    ) lists_data ON b.id = lists_data.board_id
    WHERE b.id = board_uuid AND b.is_deleted = FALSE;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;