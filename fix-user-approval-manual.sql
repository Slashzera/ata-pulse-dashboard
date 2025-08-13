-- ============================================
-- FIX PARA APROVAÇÃO DE USUÁRIOS
-- Execute este SQL diretamente no seu banco Supabase
-- ============================================

-- 1. Remover políticas conflitantes
DROP POLICY IF EXISTS "Admin full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access to pending users" ON public.pending_users;
DROP POLICY IF EXISTS "Users can view own pending status" ON public.pending_users;

-- 2. Criar políticas corretas para profiles
CREATE POLICY "Admin full access to profiles" ON public.profiles
  FOR ALL USING (
    auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR auth.email() = 'drfeliperodrigues@outlook.com'
  );

-- 3. Criar políticas corretas para pending_users
CREATE POLICY "Admin full access to pending users" ON public.pending_users
  FOR ALL USING (
    auth.email() = 'drfeliperodrigues@outlook.com'
  );

CREATE POLICY "Users can view own pending status" ON public.pending_users
  FOR SELECT USING (
    email = auth.email()
  );

-- 4. Conceder permissões necessárias
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.pending_users TO authenticated;

-- 5. Processos Administrativos - Permitir visualização compartilhada
DROP POLICY IF EXISTS "Users can view their own folders" ON public.processos_pastas;
DROP POLICY IF EXISTS "Usuários podem visualizar suas próprias pastas" ON public.processos_pastas;
DROP POLICY IF EXISTS "Users can view their own files" ON public.processos_arquivos;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios arquivos" ON public.processos_arquivos;

-- Criar políticas de visualização compartilhada para processos
CREATE POLICY "All users can view all folders"
ON public.processos_pastas FOR SELECT
USING (true);

CREATE POLICY "All users can view all files"
ON public.processos_arquivos FOR SELECT
USING (true);

-- 6. Storage - Permitir visualização compartilhada de arquivos de processos
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios arquivos" ON storage.objects;

CREATE POLICY "All users can view processos files"
ON storage.objects FOR SELECT
USING (bucket_id = 'processos-administrativos');

-- 7. Verificar se o admin existe na tabela profiles
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
    RAISE NOTICE 'Admin profile created successfully';
  ELSE
    RAISE NOTICE 'Admin profile already exists';
  END IF;
END
$$;

-- 8. Confirmar que a correção foi aplicada
SELECT 'User approval system fixed successfully!' as status; 