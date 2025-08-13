-- Correção: Criar tabela trello_activities que está faltando
-- Esta tabela é necessária para o funcionamento do drag and drop dos cartões

-- 1. Verificar se a tabela já existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'trello_activities'
        ) 
        THEN '✅ Tabela trello_activities já existe'
        ELSE '❌ Tabela trello_activities NÃO existe - será criada'
    END as status;

-- 2. Criar a tabela trello_activities
CREATE TABLE IF NOT EXISTS trello_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES trello_cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_trello_activities_card_id ON trello_activities(card_id);
CREATE INDEX IF NOT EXISTS idx_trello_activities_user_id ON trello_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_trello_activities_created_at ON trello_activities(created_at);

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE trello_activities ENABLE ROW LEVEL SECURITY;

-- 5. Criar política de segurança
CREATE POLICY "Users can view activities from accessible cards" ON trello_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trello_cards c
            JOIN trello_lists l ON c.list_id = l.id
            JOIN trello_boards b ON l.board_id = b.id
            WHERE c.id = trello_activities.card_id
            AND (b.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM trello_board_members bm 
                WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
            ))
        )
    );

-- 6. Política para inserir atividades
CREATE POLICY "Users can create activities for accessible cards" ON trello_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM trello_cards c
            JOIN trello_lists l ON c.list_id = l.id
            JOIN trello_boards b ON l.board_id = b.id
            WHERE c.id = trello_activities.card_id
            AND (b.created_by = auth.uid() OR EXISTS (
                SELECT 1 FROM trello_board_members bm 
                WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
            ))
        )
        AND user_id = auth.uid()
    );

-- 7. Verificar se tudo foi criado corretamente
SELECT 
    t.table_name,
    COUNT(c.column_name) as num_columns,
    '✅ Tabela criada com sucesso!' as status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND t.table_name = 'trello_activities'
GROUP BY t.table_name;

-- 8. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    '✅ Política criada!' as status
FROM pg_policies 
WHERE tablename = 'trello_activities';

-- 9. Comentário explicativo
COMMENT ON TABLE trello_activities IS 'Tabela para registrar atividades dos cartões (movimentação, alterações, etc.) - necessária para o drag and drop funcionar';

-- 10. Mensagem final
SELECT '🎉 CORREÇÃO CONCLUÍDA! Agora o drag and drop dos cartões deve funcionar normalmente!' as resultado;