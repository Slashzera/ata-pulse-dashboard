-- Correção do Problema de Criação Dupla de Quadros no KazuFlow
-- Este script corrige o problema onde quadros são criados em duplicata
-- e equaliza as permissões de todos os usuários com as do usuário FELIPE

-- 1. Primeiro, vamos verificar as permissões atuais do usuário FELIPE
DO $$
DECLARE
    felipe_user_id UUID;
    felipe_permissions TEXT[];
BEGIN
    -- Buscar o ID do usuário FELIPE
    SELECT id INTO felipe_user_id 
    FROM auth.users 
    WHERE email ILIKE '%felipe%' OR raw_user_meta_data->>'name' ILIKE '%felipe%'
    LIMIT 1;
    
    IF felipe_user_id IS NOT NULL THEN
        RAISE NOTICE 'Usuário FELIPE encontrado: %', felipe_user_id;
        
        -- Verificar permissões específicas do FELIPE
        SELECT array_agg(DISTINCT permission) INTO felipe_permissions
        FROM (
            -- Verificar se tem permissões especiais na tabela de usuários
            SELECT 'admin' as permission WHERE EXISTS (
                SELECT 1 FROM auth.users 
                WHERE id = felipe_user_id 
                AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'is_admin' = 'true')
            )
            UNION
            -- Verificar outras possíveis permissões
            SELECT 'create_board' as permission WHERE EXISTS (
                SELECT 1 FROM trello_boards WHERE created_by = felipe_user_id
            )
        ) perms;
        
        RAISE NOTICE 'Permissões do FELIPE: %', felipe_permissions;
    ELSE
        RAISE NOTICE 'Usuário FELIPE não encontrado';
    END IF;
END $$;

-- 2. Verificar se existe alguma política RLS que pode estar causando o problema
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('trello_boards', 'trello_lists', 'trello_cards')
ORDER BY tablename, policyname;

-- 3. Verificar se há triggers que podem estar causando duplicação
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table IN ('trello_boards', 'trello_lists', 'trello_cards')
ORDER BY event_object_table, trigger_name;

-- 4. Criar função para prevenir criação dupla de quadros
CREATE OR REPLACE FUNCTION prevent_duplicate_board_creation()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Verificar se já existe um quadro com o mesmo título criado pelo mesmo usuário nos últimos 5 segundos
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = NEW.title
    AND created_by = NEW.created_by
    AND created_at > (NOW() - INTERVAL '5 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro com título "%" já foi criado recentemente. Aguarde alguns segundos antes de tentar novamente.', NEW.title;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Aplicar trigger para prevenir duplicação
DROP TRIGGER IF EXISTS prevent_duplicate_board_trigger ON trello_boards;
CREATE TRIGGER prevent_duplicate_board_trigger
    BEFORE INSERT ON trello_boards
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_board_creation();

-- 6. Criar função melhorada para criar quadros (sem duplicação)
CREATE OR REPLACE FUNCTION create_board_safe(
    board_title TEXT,
    board_description TEXT DEFAULT NULL,
    background_color TEXT DEFAULT '#0079bf'
)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    new_board_id UUID;
    result JSON;
    existing_count INTEGER;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se já existe um quadro com o mesmo título criado recentemente
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = board_title
    AND created_by = current_user_id
    AND created_at > (NOW() - INTERVAL '10 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro com título "%" já foi criado recentemente. Aguarde alguns segundos.', board_title;
    END IF;
    
    -- Criar o quadro
    INSERT INTO trello_boards (title, description, background_color, created_by)
    VALUES (board_title, board_description, background_color, current_user_id)
    RETURNING id INTO new_board_id;
    
    -- Criar listas padrão para o quadro
    INSERT INTO trello_lists (board_id, title, position) VALUES
    (new_board_id, 'A Fazer', 0),
    (new_board_id, 'Em Progresso', 1),
    (new_board_id, 'Concluído', 2);
    
    -- Retornar resultado
    SELECT json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'background_color', background_color,
        'created_by', created_by,
        'created_at', created_at,
        'updated_at', updated_at,
        'member_role', 'owner'
    ) INTO result
    FROM trello_boards
    WHERE id = new_board_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Garantir que todos os usuários tenham as mesmas permissões básicas
-- Remover políticas restritivas que podem estar causando problemas
DROP POLICY IF EXISTS "Users can only see their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only create their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only update their own boards" ON trello_boards;
DROP POLICY IF EXISTS "Users can only delete their own boards" ON trello_boards;

-- Criar políticas mais permissivas e consistentes
CREATE POLICY "Users can manage their own boards" ON trello_boards
    FOR ALL USING (auth.uid() = created_by);

-- Aplicar as mesmas políticas para listas
DROP POLICY IF EXISTS "Users can manage lists in their boards" ON trello_lists;
CREATE POLICY "Users can manage lists in their boards" ON trello_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trello_boards 
            WHERE id = trello_lists.board_id 
            AND created_by = auth.uid()
            AND is_deleted = false
        )
    );

-- Aplicar as mesmas políticas para cartões
DROP POLICY IF EXISTS "Users can manage cards in their boards" ON trello_cards;
CREATE POLICY "Users can manage cards in their boards" ON trello_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trello_lists tl
            JOIN trello_boards tb ON tb.id = tl.board_id
            WHERE tl.id = trello_cards.list_id 
            AND tb.created_by = auth.uid()
            AND tb.is_deleted = false
            AND tl.is_deleted = false
        )
    );

-- 8. Função para limpar quadros duplicados existentes
CREATE OR REPLACE FUNCTION clean_duplicate_boards()
RETURNS TEXT AS $$
DECLARE
    duplicate_count INTEGER := 0;
    board_record RECORD;
BEGIN
    -- Encontrar e remover quadros duplicados (mantendo o mais antigo)
    FOR board_record IN
        SELECT title, created_by, MIN(created_at) as first_created
        FROM trello_boards
        WHERE is_deleted = false
        GROUP BY title, created_by
        HAVING COUNT(*) > 1
    LOOP
        -- Marcar como deletados todos os quadros duplicados exceto o primeiro
        UPDATE trello_boards
        SET is_deleted = true
        WHERE title = board_record.title
        AND created_by = board_record.created_by
        AND created_at > board_record.first_created
        AND is_deleted = false;
        
        GET DIAGNOSTICS duplicate_count = ROW_COUNT;
        
        RAISE NOTICE 'Removidos % quadros duplicados com título: %', duplicate_count, board_record.title;
    END LOOP;
    
    RETURN format('Limpeza concluída. Total de quadros duplicados removidos: %s', duplicate_count);
END;
$$ LANGUAGE plpgsql;

-- 9. Executar limpeza de duplicados
SELECT clean_duplicate_boards();

-- 10. Criar função para verificar permissões de usuário (CORRIGIDA)
CREATE OR REPLACE FUNCTION check_user_permissions(user_email TEXT DEFAULT NULL)
RETURNS TABLE(
    user_id UUID,
    email VARCHAR(255),  -- Corrigido: usar VARCHAR(255) em vez de TEXT
    role TEXT,
    can_create_boards BOOLEAN,
    boards_count INTEGER,
    last_board_created TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,  -- Agora compatível com VARCHAR(255)
        COALESCE(u.raw_user_meta_data->>'role', 'user') as role,
        true as can_create_boards, -- Todos podem criar quadros
        COALESCE(board_counts.count, 0)::INTEGER as boards_count,
        board_counts.last_created
    FROM auth.users u
    LEFT JOIN (
        SELECT 
            created_by,
            COUNT(*) as count,
            MAX(created_at) as last_created
        FROM trello_boards
        WHERE is_deleted = false
        GROUP BY created_by
    ) board_counts ON board_counts.created_by = u.id
    WHERE (user_email IS NULL OR u.email ILIKE '%' || user_email || '%')
    ORDER BY u.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Verificar permissões de todos os usuários
SELECT * FROM check_user_permissions();

-- 12. Garantir que a função RPC get_user_boards_simple funcione para todos
CREATE OR REPLACE FUNCTION get_user_boards_simple()
RETURNS TABLE(
    id UUID,
    title TEXT,
    description TEXT,
    background_color TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    member_role TEXT
) AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT 
        tb.id,
        tb.title,
        tb.description,
        tb.background_color,
        tb.created_by,
        tb.created_at,
        tb.updated_at,
        'owner'::TEXT as member_role
    FROM trello_boards tb
    WHERE tb.created_by = current_user_id
    AND tb.is_deleted = false
    ORDER BY tb.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Atualizar função create_board_with_type para evitar duplicação
CREATE OR REPLACE FUNCTION create_board_with_type(
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
    current_user_id UUID;
    new_board_id UUID;
    result JSON;
    existing_count INTEGER;
BEGIN
    -- Verificar autenticação
    current_user_id := auth.uid();
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar duplicação
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards
    WHERE title = board_title
    AND created_by = current_user_id
    AND created_at > (NOW() - INTERVAL '10 seconds')
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Quadro com título "%" já foi criado recentemente.', board_title;
    END IF;
    
    -- Criar o quadro
    INSERT INTO trello_boards (title, description, background_color, created_by)
    VALUES (board_title, board_description, background_color, current_user_id)
    RETURNING id INTO new_board_id;
    
    -- Se foi especificado um tipo de quadro, criar as listas específicas
    IF board_type_uuid IS NOT NULL THEN
        -- Criar listas baseadas no tipo de processo
        INSERT INTO trello_lists (board_id, title, position) VALUES
        (new_board_id, 'Documentação', 0),
        (new_board_id, 'Análise', 1),
        (new_board_id, 'Aprovação', 2),
        (new_board_id, 'Execução', 3),
        (new_board_id, 'Finalizado', 4);
        
        -- Criar cartão inicial com informações do processo
        INSERT INTO trello_cards (list_id, title, description, position, created_by)
        SELECT 
            tl.id,
            'Informações do Processo',
            format('Número: %s%sResponsável: %s%sEmpresa: %s%sObjeto: %s%sValor: %s',
                COALESCE(process_number, 'N/A'),
                CASE WHEN responsible_person IS NOT NULL THEN E'\nResponsável: ' || responsible_person ELSE '' END,
                CASE WHEN company IS NOT NULL THEN E'\nEmpresa: ' || company ELSE '' END,
                CASE WHEN object_description IS NOT NULL THEN E'\nObjeto: ' || object_description ELSE '' END,
                CASE WHEN process_value IS NOT NULL THEN E'\nValor: R$ ' || process_value::TEXT ELSE '' END
            ),
            0,
            current_user_id
        FROM trello_lists tl
        WHERE tl.board_id = new_board_id
        AND tl.title = 'Documentação'
        LIMIT 1;
    ELSE
        -- Criar listas padrão
        INSERT INTO trello_lists (board_id, title, position) VALUES
        (new_board_id, 'A Fazer', 0),
        (new_board_id, 'Em Progresso', 1),
        (new_board_id, 'Concluído', 2);
    END IF;
    
    -- Retornar resultado
    SELECT json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'background_color', background_color,
        'created_by', created_by,
        'created_at', created_at,
        'updated_at', updated_at,
        'member_role', 'owner'
    ) INTO result
    FROM trello_boards
    WHERE id = new_board_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Garantir que todas as funções tenham as permissões corretas
GRANT EXECUTE ON FUNCTION create_board_safe TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_boards_simple TO authenticated;
GRANT EXECUTE ON FUNCTION create_board_with_type TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION clean_duplicate_boards TO authenticated;

-- 15. Verificação final
SELECT 
    'Correção aplicada com sucesso!' as status,
    COUNT(*) as total_boards,
    COUNT(DISTINCT created_by) as total_users
FROM trello_boards 
WHERE is_deleted = false;

-- Mostrar estatísticas por usuário (usando CAST para compatibilidade)
SELECT 
    u.email::TEXT as email,  -- Converter para TEXT para exibição
    COUNT(tb.id) as boards_count,
    MAX(tb.created_at) as last_board_created
FROM auth.users u
LEFT JOIN trello_boards tb ON tb.created_by = u.id AND tb.is_deleted = false
GROUP BY u.id, u.email
ORDER BY boards_count DESC;

-- 16. Teste adicional: Verificar se não há mais duplicados
SELECT 
    'Verificação de Duplicados' as check_type,
    title,
    created_by,
    COUNT(*) as duplicate_count
FROM trello_boards
WHERE is_deleted = false
GROUP BY title, created_by
HAVING COUNT(*) > 1;

-- 17. Criar função simplificada para debug de permissões
CREATE OR REPLACE FUNCTION debug_user_permissions()
RETURNS TABLE(
    user_email TEXT,
    user_id UUID,
    boards_owned INTEGER,
    can_create BOOLEAN,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email::TEXT,
        u.id,
        COUNT(tb.id)::INTEGER,
        true as can_create,
        MAX(tb.created_at)
    FROM auth.users u
    LEFT JOIN trello_boards tb ON tb.created_by = u.id AND tb.is_deleted = false
    GROUP BY u.id, u.email
    ORDER BY COUNT(tb.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Executar debug
SELECT * FROM debug_user_permissions();

-- 19. Garantir permissões de execução
GRANT EXECUTE ON FUNCTION debug_user_permissions TO authenticated;