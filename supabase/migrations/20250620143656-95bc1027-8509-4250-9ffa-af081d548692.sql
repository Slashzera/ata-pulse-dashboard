
-- Primeiro, vamos remover a constraint de foreign key existente e recriar com CASCADE
ALTER TABLE public.pedidos 
DROP CONSTRAINT IF EXISTS pedidos_ata_id_fkey;

-- Recriar a foreign key com CASCADE para permitir exclusão automática dos pedidos quando a ATA for excluída
ALTER TABLE public.pedidos 
ADD CONSTRAINT pedidos_ata_id_fkey 
FOREIGN KEY (ata_id) REFERENCES public.atas(id) 
ON DELETE CASCADE;

-- Adicionar trigger para atualizar updated_at automaticamente na tabela atas
DROP TRIGGER IF EXISTS handle_updated_at_atas ON public.atas;
CREATE TRIGGER handle_updated_at_atas
    BEFORE UPDATE ON public.atas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Adicionar trigger para atualizar updated_at automaticamente na tabela pedidos  
DROP TRIGGER IF EXISTS handle_updated_at_pedidos ON public.pedidos;
CREATE TRIGGER handle_updated_at_pedidos
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Garantir que os campos de valor aceitem NULL adequadamente para resolver problemas de input
ALTER TABLE public.atas 
ALTER COLUMN valor SET DEFAULT 0,
ALTER COLUMN saldo_disponivel SET DEFAULT 0;

-- Adicionar índices para melhorar performance nas consultas de relacionamento
CREATE INDEX IF NOT EXISTS idx_pedidos_ata_id ON public.pedidos(ata_id);
CREATE INDEX IF NOT EXISTS idx_atas_category ON public.atas(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
