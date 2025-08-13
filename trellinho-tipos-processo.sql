-- Sistema de Tipos de Processo para Quadros Trellinho
-- Baseado nos tipos de processos administrativos

-- Tabela para Tipos de Processo
CREATE TABLE IF NOT EXISTS trello_board_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#0079bf',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna de tipo ao quadro
ALTER TABLE trello_boards 
ADD COLUMN IF NOT EXISTS board_type_id UUID REFERENCES trello_board_types(id),
ADD COLUMN IF NOT EXISTS process_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS responsible_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS object_description TEXT,
ADD COLUMN IF NOT EXISTS process_value DECIMAL(15,2);

-- Inserir os tipos de processo solicitados
INSERT INTO trello_board_types (name, description, color, icon) VALUES
('Ata de Registro de Preços', 'Processo para registro de preços de produtos e serviços', '#3b82f6', 'file-text'),
('Adesão a Ata', 'Processo de adesão a ata de registro de preços existente', '#10b981', 'user-plus'),
('Aquisição Global', 'Processo de aquisição global de produtos ou serviços', '#8b5cf6', 'globe'),
('Inexigibilidade', 'Processo de contratação por inexigibilidade de licitação', '#f59e0b', 'alert-circle'),
('Termo Aditivo / Prorrogação', 'Processo para termos aditivos e prorrogações contratuais', '#06b6d4', 'file-plus'),
('Reajuste de Preços', 'Processo para reajuste de preços contratuais', '#ef4444', 'trending-up'),
('Reequilíbrio Econômico', 'Processo para reequilíbrio econômico-financeiro', '#f97316', 'balance-scale'),
('Repactuação', 'Processo de repactuação de contratos', '#84cc16', 'refresh-cw'),
('Rescisão Contratual', 'Processo para rescisão de contratos', '#dc2626', 'x-circle'),
('Sanção Administrativa', 'Processo de aplicação de sanções administrativas', '#991b1b', 'shield-alert'),
('Termo de Ajustes de Contas', 'Processo para ajustes de contas', '#7c3aed', 'calculator'),
('Piso da Enfermagem', 'Processo relacionado ao piso salarial da enfermagem', '#059669', 'heart'),
('Isenção de IPTU', 'Processo de isenção de IPTU', '#0891b2', 'home'),
('Pagamentos', 'Processo de pagamentos diversos', '#65a30d', 'credit-card')
ON CONFLICT (name) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_trello_boards_type_id ON trello_boards(board_type_id);
CREATE INDEX IF NOT EXISTS idx_trello_board_types_active ON trello_board_types(is_active);

-- Políticas RLS
ALTER TABLE trello_board_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active board types" ON trello_board_types
    FOR SELECT USING (is_active = TRUE);

-- Função para buscar tipos de processo ativos
CREATE OR REPLACE FUNCTION get_board_types()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'description', description,
            'color', color,
            'icon', icon
        ) ORDER BY name
    ) INTO result
    FROM trello_board_types
    WHERE is_active = TRUE;

    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar quadro com tipo de processo
CREATE OR REPLACE FUNCTION create_board_with_type(
    board_title VARCHAR(255),
    board_description TEXT,
    background_color VARCHAR(7),
    board_type_uuid UUID,
    process_number VARCHAR(100) DEFAULT NULL,
    responsible_person VARCHAR(255) DEFAULT NULL,
    company VARCHAR(255) DEFAULT NULL,
    object_description TEXT DEFAULT NULL,
    process_value DECIMAL(15,2) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    new_board_id UUID;
BEGIN
    -- Inserir novo quadro
    INSERT INTO trello_boards (
        title, 
        description, 
        background_color, 
        created_by,
        board_type_id,
        process_number,
        responsible_person,
        company,
        object_description,
        process_value
    ) VALUES (
        board_title,
        board_description,
        background_color,
        auth.uid(),
        board_type_uuid,
        process_number,
        responsible_person,
        company,
        object_description,
        process_value
    ) RETURNING id INTO new_board_id;

    -- Criar listas padrão baseadas no tipo de processo
    INSERT INTO trello_lists (board_id, title, position) VALUES
    (new_board_id, 'A fazer', 0),
    (new_board_id, 'Em andamento', 1),
    (new_board_id, 'Em análise', 2),
    (new_board_id, 'Concluído', 3);

    -- Retornar quadro criado com informações do tipo
    SELECT json_build_object(
        'id', b.id,
        'title', b.title,
        'description', b.description,
        'background_color', b.background_color,
        'process_number', b.process_number,
        'responsible_person', b.responsible_person,
        'company', b.company,
        'object_description', b.object_description,
        'process_value', b.process_value,
        'board_type', json_build_object(
            'id', bt.id,
            'name', bt.name,
            'color', bt.color,
            'icon', bt.icon
        ),
        'created_at', b.created_at
    ) INTO result
    FROM trello_boards b
    LEFT JOIN trello_board_types bt ON b.board_type_id = bt.id
    WHERE b.id = new_board_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;