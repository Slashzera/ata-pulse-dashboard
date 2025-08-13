-- SQL simples para corrigir permissões da tabela profiles
-- Execute este comando no Supabase

-- Remover políticas restritivas temporariamente
DROP POLICY IF EXISTS "Users can only see their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON profiles;

-- Criar política mais permissiva para admin
CREATE POLICY "Admin can manage all profiles" ON profiles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'drfeliperodrigues@outlook.com'
  OR auth.uid() = id
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'drfeliperodrigues@outlook.com'
  OR auth.uid() = id
);

-- Verificar se Felipe tem profile
SELECT * FROM profiles WHERE email = 'drfeliperodrigues@outlook.com';

-- Se não tiver, criar profile do Felipe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'drfeliperodrigues@outlook.com') THEN
    INSERT INTO profiles (id, email, nome, created_at, updated_at)
    SELECT 
      id,
      email,
      'Felipe Rodrigues',
      NOW(),
      NOW()
    FROM auth.users 
    WHERE email = 'drfeliperodrigues@outlook.com'
    LIMIT 1;
  END IF;
END $$; 