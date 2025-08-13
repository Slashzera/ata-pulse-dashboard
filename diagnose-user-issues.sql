-- Script de Diagnóstico de Problemas de Usuários
-- Execute este script no SQL Editor do Supabase para diagnosticar

-- 1. Verificar se a tabela profiles existe
SELECT 
  'Tabela profiles existe?' as verificacao,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN 'SIM' 
    ELSE 'NÃO - PROBLEMA!' 
  END as resultado;

-- 2. Contar usuários no auth.users vs profiles
SELECT 
  'Usuários no auth.users' as tipo,
  COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
  'Usuários no profiles' as tipo,
  COUNT(*) as quantidade
FROM public.profiles;

-- 3. Verificar usuários sem profile
SELECT 
  'Usuários sem profile:' as problema,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- 4. Verificar políticas RLS das tabelas principais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'atas', 'pedidos', 'audit_logs')
ORDER BY tablename, policyname;

-- 5. Verificar permissões do Felipe especificamente
SELECT 
  'Felipe no auth.users?' as verificacao,
  CASE 
    WHEN EXISTS (SELECT FROM auth.users WHERE email = 'drfeliperodrigues@outlook.com') 
    THEN 'SIM' 
    ELSE 'NÃO' 
  END as resultado
UNION ALL
SELECT 
  'Felipe no profiles?' as verificacao,
  CASE 
    WHEN EXISTS (SELECT FROM public.profiles WHERE email = 'drfeliperodrigues@outlook.com') 
    THEN 'SIM' 
    ELSE 'NÃO' 
  END as resultado;

-- 6. Verificar roles dos usuários
SELECT 
  email,
  nome,
  role,
  created_at
FROM public.profiles
ORDER BY created_at;

-- 7. Verificar se RLS está habilitado nas tabelas críticas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'atas', 'pedidos', 'audit_logs', 'trash_log')
AND schemaname = 'public';

-- 8. Testar função is_user_approved
SELECT 
  'Função is_user_approved existe?' as verificacao,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.routines 
      WHERE routine_name = 'is_user_approved'
    ) 
    THEN 'SIM' 
    ELSE 'NÃO' 
  END as resultado;

-- 9. Verificar pending_users
SELECT 
  'Usuários pendentes:' as info,
  COUNT(*) as quantidade
FROM public.pending_users
WHERE status = 'pending';

-- 10. Resumo dos problemas mais comuns
SELECT 
  'DIAGNÓSTICO COMPLETO' as titulo,
  'Verifique os resultados acima para identificar problemas' as instrucoes;