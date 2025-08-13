-- Correção da função de arquivar quadros no Trellinho
-- Verificação e correção das tabelas e função de exclusão

-- 1. Verificar se as tabelas existem e têm a coluna is_deleted
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('trello_boards', 'trello_lists', 'trello_cards')
AND column_name = 'is_deleted'
ORDER BY table_name;

-- 2. Adicionar coluna is_deleted se não existir
ALTER TABLE trello_boards 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE trello_lists 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

ALTER TABLE trello_cards 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_trello_boards_is_deleted ON trello_boards(is_deleted);
CREATE INDEX IF NOT EXISTS idx_trello_lists_is_deleted ON trello_lists(is_deleted);
CREATE INDEX IF NOT EXISTS idx_trello_lists_board_id ON trello_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_trello_cards_is_deleted ON trello_cards(is_deleted);
CREATE INDEX IF NOT EXISTS idx_trello_cards_list_id ON trello_cards(list_id);

-- 4. Criar função SQL para arquivar quadro (alternativa mais robusta)
CREATE OR REPLACE FUNCTION public.archive_board_cascade(board_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    lists_count INTEGER;
    cards_count INTEGER;
BEGIN
    -- Verificar se o quadro existe
    IF NOT EXISTS (SELECT 1 FROM trello_boards WHERE id = board_uuid AND is_deleted = FALSE) THEN
        RAISE EXCEPTION 'Quadro não encontrado ou já foi excluído';
    END IF;

    -- Contar listas e cards que serão arquivados
    SELECT COUNT(*) INTO lists_count 
    FROM trello_lists 
    WHERE board_id = board_uuid AND is_deleted = FALSE;

    SELECT COUNT(*) INTO cards_count 
    FROM trello_cards c
    JOIN trello_lists l ON c.list_id = l.id
    WHERE l.board_id = board_uuid AND c.is_deleted = FALSE AND l.is_deleted = FALSE;

    -- Arquivar todos os cards das listas do quadro
    UPDATE trello_cards 
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE list_id IN (
        SELECT id FROM trello_lists 
        WHERE board_id = board_uuid
    );

    -- Arquivar todas as listas do quadro
    UPDATE trello_lists 
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE board_id = board_uuid;

    -- Arquivar o quadro
    UPDATE trello_boards 
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE id = board_uuid;

    -- Retornar resultado
    SELECT json_build_object(
        'success', true,
        'board_id', board_uuid,
        'lists_archived', lists_count,
        'cards_archived', cards_count,
        'message', 'Quadro arquivado com sucesso'
    ) INTO result;

    RETURN result;
END;
$$;

-- 5. Verificar se a função foi criada
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'archive_board_cascade'
AND n.nspname = 'public';

-- 6. Teste da função (descomente para testar)
/*
-- Primeiro, encontrar um quadro para testar
SELECT id, title, is_deleted FROM trello_boards WHERE is_deleted = FALSE LIMIT 1;

-- Depois, testar a função (substitua o UUID pelo ID real)
SELECT archive_board_cascade('SEU_BOARD_UUID_AQUI'::UUID);
*/