-- SQL para verificar se usuários foram criados corretamente
-- Execute no Supabase para debug

-- 1. Verificar usuários pendentes
SELECT 
  id,
  email,
  nome,
  status,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Tem senha'
    ELSE 'Sem senha'
  END as tem_senha,
  created_at
FROM pending_users 
ORDER BY created_at DESC;

-- 2. Verificar usuários no Auth
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- 3. Verificar profiles criados
SELECT 
  id,
  email,
  nome,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 4. Verificar usuários que estão no Auth mas não têm profile
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 5. Verificar usuários aprovados que não têm conta no Auth
SELECT 
  pu.email,
  pu.nome,
  pu.status,
  au.id as auth_id
FROM pending_users pu
LEFT JOIN auth.users au ON pu.email = au.email
WHERE pu.status = 'approved' AND au.id IS NULL; 