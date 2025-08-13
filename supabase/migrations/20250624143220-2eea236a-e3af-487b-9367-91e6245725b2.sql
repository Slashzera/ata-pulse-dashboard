
-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Felipe can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs;

-- Criar política para permitir que o Felipe (admin) veja todos os logs
CREATE POLICY "Felipe can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'drfeliperodrigues@outlook.com'
    )
  );

-- Criar política para permitir que usuários autenticados criem logs de auditoria
CREATE POLICY "Users can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Criar política para permitir que usuários autenticados vejam seus próprios logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);
