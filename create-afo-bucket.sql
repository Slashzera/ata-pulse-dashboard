-- Execute este SQL no Dashboard do Supabase > SQL Editor
-- Para criar o bucket de anexos dos AFOs

-- 1. Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('afo-attachments', 'afo-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acesso
CREATE POLICY "Allow all to view afo attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'afo-attachments');

CREATE POLICY "Allow authenticated to upload afo attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'afo-attachments');

CREATE POLICY "Allow authenticated to delete afo attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'afo-attachments');

SELECT 'AFO attachments bucket created successfully!' as status; 