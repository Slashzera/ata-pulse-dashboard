-- PASSO 1: Primeiro execute este comando para ver todas as versões da função
-- Copie e execute APENAS esta parte primeiro:

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

-- IMPORTANTE: Execute APENAS o comando acima primeiro!
-- Ele vai mostrar os comandos DROP exatos que você precisa executar.
-- Copie os comandos DROP que aparecerem no resultado e execute um por um.

-- Depois que remover todas as funções, execute o resto do arquivo abaixo:

-- ============================================================================
-- PASSO 2: Depois de remover todas as funções, execute o código abaixo:
-- ============================================================================
-- Verif
icar se todas as funções foram removidas
SELECT 
    COUNT(*) as remaining_functions,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todas as funções foram removidas! Pode continuar.'
        ELSE '❌ Ainda existem ' || COUNT(*) || ' versões. Remova-as primeiro.'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';

-- Criar a função principal com as listas padrão
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

-- Criar a versão de sobrecarga para compatibilidade
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
    -- Chamar a função completa
    RETURN create_board_with_type(
        background_color,
        'Descrição: ' || board_title,
        board_title,
        board_type_uuid,
        company,
        'Objeto: ' || board_title,
        process_number,
        process_value,
        responsible_person
    );
END;
$$;

-- Verificar se as funções foram criadas
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    p.pronargs as num_args,
    '✅ Função criada!' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public'
ORDER BY p.pronargs;