-- Configurar sistema de aprovação manual sem confirmação de email

-- 1. Atualizar a configuração do Supabase Auth para não exigir confirmação de email
-- (Isso precisará ser feito manualmente no dashboard do Supabase)

-- 2. Criar função para verificar aprovação de usuário
CREATE OR REPLACE FUNCTION public.is_user_approved(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Felipe sempre é aprovado
  IF user_email = 'drfeliperodrigues@outlook.com' THEN
    RETURN true;
  END IF;
  
  -- Verificar se existe profile (significa que foi aprovado)
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = user_email
  );
END;
$$;

-- 3. Função para aprovar usuário (criar profile)
CREATE OR REPLACE FUNCTION public.approve_user(
  user_email TEXT,
  user_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Verificar se o usuário atual é admin
  IF auth.email() != 'drfeliperodrigues@outlook.com' THEN
    RAISE EXCEPTION 'Access denied. Only admin can approve users.';
  END IF;
  
  -- Buscar o ID do usuário no auth.users
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in auth system';
  END IF;
  
  -- Criar ou atualizar profile
  INSERT INTO public.profiles (id, email, nome)
  VALUES (auth_user_id, user_email, user_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- 4. Política para permitir que admin veja todos os profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'drfeliperodrigues@outlook.com'
    ) OR 
    auth.uid() = profiles.id
  );

-- 5. Atualizar política de pending_users para admin poder ver tudo
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.pending_users;
CREATE POLICY "Admin can view all pending users" ON public.pending_users
  FOR SELECT USING (
    auth.email() = 'drfeliperodrigues@outlook.com' OR
    auth.email() = email -- Usuário pode ver sua própria solicitação
  );

-- 6. Política para admin atualizar pending_users
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.pending_users;
CREATE POLICY "Admin can update pending users" ON public.pending_users
  FOR UPDATE USING (
    auth.email() = 'drfeliperodrigues@outlook.com'
  );

-- 7. Trigger para prevenir criação duplicada de pending_users
CREATE OR REPLACE FUNCTION prevent_duplicate_pending_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe uma solicitação pendente
  IF EXISTS (
    SELECT 1 FROM public.pending_users 
    WHERE email = NEW.email 
    AND status = 'pending'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'Já existe uma solicitação pendente para este email';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_duplicate_pending ON public.pending_users;
CREATE TRIGGER prevent_duplicate_pending
  BEFORE INSERT OR UPDATE ON public.pending_users
  FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_pending_users();

-- 8. Função para limpar usuários rejeitados antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_old_rejected_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.pending_users
  WHERE status = 'rejected' 
  AND updated_at < (NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$; 