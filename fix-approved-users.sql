-- SQL para corrigir usuários aprovados que não têm conta Auth/Profile
-- Execute este SQL no Supabase

-- 1. Primeiro, vamos ver quais usuários aprovados não têm conta
SELECT 
  pu.id,
  pu.email,
  pu.nome,
  pu.status,
  pu.password_hash,
  au.id as auth_id,
  p.id as profile_id
FROM pending_users pu
LEFT JOIN auth.users au ON pu.email = au.email
LEFT JOIN profiles p ON pu.email = p.email
WHERE pu.status = 'approved';

-- 2. Função para criar usuários aprovados que faltam
CREATE OR REPLACE FUNCTION fix_approved_users()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  auth_user_id UUID;
  result_text TEXT := '';
  temp_password TEXT;
BEGIN
  -- Buscar usuários aprovados sem conta Auth
  FOR user_record IN 
    SELECT pu.* 
    FROM pending_users pu
    LEFT JOIN auth.users au ON pu.email = au.email
    WHERE pu.status = 'approved' AND au.id IS NULL
  LOOP
    BEGIN
      -- Usar senha armazenada ou padrão
      temp_password := COALESCE(user_record.password_hash, 'TempPassword123!');
      
      -- Criar usuário no Auth (usando função administrativa)
      -- Nota: Esta parte pode precisar ser feita via código JavaScript
      -- pois auth.users não é diretamente acessível via SQL
      
      result_text := result_text || 'Usuário encontrado sem Auth: ' || user_record.email || E'\n';
      
    EXCEPTION WHEN OTHERS THEN
      result_text := result_text || 'Erro ao processar ' || user_record.email || ': ' || SQLERRM || E'\n';
    END;
  END LOOP;
  
  RETURN result_text;
END;
$$;

-- 3. Executar a função
SELECT fix_approved_users();

-- 4. Verificar resultado
SELECT 
  'RESUMO:' as tipo,
  COUNT(*) as total,
  'usuários aprovados' as descricao
FROM pending_users 
WHERE status = 'approved'

UNION ALL

SELECT 
  'AUTH:', 
  COUNT(*),
  'contas no auth'
FROM auth.users

UNION ALL

SELECT 
  'PROFILES:', 
  COUNT(*),
  'profiles criados'
FROM profiles; 