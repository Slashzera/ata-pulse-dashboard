
-- Adicionar campo para número do processo na tabela processos_pastas
ALTER TABLE public.processos_pastas 
ADD COLUMN IF NOT EXISTS numero_processo TEXT;

-- Criar índice para melhorar performance nas buscas por número de processo
CREATE INDEX IF NOT EXISTS idx_processos_pastas_numero_processo 
ON public.processos_pastas(numero_processo);

-- Criar índice de busca textual para nome das pastas
CREATE INDEX IF NOT EXISTS idx_processos_pastas_nome_search 
ON public.processos_pastas USING gin(to_tsvector('portuguese', nome));
