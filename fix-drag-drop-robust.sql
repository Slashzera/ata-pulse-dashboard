-- Versão robusta da função move_card_to_list para prevenir travamentos
-- Inclui validações, tratamento de erros e recuperação automática

-- 1. Função auxiliar para normalizar posições de uma lista
CREATE OR REPLACE FUNCTION normalize_list_positions(target_list_uuid UUID)
RETURNS VOID AS $$
DECLARE
    card_record RECORD;
    new_pos INTEGER := 0;
BEGIN
    -- Reordenar todas as posições da lista sequencialmente
    FOR card_record IN 
        SELECT id FROM trello_cards 
        WHERE list_id = target_list_uuid 
        AND is_deleted = FALSE 
        ORDER BY position, created_at
    LOOP
        UPDATE trello_cards 
        SET position = new_pos, updated_at = NOW()
        WHERE id = card_record.id;
        new_pos := new_pos + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função principal move_card_to_list com tratamento robusto
CREATE OR REPLACE FUNCTION move_card_to_list(
    card_uuid UUID,
    target_list_uuid UUID,
    new_position INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    old_list_id UUID;
    old_position INTEGER;
    calculated_position INTEGER;
    max_position INTEGER;
    card_exists BOOLEAN := FALSE;
    list_exists BOOLEAN := FALSE;
BEGIN
    -- Validação 1: Verificar se o cartão existe e não está deletado
    SELECT list_id, position INTO old_list_id, old_position
    FROM trello_cards 
    WHERE id = card_uuid AND is_deleted = FALSE;
    
    IF old_list_id IS NULL THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'CARD_NOT_FOUND',
            'message', 'Cartão não encontrado ou foi deletado'
        );
    END IF;

    -- Validação 2: Verificar se a lista de destino existe
    SELECT EXISTS(
        SELECT 1 FROM trello_lists 
        WHERE id = target_list_uuid AND is_deleted = FALSE
    ) INTO list_exists;
    
    IF NOT list_exists THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'LIST_NOT_FOUND',
            'message', 'Lista de destino não encontrada'
        );
    END IF;

    -- Validação 3: Verificar se não é uma operação desnecessária
    IF old_list_id = target_list_uuid AND (new_position IS NULL OR new_position = old_position) THEN
        RETURN json_build_object(
            'success', true, 
            'message', 'Nenhuma alteração necessária',
            'card_id', card_uuid
        );
    END IF;

    -- Calcular posição de destino
    SELECT COALESCE(MAX(position), -1) INTO max_position
    FROM trello_cards 
    WHERE list_id = target_list_uuid AND is_deleted = FALSE;

    IF new_position IS NULL THEN
        calculated_position := max_position + 1;
    ELSE
        calculated_position := GREATEST(0, LEAST(new_position, max_position + 1));
    END IF;

    -- Iniciar transação para operações atômicas
    BEGIN
        -- Se mudando de lista
        IF old_list_id != target_list_uuid THEN
            -- Ajustar posições na lista de origem (fechar lacuna)
            UPDATE trello_cards 
            SET position = position - 1, updated_at = NOW()
            WHERE list_id = old_list_id 
            AND position > old_position 
            AND is_deleted = FALSE;
            
            -- Ajustar posições na lista de destino (abrir espaço)
            UPDATE trello_cards 
            SET position = position + 1, updated_at = NOW()
            WHERE list_id = target_list_uuid 
            AND position >= calculated_position 
            AND is_deleted = FALSE;
            
        ELSE
            -- Reordenando na mesma lista
            IF old_position < calculated_position THEN
                -- Movendo para baixo
                UPDATE trello_cards 
                SET position = position - 1, updated_at = NOW()
                WHERE list_id = target_list_uuid 
                AND position > old_position 
                AND position <= calculated_position
                AND id != card_uuid
                AND is_deleted = FALSE;
            ELSIF old_position > calculated_position THEN
                -- Movendo para cima
                UPDATE trello_cards 
                SET position = position + 1, updated_at = NOW()
                WHERE list_id = target_list_uuid 
                AND position >= calculated_position 
                AND position < old_position
                AND id != card_uuid
                AND is_deleted = FALSE;
            END IF;
        END IF;

        -- Mover o cartão
        UPDATE trello_cards 
        SET list_id = target_list_uuid, 
            position = calculated_position, 
            updated_at = NOW()
        WHERE id = card_uuid AND is_deleted = FALSE;

        -- Verificar se a atualização foi bem-sucedida
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Falha ao atualizar o cartão';
        END IF;

        -- Registrar atividade se mudou de lista
        IF old_list_id != target_list_uuid THEN
            INSERT INTO trello_activities (card_id, user_id, action_type, action_data)
            VALUES (card_uuid, auth.uid(), 'card_moved', 
                    json_build_object(
                        'from_list', old_list_id, 
                        'to_list', target_list_uuid, 
                        'old_position', old_position,
                        'new_position', calculated_position
                    ));
        END IF;

        -- Normalizar posições para prevenir problemas futuros
        PERFORM normalize_list_positions(old_list_id);
        IF old_list_id != target_list_uuid THEN
            PERFORM normalize_list_positions(target_list_uuid);
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro, retornar informações detalhadas
        RETURN json_build_object(
            'success', false,
            'error', 'TRANSACTION_FAILED',
            'message', 'Erro durante a movimentação: ' || SQLERRM,
            'card_id', card_uuid,
            'old_list', old_list_id,
            'target_list', target_list_uuid
        );
    END;

    -- Retornar sucesso com dados do cartão
    SELECT json_build_object(
        'success', true,
        'message', 'Cartão movido com sucesso',
        'card', json_build_object(
            'id', c.id,
            'title', c.title,
            'description', c.description,
            'position', c.position,
            'list_id', c.list_id,
            'created_by', c.created_by,
            'created_at', c.created_at,
            'updated_at', c.updated_at
        ),
        'old_list', old_list_id,
        'new_list', target_list_uuid,
        'old_position', old_position,
        'new_position', calculated_position
    ) INTO result 
    FROM trello_cards c 
    WHERE c.id = card_uuid AND c.is_deleted = FALSE;
    
    RETURN COALESCE(result, json_build_object(
        'success', false, 
        'error', 'CARD_NOT_FOUND_AFTER_UPDATE',
        'message', 'Cartão não encontrado após atualização'
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para recuperar de estados inconsistentes
CREATE OR REPLACE FUNCTION fix_card_positions()
RETURNS JSON AS $$
DECLARE
    list_record RECORD;
    fixed_lists INTEGER := 0;
BEGIN
    -- Normalizar posições de todas as listas
    FOR list_record IN 
        SELECT DISTINCT l.id, l.title 
        FROM trello_lists l
        WHERE l.is_deleted = FALSE
    LOOP
        PERFORM normalize_list_positions(list_record.id);
        fixed_lists := fixed_lists + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Posições normalizadas com sucesso',
        'lists_fixed', fixed_lists
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificar se as funções foram criadas
SELECT 
    p.proname as function_name,
    '✅ Função criada com sucesso!' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('move_card_to_list', 'normalize_list_positions', 'fix_card_positions')
AND n.nspname = 'public'
ORDER BY p.proname;

-- 5. Executar normalização preventiva
SELECT fix_card_positions() as normalization_result;

-- 6. Comentários explicativos
COMMENT ON FUNCTION move_card_to_list IS 'Versão robusta para mover cartões com validações e recuperação de erros';
COMMENT ON FUNCTION normalize_list_positions IS 'Normaliza posições sequenciais de uma lista';
COMMENT ON FUNCTION fix_card_positions IS 'Corrige posições inconsistentes em todas as listas';

-- 7. Mensagem final
SELECT '🛡️ DRAG AND DROP ROBUSTO IMPLEMENTADO! Agora com proteção contra travamentos!' as resultado