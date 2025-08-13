-- Teste de sintaxe das funções
-- Execute este arquivo primeiro para testar se a sintaxe está correta

-- Função de teste simples
CREATE OR REPLACE FUNCTION test_syntax()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN 'Sintaxe OK!';
END;
$$;

-- Testar a função
SELECT test_syntax();

-- Remover função de teste
DROP FUNCTION test_syntax();