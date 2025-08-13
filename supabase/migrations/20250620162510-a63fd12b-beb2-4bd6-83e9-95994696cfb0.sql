
-- Criar bucket para processos administrativos se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('processos-administrativos', 'processos-administrativos', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket processos-administrativos
CREATE POLICY "Usuários podem visualizar seus próprios arquivos"
ON storage.objects FOR SELECT
USING (bucket_id = 'processos-administrativos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem fazer upload de seus próprios arquivos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'processos-administrativos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários podem excluir seus próprios arquivos"
ON storage.objects FOR DELETE
USING (bucket_id = 'processos-administrativos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Adicionar RLS nas tabelas de processos
ALTER TABLE processos_pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos_arquivos ENABLE ROW LEVEL SECURITY;

-- Políticas para processos_pastas
CREATE POLICY "Usuários podem visualizar suas próprias pastas"
ON processos_pastas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias pastas"
ON processos_pastas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias pastas"
ON processos_pastas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias pastas"
ON processos_pastas FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para processos_arquivos
CREATE POLICY "Usuários podem visualizar seus próprios arquivos"
ON processos_arquivos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios arquivos"
ON processos_arquivos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
ON processos_arquivos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios arquivos"
ON processos_arquivos FOR DELETE
USING (auth.uid() = user_id);
