-- Teste do Sistema de Notificações KazuFlow
-- Execute este arquivo após instalar o sistema para testar

-- 1. Verificar se a tabela foi criada
SELECT 'Verificando tabela notifications...' as status;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. Verificar se as funções foram criadas
SELECT 'Verificando funções...' as status;
SELECT 
    proname as function_name,
    pronargs as num_args,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN (
    'create_notification',
    'mark_notification_read', 
    'mark_all_notifications_read',
    'cleanup_old_notifications'
);

-- 3. Verificar se os triggers foram criados
SELECT 'Verificando triggers...' as status;
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname IN (
    'trigger_notify_card_created',
    'trigger_notify_card_moved', 
    'trigger_notify_board_created'
);

-- 4. Verificar políticas RLS
SELECT 'Verificando políticas RLS...' as status;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'notifications';

-- 5. Testar criação de notificação manual
SELECT 'Testando criação de notificação...' as status;
DO $$
DECLARE
    current_user_id UUID;
    notification_id UUID;
BEGIN
    -- Obter ID do usuário atual
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        -- Criar notificação de teste
        SELECT create_notification(
            current_user_id,
            'card_created',
            'Teste do Sistema',
            'Esta é uma notificação de teste para verificar se o sistema está funcionando corretamente.',
            '{"test": true, "timestamp": "' || NOW() || '"}'
        ) INTO notification_id;
        
        IF notification_id IS NOT NULL THEN
            RAISE NOTICE 'Notificação de teste criada com sucesso: %', notification_id;
        ELSE
            RAISE NOTICE 'Erro ao criar notificação de teste';
        END IF;
    ELSE
        RAISE NOTICE 'Usuário não autenticado - faça login primeiro';
    END IF;
END $$;

-- 6. Verificar se a notificação foi criada
SELECT 'Verificando notificações criadas...' as status;
SELECT 
    id,
    type,
    title,
    message,
    is_read,
    created_at
FROM notifications 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 7. Testar função de marcar como lida
SELECT 'Testando marcar como lida...' as status;
DO $$
DECLARE
    test_notification_id UUID;
    result BOOLEAN;
BEGIN
    -- Buscar uma notificação não lida
    SELECT id INTO test_notification_id
    FROM notifications 
    WHERE user_id = auth.uid() AND is_read = false
    LIMIT 1;
    
    IF test_notification_id IS NOT NULL THEN
        -- Marcar como lida
        SELECT mark_notification_read(test_notification_id) INTO result;
        
        IF result THEN
            RAISE NOTICE 'Notificação marcada como lida com sucesso: %', test_notification_id;
        ELSE
            RAISE NOTICE 'Erro ao marcar notificação como lida';
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma notificação não lida encontrada para teste';
    END IF;
END $$;

-- 8. Testar função de marcar todas como lidas
SELECT 'Testando marcar todas como lidas...' as status;
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Criar algumas notificações de teste primeiro
    PERFORM create_notification(
        auth.uid(),
        'card_moved',
        'Teste - Cartão Movido',
        'Teste de movimentação de cartão',
        '{"test": true}'
    );
    
    PERFORM create_notification(
        auth.uid(),
        'board_created',
        'Teste - Quadro Criado',
        'Teste de criação de quadro',
        '{"test": true}'
    );
    
    -- Marcar todas como lidas
    SELECT mark_all_notifications_read() INTO updated_count;
    
    RAISE NOTICE 'Marcadas % notificações como lidas', updated_count;
END $$;

-- 9. Verificar contadores
SELECT 'Verificando contadores...' as status;
SELECT 
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = true) as read_notifications,
    COUNT(*) FILTER (WHERE is_read = false) as unread_notifications,
    COUNT(DISTINCT type) as notification_types
FROM notifications 
WHERE user_id = auth.uid();

-- 10. Verificar tipos de notificação
SELECT 'Verificando tipos de notificação...' as status;
SELECT 
    type,
    COUNT(*) as count,
    MAX(created_at) as last_created
FROM notifications 
WHERE user_id = auth.uid()
GROUP BY type
ORDER BY count DESC;

-- 11. Testar limpeza de notificações antigas
SELECT 'Testando limpeza de notificações antigas...' as status;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Criar uma notificação "antiga" para teste
    INSERT INTO notifications (user_id, type, title, message, created_at)
    VALUES (
        auth.uid(),
        'card_created',
        'Notificação Antiga (Teste)',
        'Esta notificação será removida pelo teste de limpeza',
        NOW() - INTERVAL '31 days'
    );
    
    -- Executar limpeza
    SELECT cleanup_old_notifications() INTO deleted_count;
    
    RAISE NOTICE 'Removidas % notificações antigas', deleted_count;
END $$;

-- 12. Verificar performance dos índices
SELECT 'Verificando índices...' as status;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'notifications'
ORDER BY indexname;

-- 13. Estatísticas da tabela
SELECT 'Verificando estatísticas...' as status;
SELECT 
    schemaname,
    tablename,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename = 'notifications';

-- 14. Teste de trigger (simulação)
SELECT 'Testando triggers...' as status;
SELECT 'Para testar os triggers, crie cartões e quadros no KazuFlow e observe as notificações sendo criadas automaticamente.' as instruction;

-- 15. Resumo final
SELECT 'RESUMO DO TESTE' as status;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
        THEN '✅ Tabela notifications criada'
        ELSE '❌ Tabela notifications não encontrada'
    END as table_status
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%notification%') >= 4
        THEN '✅ Funções criadas (' || (SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%notification%') || ')'
        ELSE '❌ Funções não encontradas'
    END as functions_status
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'trigger_notify_%') >= 3
        THEN '✅ Triggers criados (' || (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'trigger_notify_%') || ')'
        ELSE '❌ Triggers não encontrados'
    END as triggers_status
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications') >= 4
        THEN '✅ Políticas RLS criadas (' || (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications') || ')'
        ELSE '❌ Políticas RLS não encontradas'
    END as rls_status
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid()) > 0
        THEN '✅ Notificações de teste criadas (' || (SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid()) || ')'
        ELSE '⚠️ Nenhuma notificação encontrada (normal se for primeira execução)'
    END as notifications_status;

-- 16. Instruções finais
SELECT '🎉 TESTE CONCLUÍDO!' as message;
SELECT 'Agora teste no frontend:' as instruction;
SELECT '1. Acesse o KazuFlow' as step_1;
SELECT '2. Observe o sino no canto superior direito' as step_2;
SELECT '3. Crie um cartão ou quadro' as step_3;
SELECT '4. Verifique se a notificação aparece' as step_4;
SELECT '5. Teste marcar como lida e deletar' as step_5;