
-- Criar tabela para as pastas de processos administrativos
CREATE TABLE public.processos_pastas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para os arquivos dos processos administrativos
CREATE TABLE public.processos_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pasta_id UUID REFERENCES public.processos_pastas(id) ON DELETE CASCADE NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho_arquivo BIGINT NOT NULL,
  url_arquivo TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.processos_pastas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_arquivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para processos_pastas
CREATE POLICY "Users can view their own folders" 
  ON public.processos_pastas 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
  ON public.processos_pastas 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
  ON public.processos_pastas 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
  ON public.processos_pastas 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para processos_arquivos
CREATE POLICY "Users can view their own files" 
  ON public.processos_arquivos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files" 
  ON public.processos_arquivos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" 
  ON public.processos_arquivos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
  ON public.processos_arquivos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER handle_updated_at_processos_pastas
  BEFORE UPDATE ON public.processos_pastas
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_processos_arquivos
  BEFORE UPDATE ON public.processos_arquivos
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Criar bucket para armazenar os arquivos PDF
INSERT INTO storage.buckets (id, name, public) 
VALUES ('processos-administrativos', 'processos-administrativos', true);

-- Política de storage para permitir upload de arquivos
CREATE POLICY "Users can upload their own files" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'processos-administrativos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política de storage para permitir visualização de arquivos
CREATE POLICY "Users can view their own files" 
  ON storage.objects 
  FOR SELECT 
  USING (
    bucket_id = 'processos-administrativos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política de storage para permitir exclusão de arquivos
CREATE POLICY "Users can delete their own files" 
  ON storage.objects 
  FOR DELETE 
  USING (
    bucket_id = 'processos-administrativos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
