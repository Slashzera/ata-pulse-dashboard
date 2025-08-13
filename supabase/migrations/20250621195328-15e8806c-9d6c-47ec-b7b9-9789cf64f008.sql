
-- Atualizar a coluna category na tabela atas para garantir que tenha os valores corretos
UPDATE atas SET category = 'normal' WHERE category IS NULL OR category = '';

-- Atualizar a coluna ata_category na tabela pedidos para garantir consistência
UPDATE pedidos SET ata_category = (
  SELECT a.category 
  FROM atas a 
  WHERE a.id = pedidos.ata_id
) WHERE ata_category IS NULL OR ata_category = '';

-- Criar trigger para manter ata_category sincronizado
CREATE OR REPLACE FUNCTION sync_pedido_ata_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT, buscar a categoria da ATA
  IF TG_OP = 'INSERT' THEN
    SELECT category INTO NEW.ata_category
    FROM atas
    WHERE id = NEW.ata_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger
DROP TRIGGER IF EXISTS trigger_sync_pedido_ata_category ON pedidos;
CREATE TRIGGER trigger_sync_pedido_ata_category
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION sync_pedido_ata_category();

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_atas_category ON atas(category);
CREATE INDEX IF NOT EXISTS idx_pedidos_ata_category ON pedidos(ata_category);
CREATE INDEX IF NOT EXISTS idx_pedidos_ata_id ON pedidos(ata_id);
