
-- Criar tabela para usuários pendentes de aprovação
CREATE TABLE public.pending_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela pending_users
ALTER TABLE public.pending_users ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para pending_users
-- Permitir que todos vejam (para o admin poder ver as solicitações)
CREATE POLICY "Allow select for authenticated users" 
  ON public.pending_users 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Permitir inserção para usuários anônimos (cadastro)
CREATE POLICY "Allow insert for anonymous users" 
  ON public.pending_users 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Permitir atualização apenas para usuários autenticados (admin)
CREATE POLICY "Allow update for authenticated users" 
  ON public.pending_users 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER handle_updated_at 
  BEFORE UPDATE ON public.pending_users 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Criar função edge para envio de notificação de aprovação
CREATE OR REPLACE FUNCTION public.send_user_approval_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função será implementada como edge function
  -- Por agora, apenas um placeholder
  RETURN;
END;
$$;
