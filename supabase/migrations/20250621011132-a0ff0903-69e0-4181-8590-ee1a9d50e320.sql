
-- Adicionar índices para melhor performance nas consultas de pedidos e ATAs
CREATE INDEX IF NOT EXISTS idx_pedidos_ata_id ON pedidos(ata_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_solicitacao ON pedidos(data_solicitacao);
CREATE INDEX IF NOT EXISTS idx_atas_category ON atas(category);
CREATE INDEX IF NOT EXISTS idx_atas_saldo_disponivel ON atas(saldo_disponivel);

-- Função para atualizar saldo da ATA quando pedido é criado
CREATE OR REPLACE FUNCTION update_ata_saldo_on_pedido_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se há saldo suficiente
  IF (SELECT saldo_disponivel FROM atas WHERE id = NEW.ata_id) < NEW.valor THEN
    RAISE EXCEPTION 'Saldo insuficiente na ATA selecionada';
  END IF;
  
  -- Atualizar saldo da ATA
  UPDATE atas 
  SET saldo_disponivel = saldo_disponivel - NEW.valor,
      updated_at = now()
  WHERE id = NEW.ata_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para ajustar saldo da ATA quando pedido é atualizado
CREATE OR REPLACE FUNCTION update_ata_saldo_on_pedido_update()
RETURNS TRIGGER AS $$
DECLARE
  diferenca_valor NUMERIC;
  saldo_atual NUMERIC;
BEGIN
  -- Calcular diferença de valor
  diferenca_valor := NEW.valor - OLD.valor;
  
  -- Se houve mudança no valor
  IF diferenca_valor != 0 THEN
    -- Verificar saldo atual da ATA
    SELECT saldo_disponivel INTO saldo_atual FROM atas WHERE id = NEW.ata_id;
    
    -- Se o valor aumentou, verificar se há saldo suficiente
    IF diferenca_valor > 0 AND saldo_atual < diferenca_valor THEN
      RAISE EXCEPTION 'Saldo insuficiente na ATA para o novo valor do pedido';
    END IF;
    
    -- Atualizar saldo da ATA
    UPDATE atas 
    SET saldo_disponivel = saldo_disponivel - diferenca_valor,
        updated_at = now()
    WHERE id = NEW.ata_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para devolver saldo da ATA quando pedido é excluído
CREATE OR REPLACE FUNCTION update_ata_saldo_on_pedido_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Devolver valor para o saldo da ATA
  UPDATE atas 
  SET saldo_disponivel = saldo_disponivel + OLD.valor,
      updated_at = now()
  WHERE id = OLD.ata_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para automatizar a atualização de saldos
DROP TRIGGER IF EXISTS trigger_update_ata_saldo_insert ON pedidos;
CREATE TRIGGER trigger_update_ata_saldo_insert
  AFTER INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_ata_saldo_on_pedido_insert();

DROP TRIGGER IF EXISTS trigger_update_ata_saldo_update ON pedidos;
CREATE TRIGGER trigger_update_ata_saldo_update
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_ata_saldo_on_pedido_update();

DROP TRIGGER IF EXISTS trigger_update_ata_saldo_delete ON pedidos;
CREATE TRIGGER trigger_update_ata_saldo_delete
  AFTER DELETE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_ata_saldo_on_pedido_delete();

-- Função para validar saldo antes de inserir/atualizar pedido
CREATE OR REPLACE FUNCTION validate_pedido_saldo()
RETURNS TRIGGER AS $$
DECLARE
  saldo_atual NUMERIC;
  diferenca_valor NUMERIC := 0;
BEGIN
  -- Para INSERT, diferença é o valor completo
  IF TG_OP = 'INSERT' THEN
    diferenca_valor := NEW.valor;
  -- Para UPDATE, diferença é a mudança no valor
  ELSIF TG_OP = 'UPDATE' THEN
    diferenca_valor := NEW.valor - OLD.valor;
  END IF;
  
  -- Verificar saldo atual se há mudança positiva no valor
  IF diferenca_valor > 0 THEN
    SELECT saldo_disponivel INTO saldo_atual FROM atas WHERE id = NEW.ata_id;
    
    IF saldo_atual < diferenca_valor THEN
      RAISE EXCEPTION 'Saldo insuficiente na ATA. Saldo disponível: R$ %, valor solicitado: R$ %', 
        saldo_atual, diferenca_valor;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de validação antes da inserção/atualização
DROP TRIGGER IF EXISTS trigger_validate_pedido_saldo ON pedidos;
CREATE TRIGGER trigger_validate_pedido_saldo
  BEFORE INSERT OR UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION validate_pedido_saldo();

-- Atualizar timestamps automaticamente
DROP TRIGGER IF EXISTS trigger_pedidos_updated_at ON pedidos;
CREATE TRIGGER trigger_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS trigger_atas_updated_at ON atas;
CREATE TRIGGER trigger_atas_updated_at
  BEFORE UPDATE ON atas
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Função para obter estatísticas de ATAs por categoria
CREATE OR REPLACE FUNCTION get_atas_stats_by_category()
RETURNS TABLE(
  category TEXT,
  total_atas BIGINT,
  total_valor NUMERIC,
  total_saldo_disponivel NUMERIC,
  atas_sem_saldo BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.category,
    COUNT(*)::BIGINT as total_atas,
    COALESCE(SUM(a.valor), 0) as total_valor,
    COALESCE(SUM(a.saldo_disponivel), 0) as total_saldo_disponivel,
    COUNT(CASE WHEN a.saldo_disponivel = 0 THEN 1 END)::BIGINT as atas_sem_saldo
  FROM atas a
  GROUP BY a.category
  ORDER BY a.category;
END;
$$ LANGUAGE plpgsql;

-- Função para obter pedidos com informações da ATA
CREATE OR REPLACE FUNCTION get_pedidos_with_ata_info()
RETURNS TABLE(
  pedido_id UUID,
  departamento TEXT,
  descricao TEXT,
  valor NUMERIC,
  status TEXT,
  data_solicitacao DATE,
  ata_numero TEXT,
  ata_category TEXT,
  ata_favorecido TEXT,
  ata_saldo_disponivel NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE
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
    a.n_ata as ata_numero,
    a.category as ata_category,
    a.favorecido as ata_favorecido,
    a.saldo_disponivel as ata_saldo_disponivel,
    p.created_at
  FROM pedidos p
  INNER JOIN atas a ON p.ata_id = a.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
