
-- Adicionar política para permitir que usuários autenticados (admin) possam deletar usuários pendentes
CREATE POLICY "Allow delete for authenticated users" 
  ON public.pending_users 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Verificar se existe alguma constraint que possa estar causando problemas
-- Alterar a tabela para garantir que email não seja obrigatório único durante edições
ALTER TABLE public.pending_users DROP CONSTRAINT IF EXISTS pending_users_email_key;

-- Recriar a constraint de email único apenas para registros ativos
CREATE UNIQUE INDEX pending_users_email_active_idx 
ON public.pending_users (email) 
WHERE status = 'pending';
