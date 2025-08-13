
-- Adicionar coluna category na tabela atas
ALTER TABLE public.atas 
ADD COLUMN category TEXT NOT NULL DEFAULT 'normal' 
CHECK (category IN ('normal', 'adesao', 'aquisicao', 'antigo'));

-- Atualizar ATAs existentes para ter a categoria 'normal' como padrão
UPDATE public.atas SET category = 'normal' WHERE category IS NULL;
