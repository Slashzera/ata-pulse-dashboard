-- Correção do conflito de funções create_board_with_type
-- Remove TODAS as versões existentes da função antes de recriar

-- 1. Listar todas as versões existentes da função
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.pronargs as num_args,
    'DROP FUNCTION IF EXISTS public.' || p.proname || '(' || pg_get_function_arguments(p.oid) || ');' as drop_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public'
ORDER BY p.pronargs;

-- 2. Remover TODAS as versões possíveis da função (uma por uma)
DROP FUNCTION IF EXISTS public.create_board_with_type();
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid, character varying);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid, character varying, text);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid, character varying, text, character varying);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid, character varying, text, character varying, numeric);
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, text, character varying, uuid, character varying, text, character varying, numeric, character varying);

-- Versões alternativas que podem existir
DROP FUNCTION IF EXISTS public.create_board_with_type(character varying, character varying, uuid, character varying, character varying, numeric, character varying);
DROP FUNCTION IF EXISTS public.create_board_with_type(text, text, character varying, uuid, character varying, character varying, character varying, text, numeric);

-- 3. Verificar se todas foram removidas
SELECT 
    COUNT(*) as remaining_functions,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todas as funções foram removidas com sucesso!'
        ELSE '❌ Ainda existem ' || COUNT(*) || ' versões da função'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';

-- 4. Agora recriar a função principal com as listas padrão
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

    -- Criar listas padrão específicas do processo administrativo
    INSERT INTO trello_lists (board_id, title, position) VALUES
    (new_board_id, 'Pendente de Cadastro', 0),
    (new_board_id, 'Em Análise pelo Processante', 1),
    (new_board_id, 'Confeccionando Autorização de Fornecimento', 2),
    (new_board_id, 'Fundo Municipal de Saúde - Aguardando Autorizo de Empenho', 3),
    (new_board_id, 'Empenho - Subsecretaria de Execução Orçamentária', 4),
    (new_board_id, 'Procuradoria-Geral do Município - Fazer Contrato', 5),
    (new_board_id, 'Processo Finalizado - Arquivado no Fundo Municipal de Saúde', 6),
    (new_board_id, 'Processo no Armário com Saldo Disponível - Aguardando Pedido Departamento', 7);

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

-- 5. Criar a versão de sobrecarga para compatibilidade
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

-- 6. Verificar se as funções foram criadas corretamente
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.pronargs as num_args,
    '✅ Função criada com sucesso!' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public'
ORDER BY p.pronargs;

-- 7. Comentário explicativo
COMMENT ON FUNCTION public.create_board_with_type IS 'Função que cria um quadro Trellinho com listas padrão específicas do processo administrativo: Pendente de Cadastro, Em Análise pelo Processante, Confeccionando Autorização de Fornecimento, Fundo Municipal de Saúde - Aguardando Autorizo de Empenho, Empenho - Subsecretaria de Execução Orçamentária, Procuradoria-Geral do Município - Fazer Contrato, Processo Finalizado - Arquivado no Fundo Municipal de Saúde, Processo no Armário com Saldo Disponível - Aguardando Pedido Departamento';