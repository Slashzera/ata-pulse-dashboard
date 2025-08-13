
-- Remover a constraint única existente no número da ATA (se existir)
ALTER TABLE public.atas DROP CONSTRAINT IF EXISTS atas_n_ata_key;

-- Criar um índice único composto que permite o mesmo n_ata em categorias diferentes
CREATE UNIQUE INDEX IF NOT EXISTS atas_n_ata_category_unique 
ON public.atas (n_ata, category);

-- Adicionar comentário para documentar a mudança
COMMENT ON INDEX atas_n_ata_category_unique IS 
'Permite o mesmo número de ATA em categorias diferentes (normal, adesao, antigo, aquisicao)';
