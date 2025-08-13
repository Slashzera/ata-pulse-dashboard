-- Correção da função update_card_title para edição de títulos de cards
-- Versão simplificada e mais robusta

-- 1. Remover função existente se houver problemas
DROP FUNCTION IF EXISTS public.update_card_title(UUID, VARCHAR);

-- 2. Criar função simplificada
CREATE OR REPLACE FUNCTION public.update_card_title(
    card_uuid UUID,
    new_title VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    card_exists BOOLEAN;
BEGIN
    -- Verificar se o cartão existe e não está deletado
    SELECT EXISTS(
        SELECT 1 FROM trello_cards 
        WHERE id = card_uuid 
        AND is_deleted = FALSE
    ) INTO card_exists;
    
    IF NOT card_exists THEN
        RAISE EXCEPTION 'Cartão não encontrado ou foi deletado';
    END IF;

    -- Atualizar o título do cartão
    UPDATE trello_cards 
    SET 
        title = new_title, 
        updated_at = NOW()
    WHERE id = card_uuid 
    AND is_deleted = FALSE;

    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Falha ao atualizar o título do cartão';
    END IF;

    -- Retornar o cartão atualizado
    SELECT json_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'list_id', c.list_id,
        'position', c.position,
        'due_date', c.due_date,
        'created_by', c.created_by,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'is_deleted', c.is_deleted
    ) INTO result
    FROM trello_cards c
    WHERE c.id = card_uuid;

    RETURN result;
END;
$$;

-- 3. Verificar se a função foi criada
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'update_card_title'
AND n.nspname = 'public';

-- 4. Teste da função (descomente para testar)
/*
-- Primeiro, encontrar um cartão para testar
SELECT id, title FROM trello_cards WHERE is_deleted = FALSE LIMIT 1;

-- Depois, testar a função (substitua o UUID pelo ID real)
SELECT update_card_title(
    'SEU_CARD_UUID_AQUI'::UUID,
    'Novo Título de Teste'
);
*/