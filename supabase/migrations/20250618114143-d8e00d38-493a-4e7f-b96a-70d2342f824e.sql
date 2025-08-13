
-- Criar tabela para ATAs/Contratos
CREATE TABLE public.atas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  n_ata TEXT NOT NULL,
  pregao TEXT NOT NULL,
  processo_adm TEXT,
  processo_emp_afo TEXT,
  objeto TEXT NOT NULL,
  favorecido TEXT,
  valor DECIMAL(15,2) DEFAULT 0,
  vencimento DATE,
  informacoes TEXT,
  saldo_disponivel DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para Pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ata_id UUID REFERENCES public.atas(id) ON DELETE CASCADE NOT NULL,
  departamento TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  status TEXT CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'finalizado')) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.atas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir todas as operações (já que não há autenticação ainda)
CREATE POLICY "Allow all operations on atas" ON public.atas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualizar updated_at
CREATE TRIGGER handle_atas_updated_at
  BEFORE UPDATE ON public.atas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
