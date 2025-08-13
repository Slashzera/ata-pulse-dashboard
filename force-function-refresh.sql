-- Script simples para forçar o Supabase a reconhecer a função create_board_with_type
-- A função já existe, só precisa ser "tocada" para atualizar o cache

-- 1. Alterar a função para forçar refresh (sem mudar nada)
CREATE OR REPLACE FUNCTION public.create_board_with_type(
    board_title character varying,
    board_description text,
    background_color character varying,
    board_type_uuid uuid,
    process_number character varying DEFAULT NULL::character varying,
    responsible_person character varying DEFAULT NULL::character varying,
    company character varying DEFAULT NULL::character varying,
    object_description text DEFAULT NULL::text,
    process_value numeric DEFAULT NULL::numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

    -- Criar listas padrão
    INSERT INTO trello_lists (board_id, title, position) VALUES
    (new_board_id, 'A fazer', 0),
    (new_board_id, 'Em andamento', 1),
    (new_board_id, 'Em análise', 2),
    (new_board_id, 'Concluído', 3);

    -- Retornar resultado
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
$$;

-- 2. Verificar se funcionou
SELECT 'Função atualizada com sucesso!' as status;