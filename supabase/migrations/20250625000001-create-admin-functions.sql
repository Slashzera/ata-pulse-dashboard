-- Criar política para permitir que o Felipe (admin) veja todos os profiles
DROP POLICY IF EXISTS "Felipe can view all profiles" ON public.profiles;
CREATE POLICY "Felipe can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'drfeliperodrigues@outlook.com'
    )
  );

-- Criar função RPC para o admin buscar todos os usuários
CREATE OR REPLACE FUNCTION get_all_users_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_email TEXT;
BEGIN
  -- Verificar se o usuário atual é o admin Felipe
  SELECT auth.email() INTO current_user_email;
  
  IF current_user_email != 'drfeliperodrigues@outlook.com' THEN
    RAISE EXCEPTION 'Acesso negado: apenas o administrador pode executar esta função';
  END IF;
  
  -- Retornar todos os usuários da tabela profiles
  RETURN QUERY
  SELECT p.id, p.email, p.nome, p.created_at, p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$; 