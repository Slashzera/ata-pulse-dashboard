
-- Adicionar campo parent_id para criar hierarquia de pastas
ALTER TABLE public.processos_pastas 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.processos_pastas(id) ON DELETE CASCADE;

-- Criar índice para melhorar performance nas consultas hierárquicas
CREATE INDEX IF NOT EXISTS idx_processos_pastas_parent_id 
ON public.processos_pastas(parent_id);

-- Adicionar índice composto para busca por usuário e pasta pai
CREATE INDEX IF NOT EXISTS idx_processos_pastas_user_parent 
ON public.processos_pastas(user_id, parent_id);
