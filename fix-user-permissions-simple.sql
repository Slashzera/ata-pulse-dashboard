-- Script Simplificado para Corrigir Permissões de Usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela profiles
SELECT 
  'Estrutura atual da tabela profiles:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Criar perfis para usuários que não têm
INSERT INTO public.profiles (id, email, nome)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nome', au.raw_user_meta_data->>'name', au.email)
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Remover todas as políticas restritivas e criar permissivas

-- Profiles - Permitir acesso total para usuários autenticados
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Felipe can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.profiles;

CREATE POLICY "All authenticated users can manage profiles" 
  ON public.profiles 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ATAs - Permitir acesso total
DROP POLICY IF EXISTS "Allow all operations on atas" ON public.atas;
DROP POLICY IF EXISTS "Allow select non-deleted atas" ON public.atas;
DROP POLICY IF EXISTS "Allow insert atas" ON public.atas;
DROP POLICY IF EXISTS "Allow update atas" ON public.atas;
DROP POLICY IF EXISTS "Allow delete atas" ON public.atas;
DROP POLICY IF EXISTS "Authenticated users can manage atas" ON public.atas;

CREATE POLICY "All authenticated users can manage atas" 
  ON public.atas 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Pedidos - Permitir acesso total
DROP POLICY IF EXISTS "Allow all operations on pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow select non-deleted pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow insert pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow update pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow delete pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Authenticated users can manage pedidos" ON public.pedidos;

CREATE POLICY "All authenticated users can manage pedidos" 
  ON public.pedidos 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Audit Logs - Permitir acesso total
DROP POLICY IF EXISTS "Felipe can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can manage audit logs" ON public.audit_logs;

CREATE POLICY "All authenticated users can manage audit logs" 
  ON public.audit_logs 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Trash Log - Permitir acesso total
DROP POLICY IF EXISTS "Allow authenticated users to view trash log" ON public.trash_log;
DROP POLICY IF EXISTS "Allow authenticated users to insert trash log" ON public.trash_log;
DROP POLICY IF EXISTS "Authenticated users can manage trash log" ON public.trash_log;

CREATE POLICY "All authenticated users can manage trash log" 
  ON public.trash_log 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Pending Users - Permitir acesso total
DROP POLICY IF EXISTS "Admin can view all pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Admin can update pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Allow insert for anonymous users" ON public.pending_users;

CREATE POLICY "All authenticated users can manage pending users" 
  ON public.pending_users 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Permitir inserção anônima para registro
CREATE POLICY "Anonymous can insert pending users" 
  ON public.pending_users 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- 4. Atualizar funções para serem permissivas
CREATE OR REPLACE FUNCTION public.is_user_approved(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Todos os usuários autenticados são aprovados
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Todos os usuários autenticados são admin
  RETURN auth.uid() IS NOT NULL;
END;
$$;

-- 5. Função para listar usuários (simplificada)
CREATE OR REPLACE FUNCTION public.get_all_users()
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
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.email, 
    p.nome, 
    COALESCE(p.created_at, now()) as created_at,
    COALESCE(p.updated_at, now()) as updated_at
  FROM public.profiles p
  ORDER BY COALESCE(p.created_at, now()) DESC;
END;
$$;

-- 6. Trigger para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Remover e recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Verificação final
SELECT 
  'CORREÇÃO CONCLUÍDA!' as status,
  'Todos os usuários autenticados agora têm permissões completas' as resultado,
  COUNT(*) as total_usuarios_com_profile
FROM public.profiles;

-- 8. Mostrar usuários
SELECT 
  'Usuários no sistema:' as info,
  email,
  nome,
  created_at
FROM public.profiles
ORDER BY created_at;