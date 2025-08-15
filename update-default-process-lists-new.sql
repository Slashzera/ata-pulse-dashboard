-- Atualização das listas padrão do processo conforme solicitação
-- Substituindo "Em Análise pelo Processante" pelas novas listas

-- Função para criar listas padrão de processo na ordem atualizada
CREATE OR REPLACE FUNCTION create_default_process_lists_updated(board_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Criar as listas na nova ordem especificada
    
    -- 1. Formalizando Pedido
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Formalizando Pedido', 0, NOW(), NOW());
    
    -- 2. Fundo Municipal de Saúde - Autorizo de Empenho
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Fundo Municipal de Saúde - Autorizo de Empenho', 1, NOW(), NOW());
    
    -- 3. Subsecretaria de Execução Orçamentária - Empenho
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Subsecretaria de Execução Orçamentária - Empenho', 2, NOW(), NOW());
    
    -- 4. Elaboração de AFO
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Elaboração de AFO', 3, NOW(), NOW());
    
    -- 5. Processo no Armário com Saldo Disponível - Aguardando Pedido do Departamento
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Processo no Armário com Saldo Disponível - Aguardando Pedido do Departamento', 4, NOW(), NOW());
    
    -- 6. Arquivo do Fundo Municipal de Saúde
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Arquivo do Fundo Municipal de Saúde', 5, NOW(), NOW());
    
    -- Retornar sucesso
    result := json_build_object(
        'success', true,
        'message', 'Listas padrão atualizadas criadas com sucesso',
        'board_id', board_uuid,
        'lists_created', 6
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar informações do erro
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'board_id', board_uuid
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar quadro com as novas listas padrão
CREATE OR REPLACE FUNCTION create_board_with_updated_lists(
    board_title TEXT,
    board_description TEXT DEFAULT NULL,
    background_color TEXT DEFAULT '#0079bf',
    board_type_uuid UUID DEFAULT NULL,
    process_number TEXT DEFAULT NULL,
    responsible_person TEXT DEFAULT NULL,
    company TEXT DEFAULT NULL,
    object_description TEXT DEFAULT NULL,
    process_value DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_board_id UUID;
    user_id UUID;
    result JSON;
    lists_result JSON;
BEGIN
    -- Obter o ID do usuário atual
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Criar o quadro
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
        process_value,
        created_at,
        updated_at
    )
    VALUES (
        board_title,
        board_description,
        background_color,
        user_id,
        board_type_uuid,
        process_number,
        responsible_person,
        company,
        object_description,
        process_value,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_board_id;
    
    -- Criar as listas padrão atualizadas
    SELECT create_default_process_lists_updated(new_board_id) INTO lists_result;
    
    -- Verificar se as listas foram criadas com sucesso
    IF (lists_result->>'success')::boolean = false THEN
        -- Se houve erro na criação das listas, deletar o quadro
        DELETE FROM trello_boards WHERE id = new_board_id;
        RETURN lists_result;
    END IF;
    
    -- Retornar sucesso com informações do quadro criado
    result := json_build_object(
        'success', true,
        'message', 'Quadro criado com sucesso com as novas listas padrão',
        'board_id', new_board_id,
        'board_title', board_title,
        'lists_created', 6
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, tentar limpar o quadro se foi criado
        IF new_board_id IS NOT NULL THEN
            DELETE FROM trello_boards WHERE id = new_board_id;
        END IF;
        
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar a função principal para usar as novas listas
CREATE OR REPLACE FUNCTION create_board_with_ordered_lists(
    board_title TEXT,
    board_description TEXT DEFAULT NULL,
    background_color TEXT DEFAULT '#0079bf',
    board_type_uuid UUID DEFAULT NULL,
    process_number TEXT DEFAULT NULL,
    responsible_person TEXT DEFAULT NULL,
    company TEXT DEFAULT NULL,
    object_description TEXT DEFAULT NULL,
    process_value DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_board_id UUID;
    user_id UUID;
    result JSON;
    lists_result JSON;
BEGIN
    -- Obter o ID do usuário atual
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Criar o quadro
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
        process_value,
        created_at,
        updated_at
    )
    VALUES (
        board_title,
        board_description,
        background_color,
        user_id,
        board_type_uuid,
        process_number,
        responsible_person,
        company,
        object_description,
        process_value,
        NOW(),
        NOW()
    )
    RETURNING id INTO new_board_id;
    
    -- Usar as novas listas padrão atualizadas
    SELECT create_default_process_lists_updated(new_board_id) INTO lists_result;
    
    -- Verificar se as listas foram criadas com sucesso
    IF (lists_result->>'success')::boolean = false THEN
        -- Se houve erro na criação das listas, deletar o quadro
        DELETE FROM trello_boards WHERE id = new_board_id;
        RETURN lists_result;
    END IF;
    
    -- Retornar sucesso com informações do quadro criado
    result := json_build_object(
        'success', true,
        'message', 'Quadro criado com sucesso com as novas listas padrão',
        'board_id', new_board_id,
        'board_title', board_title,
        'lists_created', 6
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, tentar limpar o quadro se foi criado
        IF new_board_id IS NOT NULL THEN
            DELETE FROM trello_boards WHERE id = new_board_id;
        END IF;
        
        result := json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION create_default_process_lists_updated(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_board_with_updated_lists(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION create_board_with_ordered_lists(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION create_default_process_lists_updated IS 'Função que cria listas padrão atualizadas para o processo: Formalizando Pedido, Fundo Municipal de Saúde - Autorizo de Empenho, Subsecretaria de Execução Orçamentária - Empenho, Elaboração de AFO, Processo no Armário com Saldo Disponível - Aguardando Pedido do Departamento, Arquivo do Fundo Municipal de Saúde';

COMMENT ON FUNCTION create_board_with_updated_lists IS 'Função que cria um quadro KazuFlow com as novas listas padrão específicas do processo administrativo atualizado';