-- Adicionar campo password_hash à tabela pending_users para armazenar temporariamente a senha
-- até que o usuário seja aprovado

-- Adicionar coluna password_hash
ALTER TABLE pending_users 
ADD COLUMN password_hash TEXT;

-- Atualizar comentário da tabela
COMMENT ON TABLE pending_users IS 'Tabela para armazenar usuários aguardando aprovação do administrador. As senhas são armazenadas temporariamente até aprovação.';

COMMENT ON COLUMN pending_users.password_hash IS 'Senha temporária do usuário (será removida após aprovação ou rejeição)'; 