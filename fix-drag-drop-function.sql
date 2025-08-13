-- Correção da função move_card_to_list para melhorar o drag and drop
-- Esta função corrige os problemas de posicionamento e comportamento instável

-- 1. Remover função existente
DROP FUNCTION IF EXISTS move_card_to_list(UUID, UUID, INTEGER);

-- 2. Criar função corrigida
CREATE OR REPLACE FUNCTION move_card_to_list(
    card_uuid UUID,
    target_list_uuid UUID,
    new_position INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_list_id UUID;
    calculated_position INTEGER;
    current_position INTEGER;
BEGIN
    -- Buscar a lista atual do cartão
    SELECT list_id, position INTO old_list_id, current_position 
    FROM trello_cards 
    WHERE id = card_uuid AND is_deleted = FALSE;
    
    IF old_list_id IS NULL THEN
        RAISE EXCEPTION 'Cartão não encontrado ou já foi deletado';
    END IF;

    -- Calcular a nova posição
    IF new_position IS NULL THEN
        -- Se não especificou posição, colocar no final da lista de destino
        SELECT COALESCE(MAX(position), -1) + 1 INTO calculated_position
        FROM trello_cards 
        WHERE list_id = target_list_uuid AND is_deleted = FALSE;
    ELSE
        -- Usar a posição especificada, mas garantir que não seja negativa
        calculated_position := GREATEST(new_position, 0);
    END IF;

    -- Ajustar posições dos outros cartões
    IF old_list_id != target_list_uuid THEN
        -- Movendo entre listas diferentes
        
        -- Ajustar posições na lista de origem (fechar lacuna)
        UPDATE trello_cards 
        SET position = position - 1, updated_at = NOW()
        WHERE list_id = old_list_id 
        AND position > current_position 
        AND is_deleted = FALSE;
        
        -- Ajustar posições na lista de destino (abrir espaço)
        UPDATE trello_cards 
        SET position = position + 1, updated_at = NOW()
        WHERE list_id = target_list_uuid 
        AND position >= calculated_position 
        AND is_deleted = FALSE;
        
    ELSE
        -- Reordenando na mesma lista
        IF current_position < calculated_position THEN
            -- Movendo para baixo - decrementar posições entre current e new
            UPDATE trello_cards 
            SET position = position - 1, updated_at = NOW()
            WHERE list_id = target_list_uuid 
            AND position > current_position 
            AND position <= calculated_position
            AND id != card_uuid
            AND is_deleted = FALSE;
        ELSIF current_position > calculated_position THEN
            -- Movendo para cima - incrementar posições entre new e current
            UPDATE trello_cards 
            SET position = position + 1, updated_at = NOW()
            WHERE list_id = target_list_uuid 
            AND position >= calculated_position 
            AND position < current_position
            AND id != card_uuid
            AND is_deleted = FALSE;
        END IF;
    END IF;

    -- Atualizar o cartão com a nova lista e posição
    UPDATE trello_cards 
    SET list_id = target_list_uuid, 
        position = calculated_position, 
        updated_at = NOW()
    WHERE id = card_uuid AND is_deleted = FALSE;

    -- Registrar atividade apenas se mudou de lista
    IF old_list_id != target_list_uuid THEN
        INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
        VALUES (card_uuid, auth.uid(), 'card_moved', 
                json_build_object(
                    'from_list', old_list_id, 
                    'to_list', target_list_uuid, 
                    'old_position', current_position,
                    'new_position', calculated_position
                ));
    END IF;

    -- Retornar o cartão atualizado
    SELECT json_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'position', c.position,
        'list_id', c.list_id,
        'created_by', c.created_by,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'success', true,
        'message', 'Cartão movido com sucesso'
    ) INTO result 
    FROM trello_cards c 
    WHERE c.id = card_uuid AND c.is_deleted = FALSE;
    
    IF result IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Erro ao buscar cartão atualizado');
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar se a função foi criada
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    '✅ Função move_card_to_list corrigida!' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'move_card_to_list'
AND n.nspname = 'public';

-- 4. Comentário explicativo
COMMENT ON FUNCTION move_card_to_list IS 'Função corrigida para mover cartões entre listas com cálculo adequado de posições e prevenção de conflitos';

-- 5. Mensagem final
SELECT '🎉 DRAG AND DROP CORRIGIDO! Agora os cartões devem mover suavemente sem piscar!' as resultado;