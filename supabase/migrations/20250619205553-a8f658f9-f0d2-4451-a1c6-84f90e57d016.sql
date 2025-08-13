
-- Atualizar a tabela pending_users para melhor controle de duplicações
ALTER TABLE public.pending_users 
ADD COLUMN IF NOT EXISTS email_confirmado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tentativas_solicitacao INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ultimo_envio TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar constraint única para email quando pendente (evitar duplicações)
DROP INDEX IF EXISTS pending_users_email_active_idx;
CREATE UNIQUE INDEX pending_users_email_unique_idx 
ON public.pending_users (email) 
WHERE status = 'pending';

-- Adicionar política para controlar inserções baseada em tentativas
CREATE OR REPLACE FUNCTION check_user_registration_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe uma solicitação pendente
  IF EXISTS (
    SELECT 1 FROM public.pending_users 
    WHERE email = NEW.email 
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Já existe uma solicitação pendente para este email';
  END IF;
  
  -- Verificar tentativas nos últimos 7 dias
  IF (
    SELECT COUNT(*) 
    FROM public.pending_users 
    WHERE email = NEW.email 
    AND created_at > (NOW() - INTERVAL '7 days')
  ) >= 2 THEN
    RAISE EXCEPTION 'Limite de solicitações excedido. Aguarde 7 dias para tentar novamente';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para verificar limites antes da inserção
DROP TRIGGER IF EXISTS check_registration_limits ON public.pending_users;
CREATE TRIGGER check_registration_limits
  BEFORE INSERT ON public.pending_users
  FOR EACH ROW EXECUTE FUNCTION check_user_registration_limits();

-- Atualizar função para contar tentativas
CREATE OR REPLACE FUNCTION increment_registration_attempts()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar tentativas se email já existe
  UPDATE public.pending_users 
  SET tentativas_solicitacao = tentativas_solicitacao + 1,
      ultimo_envio = now()
  WHERE email = NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
