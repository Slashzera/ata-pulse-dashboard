-- Função para criar listas padrão de processo na ordem correta
-- Esta função cria as listas na ordem especificada pelo usuário

CREATE OR REPLACE FUNCTION create_default_process_lists_ordered(board_uuid UUID)
RETURNS JSON AS $$
DECLARE
    list_data JSON;
    result JSON;
BEGIN
    -- Criar as listas na ordem especificada
    -- 1. Pendente de Cadastro
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Pendente de Cadastro', 0, NOW(), NOW());
    
    -- 2. Elaboração de Pedido
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Elaboração de Pedido', 1, NOW(), NOW());
    
    -- 3. Fundo Municipal de Saúde - Autorizo de Empenho
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Fundo Municipal de Saúde - Autorizo de Empenho', 2, NOW(), NOW());
    
    -- 4. Subsecretaria de Execução Orçamentária - Empenho
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Subsecretaria de Execução Orçamentária - Empenho', 3, NOW(), NOW());
    
    -- 5. Procuradoria-Geral do Município - Elaborando Contrato
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Procuradoria-Geral do Município - Elaborando Contrato', 4, NOW(), NOW());
    
    -- 6. Processo no Armário da Subsecretaria de Gestão com Saldo Disponível - Aguardando Pedido dos Departamento
    INSERT INTO trello_lists (board_id, title, position, created_at, updated_at)
    VALUES (board_uuid, 'Processo no Armário da Subsecretaria de Gestão com Saldo Disponível - Aguardando Pedido dos Departamento', 5, NOW(), NOW());
    
    -- Retornar sucesso
    result := json_build_object(
        'success', true,
        'message', 'Listas padrão criadas com sucesso na ordem correta',
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

-- Função para criar quadro com listas padrão ordenadas
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
    
    -- Criar as listas padrão na ordem correta
    SELECT create_default_process_lists_ordered(new_board_id) INTO lists_result;
    
    -- Verificar se as listas foram criadas com sucesso
    IF (lists_result->>'success')::boolean = false THEN
        -- Se houve erro na criação das listas, deletar o quadro
        DELETE FROM trello_boards WHERE id = new_board_id;
        RETURN lists_result;
    END IF;
    
    -- Retornar sucesso com informações do quadro criado
    result := json_build_object(
        'success', true,
        'message', 'Quadro criado com sucesso com listas padrão ordenadas',
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
GRANT EXECUTE ON FUNCTION create_default_process_lists_ordered(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_board_with_ordered_lists(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL) TO authenticated;