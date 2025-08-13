-- Script para Corrigir Permissões de Usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela profiles e ajustar
-- Primeiro, vamos ver se a tabela existe e sua estrutura
DO $$
BEGIN
  -- Criar tabela se não existir
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
  
  -- Adicionar coluna role se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'user'));
  END IF;
  
  -- Adicionar coluna created_at se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
  
  -- Adicionar coluna updated_at se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END
$$;

-- 2. Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas conflitantes
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Felipe can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 4. Criar políticas mais permissivas para todos os usuários autenticados
CREATE POLICY "Authenticated users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can insert profiles" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update profiles" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- 5. Garantir que Felipe tenha perfil de admin
DO $$
BEGIN
  -- Inserir ou atualizar Felipe
  INSERT INTO public.profiles (id, email, nome)
  SELECT 
    id, 
    email, 
    'FELIPE CARDOSO RODRIGUES'
  FROM auth.users 
  WHERE email = 'drfeliperodrigues@outlook.com'
  ON CONFLICT (id) DO UPDATE SET
    nome = 'FELIPE CARDOSO RODRIGUES',
    updated_at = COALESCE(profiles.updated_at, now());
    
  -- Atualizar role se a coluna existir
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    UPDATE public.profiles 
    SET role = 'admin', updated_at = now()
    WHERE email = 'drfeliperodrigues@outlook.com';
  END IF;
END
$$;

-- 6. Criar perfis para todos os usuários existentes no auth.users
INSERT INTO public.profiles (id, email, nome)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nome', au.raw_user_meta_data->>'name', au.email)
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Atualizar role para admin se a coluna existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    UPDATE public.profiles 
    SET role = 'admin', updated_at = now()
    WHERE role IS NULL OR role != 'admin';
  END IF;
END
$$;

-- 8. Remover políticas restritivas das outras tabelas e criar mais permissivas

-- ATAs - Permitir todas as operações para usuários autenticados
DROP POLICY IF EXISTS "Allow select non-deleted atas" ON public.atas;
DROP POLICY IF EXISTS "Allow insert atas" ON public.atas;
DROP POLICY IF EXISTS "Allow update atas" ON public.atas;
DROP POLICY IF EXISTS "Allow delete atas" ON public.atas;

CREATE POLICY "Authenticated users can manage atas" 
  ON public.atas 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Pedidos - Permitir todas as operações para usuários autenticados
DROP POLICY IF EXISTS "Allow select non-deleted pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow insert pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow update pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Allow delete pedidos" ON public.pedidos;

CREATE POLICY "Authenticated users can manage pedidos" 
  ON public.pedidos 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Audit Logs - Permitir visualização e criação para todos
DROP POLICY IF EXISTS "Felipe can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can manage audit logs" 
  ON public.audit_logs 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Trash Log - Permitir acesso para todos os usuários autenticados
DROP POLICY IF EXISTS "Allow authenticated users to view trash log" ON public.trash_log;
DROP POLICY IF EXISTS "Allow authenticated users to insert trash log" ON public.trash_log;

CREATE POLICY "Authenticated users can manage trash log" 
  ON public.trash_log 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 9. Atualizar função de aprovação para ser mais permissiva
CREATE OR REPLACE FUNCTION public.is_user_approved(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Todos os usuários autenticados são considerados aprovados
  RETURN true;
END;
$$;

-- 10. Criar função para verificar se usuário é admin (todos são admin agora)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Todos os usuários autenticados são admin temporariamente
  RETURN auth.uid() IS NOT NULL;
END;
$$;

-- 11. Função para listar todos os usuários (acessível por todos)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nome TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retornar todos os usuários da tabela profiles
  RETURN QUERY
  SELECT 
    p.id, 
    p.email, 
    p.nome, 
    COALESCE(
      (SELECT p2.role FROM public.profiles p2 WHERE p2.id = p.id AND EXISTS (
        SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role'
      )), 
      'admin'
    ) as role,
    COALESCE(p.created_at, now()) as created_at,
    COALESCE(p.updated_at, now()) as updated_at
  FROM public.profiles p
  ORDER BY COALESCE(p.created_at, now()) DESC;
END;
$$;

-- 12. Trigger para criar profile automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir profile básico
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NEW.email)
  );
  
  -- Atualizar role se a coluna existir
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Comentários para documentação
COMMENT ON TABLE public.profiles IS 'Perfis de usuários com permissões administrativas';
COMMENT ON FUNCTION public.is_user_approved IS 'Verifica se usuário está aprovado (sempre true agora)';
COMMENT ON FUNCTION public.is_admin IS 'Verifica se usuário é admin (todos são admin agora)';
COMMENT ON FUNCTION public.get_all_users IS 'Lista todos os usuários do sistema';

-- Mensagem de sucesso
SELECT 
  'Permissões de usuários corrigidas! Todos os usuários agora têm permissões de admin.' as status,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN 1 END) as usuarios_com_role
FROM public.profiles;