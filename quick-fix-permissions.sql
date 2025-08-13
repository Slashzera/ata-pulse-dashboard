-- CORREÇÃO RÁPIDA DE PERMISSÕES
-- Execute este SQL no Dashboard do Supabase > SQL Editor

-- 1. Desabilitar RLS temporariamente para profiles (CUIDADO: apenas para teste)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Conceder permissões totais na tabela profiles
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- 3. Desabilitar RLS temporariamente para pending_users
ALTER TABLE public.pending_users DISABLE ROW LEVEL SECURITY;

-- 4. Conceder permissões totais na tabela pending_users
GRANT ALL ON public.pending_users TO authenticated;
GRANT ALL ON public.pending_users TO anon;

-- 5. Garantir que o admin existe (usando DO block para verificar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'drfeliperodrigues@outlook.com') THEN
    INSERT INTO public.profiles (id, email, nome, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'drfeliperodrigues@outlook.com',
      'Felipe Rodrigues',
      NOW(),
      NOW()
    );
    RAISE NOTICE 'Admin profile created';
  ELSE
    UPDATE public.profiles 
    SET nome = 'Felipe Rodrigues', updated_at = NOW()
    WHERE email = 'drfeliperodrigues@outlook.com';
    RAISE NOTICE 'Admin profile updated';
  END IF;
END
$$;

SELECT 'Permissions fixed - RLS temporarily disabled for testing' as status; 