-- Migração para permitir visualização compartilhada dos processos administrativos
-- Mantém as políticas de criação, edição e exclusão restritas aos proprietários

-- Drop das políticas existentes para processos_pastas
DROP POLICY IF EXISTS "Users can view their own folders" ON public.processos_pastas;
DROP POLICY IF EXISTS "Usuários podem visualizar suas próprias pastas" ON public.processos_pastas;

-- Drop das políticas existentes para processos_arquivos  
DROP POLICY IF EXISTS "Users can view their own files" ON public.processos_arquivos;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios arquivos" ON public.processos_arquivos;

-- Criar novas políticas para VISUALIZAÇÃO COMPARTILHADA das pastas
CREATE POLICY "All users can view all folders"
ON public.processos_pastas FOR SELECT
USING (true);

-- Criar novas políticas para VISUALIZAÇÃO COMPARTILHADA dos arquivos
CREATE POLICY "All users can view all files"
ON public.processos_arquivos FOR SELECT
USING (true);

-- Manter políticas restritivas para criação (apenas proprietários)
-- (As políticas de INSERT, UPDATE e DELETE já existem e estão corretas)

-- Atualizar políticas de storage para visualização compartilhada
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios arquivos" ON storage.objects;

CREATE POLICY "All users can view processos files"
ON storage.objects FOR SELECT
USING (bucket_id = 'processos-administrativos');

-- Manter políticas restritivas para upload e exclusão no storage
-- (As políticas de INSERT e DELETE do storage já estão corretas) 