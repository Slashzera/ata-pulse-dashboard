-- Correção da função create_board_with_type
-- Ajustando a ordem dos parâmetros para corresponder ao que está sendo enviado pelo frontend

-- Remover função existente
DROP FUNCTION IF EXISTS create_board_with_type(VARCHAR, TEXT, VARCHAR, UUID, VARCHAR, VARCHAR, VARCHAR, TEXT, DECIMAL);

-- Recriar função com parâmetros na ordem correta
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

-- Verificar se a função foi criada corretamente
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';