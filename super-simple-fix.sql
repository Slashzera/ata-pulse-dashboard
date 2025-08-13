-- CORREÇÃO SUPER SIMPLES - Execute uma linha por vez no SQL Editor

-- Passo 1: Desabilitar RLS para profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Passo 2: Desabilitar RLS para pending_users  
ALTER TABLE public.pending_users DISABLE ROW LEVEL SECURITY;

-- Passo 3: Conceder permissões
GRANT ALL ON public.profiles TO authenticated;

-- Passo 4: Conceder permissões para pending_usersss
GRANT ALL ON public.pending_users TO authenticated;

-- Passo 5: Verificar se admin existe (execute e veja o resultado)
SELECT * FROM public.profiles WHERE email = 'drfeliperodrigues@outlook.com';

-- Passo 6: Se o admin não existir, execute esta linha:
-- INSERT INTO public.profiles (id, email, nome, created_at, updated_at) VALUES (gen_random_uuid(), 'drfeliperodrigues@outlook.com', 'Felipe Rodrigues', NOW(), NOW()); 