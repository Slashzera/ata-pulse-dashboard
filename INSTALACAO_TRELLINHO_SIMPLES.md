# Instalação Simples do Sistema Trellinho

## 🚨 Problema Resolvido
Para evitar erros de sintaxe, dividi o SQL em 2 partes menores e mais seguras.

## 📋 Instalação em 2 Passos

### Passo 1: Criar Tabelas
Execute primeiro o arquivo: **`trellinho-tables-only.sql`**

```sql
-- Este arquivo contém apenas:
-- - 3 novas tabelas
-- - Índices
-- - Políticas RLS básicas
```

### Passo 2: Criar Funções
Depois execute o arquivo: **`trellinho-functions-only.sql`**

```sql
-- Este arquivo contém apenas:
-- - 5 funções SQL
-- - Sem estruturas complexas
```

## ✅ Vantagens desta Abordagem

### Mais Seguro:
- ✅ Arquivos menores = menos chance de erro
- ✅ Execução em etapas = fácil debug
- ✅ Sintaxe simplificada = mais compatível

### Fácil Teste:
- ✅ Teste as tabelas primeiro
- ✅ Depois teste as funções
- ✅ Rollback mais fácil se necessário

## 🎯 Ordem de Execução

### 1. Primeiro Execute:
```sql
-- Arquivo: trellinho-tables-only.sql
-- Cria: tabelas, índices, políticas
```

### 2. Depois Execute:
```sql
-- Arquivo: trellinho-functions-only.sql  
-- Cria: funções para datas, etiquetas, movimentação, notificações
```

### 3. Teste:
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'trello_%';

-- Verificar se as funções foram criadas
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%card%';
```

## 🚀 Após a Instalação

### Funcionalidades Disponíveis:
- ✅ **Datas de entrega**: Definir e receber lembretes
- ✅ **Etiquetas**: Criar e gerenciar etiquetas coloridas
- ✅ **Movimentação**: Mover cartões entre listas/quadros
- ✅ **Notificações**: Central de notificações no header
- ✅ **Histórico**: Log de todas as atividades

### Como Testar:
1. Abra o Trellinho pelo menu principal
2. Crie um quadro e cartão
3. Abra o cartão e teste as novas funcionalidades
4. Verifique o ícone de notificações no header

## ⚠️ Se Ainda Houver Erro

### Opção 1: Execute Função por Função
Copie cada função individualmente do arquivo `trellinho-functions-only.sql` e execute uma por vez.

### Opção 2: Use o SQL Editor do Sistema
1. Vá no menu principal → SQL Editor
2. Cole o conteúdo de cada arquivo
3. Execute linha por linha

### Opção 3: Versão Mínima
Se ainda houver problemas, posso criar uma versão ainda mais básica com apenas as funcionalidades essenciais.

## 📞 Suporte

Se continuar com problemas:
1. Execute apenas o `trellinho-tables-only.sql` primeiro
2. Teste se as tabelas foram criadas
3. Me informe qual linha específica está dando erro
4. Posso criar uma versão ainda mais simples

## ✅ Resultado Final

Após executar os 2 arquivos, você terá:
- Sistema completo de datas e lembretes
- Gerenciador de etiquetas visual
- Movimentação de cartões entre listas
- Central de notificações
- Todas as funcionalidades do Trellinho funcionando

O sistema está dividido para máxima compatibilidade! 🎉