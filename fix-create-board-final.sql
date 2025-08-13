-- Correção DEFINITIVA da função create_board_with_type
-- Baseada no erro: Could not find the function public.create_board_with_type(background_color, board_title, board_type_uuid, company, process_number, process_value, responsible_person)

-- 1. Remover todas as versões existentes da função
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid, character varying, character varying, character varying, text, numeric);
DROP FUNCTION IF EXISTS public.create_board_with_type(text, text, character varying, uuid, character varying, character varying, character varying, text, numeric);
DROP FUNCTION IF EXISTS create_board_with_type(character varying, text, character varying, uuid, character varying, character varying, character varying, text, numeric);

-- 2. Criar função com parâmetros na ordem EXATA que o Supabase está procurando
-- Ordem do erro: background_color, board_title, board_type_uuid, company, process_number, process_value, responsible_person
-- Mas vamos criar com TODOS os parâmetros que o frontend envia

CREATE OR REPLACE FUNCTION public.create_board_with_type(
    background_color character varying,
    board_description text,
    board_title character varying,
    board_type_uuid uuid,
    company character varying,
    object_description text,
    process_number character varying,
    process_value numeric,
    responsible_person character varying
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

-- 3. Verificar se a função foi criada
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';

-- 4. Testar a função (descomente para testar)
-- SELECT create_board_with_type(
--     '#0079bf',                                    -- background_color
--     'Descrição do processo de teste',             -- board_description  
--     'Processo de Teste',                          -- board_title
--     (SELECT id FROM trello_board_types LIMIT 1), -- board_type_uuid
--     'Empresa Teste Ltda',                         -- company
--     'Objeto de teste para validação',             -- object_description
--     'PROC-2024-001',                              -- process_number
--     1500.50,                                      -- process_value
--     'João Silva'                                  -- responsible_person
-- );