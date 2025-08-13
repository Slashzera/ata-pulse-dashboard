-- Solução DEFINITIVA: Remove funções pelo OID (identificador único)
-- Este método funciona mesmo quando há conflitos de nomes

-- PASSO 1: Execute este comando para gerar os comandos de remoção exatos
DO $$
DECLARE
    func_record RECORD;
    drop_cmd TEXT;
BEGIN
    -- Para cada função create_board_with_type encontrada
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'create_board_with_type'
        AND n.nspname = 'public'
    LOOP
        -- Gerar comando DROP com argumentos completos
        drop_cmd := 'DROP FUNCTION IF EXISTS public.' || func_record.proname || '(' || func_record.args || ');';
        
        -- Executar o comando DROP
        BEGIN
            EXECUTE drop_cmd;
            RAISE NOTICE 'Removida: %', drop_cmd;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao remover: % - %', drop_cmd, SQLERRM;
        END;
    END LOOP;
    
    -- Verificar quantas restaram
    SELECT COUNT(*) INTO func_record.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'create_board_with_type'
    AND n.nspname = 'public';
    
    IF func_record.oid = 0 THEN
        RAISE NOTICE '✅ SUCESSO: Todas as funções foram removidas!';
    ELSE
        RAISE NOTICE '❌ ATENÇÃO: Ainda restam % funções', func_record.oid;
    END IF;
END;
$$;

-- PASSO 2: Verificar se todas foram removidas
SELECT 
    COUNT(*) as remaining_functions,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Pronto para criar as novas funções!'
        ELSE '❌ Ainda existem ' || COUNT(*) || ' versões'
    END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_board_with_type'
AND n.nspname = 'public';

-- PASSO 3: Criar a função principal com as listas padrão
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

-- PASSO 4: Criar a versão de sobrecarga para compatibilidade
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

-- PASSO 5: Verificar resultado final
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

-- Mensagem final
SELECT '🎉 IMPLEMENTAÇÃO CONCLUÍDA! Agora você pode criar processos e as 8 listas serão criadas automaticamente!' as resultado;