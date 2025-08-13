
-- Criar tabela para controle de AFO
CREATE TABLE public.afo_controle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_afo TEXT NOT NULL,
  favorecido TEXT NOT NULL,
  adesao_ata TEXT,
  numero_processo TEXT,
  arp_numero TEXT,
  tipo_pregao TEXT,
  data_emissao DATE,
  valor_total NUMERIC DEFAULT 0,
  feito_por TEXT,
  ano INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  arquivo_pdf TEXT, -- Para armazenar o caminho do arquivo PDF
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar trigger para updated_at
CREATE TRIGGER handle_updated_at_afo_controle
  BEFORE UPDATE ON public.afo_controle
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Tabela para arquivos PDF anexados às AFOs
CREATE TABLE public.afo_arquivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  afo_id UUID REFERENCES public.afo_controle(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  caminho_arquivo TEXT NOT NULL,
  tamanho_arquivo INTEGER,
  tipo_arquivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Limpar usuários pendentes (manter apenas o admin Felipe Rodrigues)
DELETE FROM public.pending_users 
WHERE email != 'drfeliperodrigues@outlook.com';

-- Limpar perfis (manter apenas o admin)
DELETE FROM public.profiles 
WHERE email != 'drfeliperodrigues@outlook.com';

-- Limpar configurações de usuário (manter apenas o admin)
DELETE FROM public.user_settings 
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'drfeliperodrigues@outlook.com'
);
