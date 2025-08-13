-- Criar tabela para anexos adicionais dos TACs
CREATE TABLE public.tac_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tac_id INTEGER NOT NULL REFERENCES public.tacs(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho_arquivo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.tac_attachments ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios anexos
CREATE POLICY "Users can view their own TAC attachments" ON public.tac_attachments
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram anexos em seus próprios TACs
CREATE POLICY "Users can insert TAC attachments" ON public.tac_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários deletem seus próprios anexos
CREATE POLICY "Users can delete their own TAC attachments" ON public.tac_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Criar índice para melhor performance
CREATE INDEX idx_tac_attachments_tac_id ON public.tac_attachments(tac_id);
CREATE INDEX idx_tac_attachments_user_id ON public.tac_attachments(user_id);