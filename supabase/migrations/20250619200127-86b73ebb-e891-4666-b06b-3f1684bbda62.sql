
-- Criar tabela para armazenar os arquivos PDF das AFOs assinadas
CREATE TABLE public.afo_assinadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho_arquivo BIGINT NOT NULL,
  url_arquivo TEXT NOT NULL,
  data_upload TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar Row Level Security (RLS)
ALTER TABLE public.afo_assinadas ENABLE ROW LEVEL SECURITY;

-- Política para visualizar próprios arquivos
CREATE POLICY "Users can view their own afo_assinadas" 
  ON public.afo_assinadas 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para inserir próprios arquivos
CREATE POLICY "Users can create their own afo_assinadas" 
  ON public.afo_assinadas 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para deletar próprios arquivos
CREATE POLICY "Users can delete their own afo_assinadas" 
  ON public.afo_assinadas 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar bucket para armazenar os PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('afo-assinadas', 'afo-assinadas', true);

-- Política para o bucket de storage
CREATE POLICY "Allow public access to afo-assinadas bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'afo-assinadas');

CREATE POLICY "Allow authenticated users to upload to afo-assinadas bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'afo-assinadas' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own files in afo-assinadas bucket" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'afo-assinadas' AND auth.uid()::text = (storage.foldername(name))[1]);
