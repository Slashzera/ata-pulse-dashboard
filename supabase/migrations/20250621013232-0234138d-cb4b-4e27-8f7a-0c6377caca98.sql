
-- Primeiro, remover a função existente
DROP FUNCTION IF EXISTS public.get_pedidos_with_ata_info();

-- Recriar a função com os tipos corretos
CREATE OR REPLACE FUNCTION public.get_pedidos_with_ata_info()
RETURNS TABLE(
  pedido_id UUID,
  departamento TEXT,
  descricao TEXT,
  valor NUMERIC,
  status TEXT,
  data_solicitacao DATE,
  observacoes TEXT,
  ata_id UUID,
  ata_numero TEXT,
  ata_category TEXT,
  ata_favorecido TEXT,
  ata_saldo_disponivel NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as pedido_id,
    p.departamento,
    p.descricao,
    p.valor,
    p.status,
    p.data_solicitacao,
    p.observacoes,
    p.ata_id, -- Retorna o ata_id correto do pedido
    a.n_ata as ata_numero,
    a.category as ata_category,
    a.favorecido as ata_favorecido,
    a.saldo_disponivel as ata_saldo_disponivel,
    p.created_at,
    p.updated_at
  FROM pedidos p
  INNER JOIN atas a ON p.ata_id = a.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna ata_category na tabela pedidos se não existir
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS ata_category TEXT;

-- Atualizar pedidos existentes com a categoria da ATA correspondente
UPDATE public.pedidos 
SET ata_category = atas.category
FROM public.atas 
WHERE pedidos.ata_id = atas.id 
AND pedidos.ata_category IS NULL;

-- Garantir que os triggers estão funcionando corretamente
-- Recriar os triggers para atualização de saldo das ATAs

-- Trigger para INSERT
DROP TRIGGER IF EXISTS trigger_update_ata_saldo_insert ON pedidos;
CREATE TRIGGER trigger_update_ata_saldo_insert
  AFTER INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_ata_saldo_on_pedido_insert();

-- Trigger para UPDATE
DROP TRIGGER IF EXISTS trigger_update_ata_saldo_update ON pedidos;
CREATE TRIGGER trigger_update_ata_saldo_update
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_ata_saldo_on_pedido_update();

-- Trigger para DELETE
DROP TRIGGER IF EXISTS trigger_update_ata_saldo_delete ON pedidos;
CREATE TRIGGER trigger_update_ata_saldo_delete
  AFTER DELETE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_ata_saldo_on_pedido_delete();

-- Trigger para validação de saldo
DROP TRIGGER IF EXISTS trigger_validate_pedido_saldo ON pedidos;
CREATE TRIGGER trigger_validate_pedido_saldo
  BEFORE INSERT OR UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION validate_pedido_saldo();

-- Garantir que as políticas RLS estão ativas
ALTER TABLE public.atas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Recriar políticas para permitir todas as operações (sistema sem autenticação específica por usuário)
DROP POLICY IF EXISTS "Allow all operations on atas" ON public.atas;
CREATE POLICY "Allow all operations on atas" ON public.atas 
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on pedidos" ON public.pedidos;
CREATE POLICY "Allow all operations on pedidos" ON public.pedidos 
FOR ALL USING (true) WITH CHECK (true);

-- Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_ata_id ON pedidos(ata_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_solicitacao ON pedidos(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_atas_category ON atas(category);
CREATE INDEX IF NOT EXISTS idx_atas_saldo_disponivel ON atas(saldo_disponivel);
