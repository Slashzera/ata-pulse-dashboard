-- Script para prevenir e corrigir duplicação de quadros no KazuFlow

-- 1. Verificar quadros duplicados existentes
SELECT 
    title,
    created_by,
    DATE(created_at) as creation_date,
    COUNT(*) as duplicates
FROM trello_boards 
WHERE is_deleted = false
GROUP BY title, created_by, DATE(created_at)
HAVING COUNT(*) > 1
ORDER BY duplicates DESC, creation_date DESC;

-- 2. Remover quadros duplicados (manter apenas o mais recente)
WITH duplicates AS (
    SELECT 
        id,
        title,
        created_by,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY title, created_by, DATE(created_at) 
            ORDER BY created_at DESC
        ) as rn
    FROM trello_boards 
    WHERE is_deleted = false
)
UPDATE trello_boards 
SET is_deleted = true, 
    updated_at = NOW()
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- 3. Criar índice único para prevenir duplicações futuras
-- (Comentado para não causar erro se já existir)
-- CREATE UNIQUE INDEX CONCURRENTLY idx_trello_boards_unique_title_user_date 
-- ON trello_boards (title, created_by, DATE(created_at)) 
-- WHERE is_deleted = false;

-- 4. Função para verificar duplicatas antes de inserir
CREATE OR REPLACE FUNCTION prevent_board_duplication()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se já existe um quadro com o mesmo título, usuário e data
    IF EXISTS (
        SELECT 1 
        FROM trello_boards 
        WHERE title = NEW.title 
        AND created_by = NEW.created_by 
        AND DATE(created_at) = DATE(NEW.created_at)
        AND is_deleted = false
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Quadro com título "%" já existe para este usuário hoje', NEW.title;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para prevenir duplicações
DROP TRIGGER IF EXISTS trigger_prevent_board_duplication ON trello_boards;
CREATE TRIGGER trigger_prevent_board_duplication
    BEFORE INSERT OR UPDATE ON trello_boards
    FOR EACH ROW
    EXECUTE FUNCTION prevent_board_duplication();

-- 6. Função melhorada para criar quadro com verificação
CREATE OR REPLACE FUNCTION create_board_safe(
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
    existing_count INTEGER;
BEGIN
    -- Obter o ID do usuário atual
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não autenticado'
        );
    END IF;
    
    -- Verificar se já existe um quadro com o mesmo título hoje
    SELECT COUNT(*) INTO existing_count
    FROM trello_boards 
    WHERE title = board_title 
    AND created_by = user_id 
    AND DATE(created_at) = CURRENT_DATE
    AND is_deleted = false;
    
    IF existing_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Já existe um quadro com este título criado hoje'
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
    
    -- Criar as listas padrão se houver tipo de quadro
    IF board_type_uuid IS NOT NULL THEN
        -- Usar a função de listas atualizadas
        PERFORM create_default_process_lists_updated(new_board_id);
    END IF;
    
    -- Retornar sucesso
    result := json_build_object(
        'success', true,
        'message', 'Quadro criado com sucesso',
        'board_id', new_board_id,
        'board_title', board_title
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

-- 7. Conceder permissões
GRANT EXECUTE ON FUNCTION create_board_safe(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_board_duplication() TO authenticated;

-- 8. Comentários explicativos
COMMENT ON FUNCTION create_board_safe IS 'Função segura para criar quadros que previne duplicações baseadas em título, usuário e data';
COMMENT ON FUNCTION prevent_board_duplication IS 'Trigger function que previne a criação de quadros duplicados';

-- 9. Verificar resultado final
SELECT 
    'Quadros únicos por usuário' as status,
    COUNT(*) as total_boards,
    COUNT(DISTINCT CONCAT(title, '|', created_by::text, '|', DATE(created_at)::text)) as unique_combinations
FROM trello_boards 
WHERE is_deleted = false;psql -d sua_database -f fix-board-duplication-corrected.sql
