-- Criar bucket para anexos dos AFOs
INSERT INTO storage.buckets (id, name, public)
VALUES ('afo-attachments', 'afo-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket afo-attachments
CREATE POLICY "Usuários podem visualizar anexos dos AFOs"
ON storage.objects FOR SELECT
USING (bucket_id = 'afo-attachments');

CREATE POLICY "Usuários podem fazer upload de anexos dos AFOs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'afo-attachments');

CREATE POLICY "Usuários podem excluir seus próprios anexos dos AFOs"
ON storage.objects FOR DELETE
USING (bucket_id = 'afo-attachments'); 