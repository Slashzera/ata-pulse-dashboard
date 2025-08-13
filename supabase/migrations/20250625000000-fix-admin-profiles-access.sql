-- Criar política para permitir que o Felipe (admin) veja todos os profiles
CREATE POLICY "Felipe can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = 'drfeliperodrigues@outlook.com'
    )
  ); 