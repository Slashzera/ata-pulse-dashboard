-- Execute este SQL no Supabase para adicionar o campo password_hash
-- à tabela pending_users

ALTER TABLE pending_users 
ADD COLUMN password_hash TEXT;

-- Atualizar comentário da tabela
COMMENT ON TABLE pending_users IS 'Tabela para armazenar usuários aguardando aprovação do administrador. As senhas são armazenadas temporariamente até aprovação.';

COMMENT ON COLUMN pending_users.password_hash IS 'Senha temporária do usuário (será removida após aprovação ou rejeição)'; 