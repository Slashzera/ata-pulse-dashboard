-- Solução COMPLETA para o problema da função create_board_with_type
-- O Supabase está ignorando alguns parâmetros, então vamos criar duas versões

-- 1. Remover TODAS as versões existentes
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid, character varying, text, character varying, numeric, character varying);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, character varying, uuid, character varying, character varying, numeric, character varying);
DROP FUNCTION IF EXISTS create_board_with_type(character varying, text, character varying, uuid, character varying, text, character varying, numeric, character varying);

-- 2. Criar função com TODOS os parâmetros (versão completa)
CREATE OR REPLACE FUNCTION public.create_board_with_type(
    background_color character varying DEFAULT '#0079bf',
    board_description text DEFAULT '',
    board_title character varying DEFAULT '',
    board_type_uuid uuid DEFAULT NULL,
    company character varying DEFAULT '',
    object_description text DEFAULT '',
    process_number character varying DEFAULT '',
    process_value numeric DEFAULT 0,
    responsible_person character varying DEFAULT ''
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
        COALESCE(board_title, 'Processo sem título'),
        COALESCE(board_description, 'Descrição: ' || board_title),
        COALESCE(background_color, '#0079bf'),
        auth.uid(),
        board_type_uuid,
        process_number,
        responsible_person,
        company,
        COALESCE(object_description, 'Objeto: ' || board_title),
        COALESCE(process_value, 0)
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

-- 3. Criar também a versão EXATA que o erro está pedindo (como sobrecarga)
CREATE OR REPLACE FUNCTION public.create_board_with_type(
    background_color character varying,
    board_title character varying,
    board_type_uuid uuid,
    company character varying,
    process_number character varying,
    process_value numeric,
    responsible_person character varying
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Chamar a função completa com valores padrão para os parâmetros faltantes
    RETURN create_board_with_type(
        background_color,
        'Descrição: ' || board_title, -- board_description
        board_title,
        board_type_uuid,
        company,
        'Objeto: ' || board_title, -- object_description
        process_number,
        process_value,
        responsible_person
    );
END;
$$;

-- 4. Verificar ambas as funções criadas
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.pronargs as num_args
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public'
ORDER BY p.pronargs;

-- 5. Teste rápido (descomente para testar)
/*
SELECT create_board_with_type(
    '#0079bf',
    'Teste de Processo',
    (SELECT id FROM trello_board_types LIMIT 1),
    'Empresa Teste',
    'PROC-2024-001',
    1000.00,
    'João Silva'
);
*/