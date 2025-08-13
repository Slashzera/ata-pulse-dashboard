
-- Adicionar coluna data_solicitacao na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN data_solicitacao DATE;

-- Atualizar registros existentes com a data de criação
UPDATE public.pedidos 
SET data_solicitacao = created_at::date 
WHERE data_solicitacao IS NULL;
