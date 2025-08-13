-- Script para forçar atualização do cache da função create_board_with_type
-- Isso resolve problemas de cache do Supabase quando a função existe mas não é reconhecida

-- 1. Verificar se a função existe
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';

-- 2. Forçar refresh do cache removendo e recriando a função
DROP FUNCTION IF EXISTS public.create_board_with_type(
    character varying, 
    text, 
    character varying, 
    uuid, 
    character varying, 
    character varying, 
    character varying, 
    text, 
    numeric
);

-- 3. Recriar a função exatamente como estava
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
$$;

-- 4. Verificar se a função foi recriada corretamente
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';

-- 5. Testar a função com dados de exemplo (opcional)
-- SELECT create_board_with_type(
--     'Teste de Processo',
--     'Descrição do teste',
--     '#0079bf',
--     (SELECT id FROM trello_board_types LIMIT 1),
--     'PROC-2024-001',
--     'João Silva',
--     'Empresa Teste',
--     'Objeto do teste',
--     1000.00
-- );