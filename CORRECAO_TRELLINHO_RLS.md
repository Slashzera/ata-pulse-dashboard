# Correção dos Problemas de RLS do Trellinho

## 🚨 Problema Identificado
O erro "new row violates row-level security policy" indica que as políticas RLS estão muito restritivas e impedem a criação/leitura de dados.

## ✅ Solução Implementada

### 1. Execute o SQL de Correção
Execute o arquivo `fix-trellinho-permissions.sql` no seu banco Supabase:

```sql
-- Este arquivo contém:
-- 1. Remoção das políticas restritivas
-- 2. Criação de políticas mais permissivas
-- 3. Funções simplificadas para consultas
```

### 2. Políticas Corrigidas
As novas políticas permitem que usuários autenticados:
- ✅ Criem, leiam, atualizem e excluam seus próprios quadros
- ✅ Gerenciem listas e cartões sem restrições complexas
- ✅ Acessem todas as funcionalidades do Trellinho

### 3. Hook Atualizado
O `useTrellinho.ts` foi atualizado com:
- ✅ **Fallback automático**: Se as funções RPC falharem, usa consultas diretas
- ✅ **Tratamento de erros**: Melhor handling de problemas de permissão
- ✅ **Validação de usuário**: Verifica autenticação antes das operações

## 🔧 Arquivos Modificados

### Novos Arquivos:
- `fix-trellinho-permissions.sql` - Correção das políticas RLS

### Arquivos Atualizados:
- `src/hooks/useTrellinho.ts` - Fallback para consultas diretas

## 📋 Passos para Resolver

### 1. Execute o SQL de Correção:
```sql
-- Copie e execute todo o conteúdo de fix-trellinho-permissions.sql
```

### 2. Teste o Sistema:
1. Acesse o Trellinho pelo menu principal
2. Tente criar um novo quadro
3. Adicione listas e cartões
4. Verifique se não há mais erros de RLS

### 3. Se Ainda Houver Problemas:
Execute este SQL adicional para desabilitar temporariamente o RLS:

```sql
-- APENAS PARA TESTE - NÃO RECOMENDADO EM PRODUÇÃO
ALTER TABLE trello_boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE trello_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE trello_cards DISABLE ROW LEVEL SECURITY;
```

## 🛡️ Segurança

### Políticas Atuais:
- **Permissivas mas seguras**: Usuários só acessam dados próprios
- **Baseadas em autenticação**: Requer `auth.uid() IS NOT NULL`
- **Preparadas para expansão**: Fácil adicionar controle de membros depois

### Próximos Passos de Segurança:
1. Implementar controle granular de membros
2. Adicionar permissões por função (owner/admin/member)
3. Criar auditoria de ações

## 🎯 Resultado Esperado

Após executar a correção:
- ✅ Criação de quadros funcionando
- ✅ Listas e cartões sem erros de RLS
- ✅ Interface totalmente funcional
- ✅ Dados seguros por usuário

## 📞 Suporte

Se ainda houver problemas:
1. Verifique se o usuário está autenticado
2. Confirme que o SQL foi executado completamente
3. Teste com um usuário diferente
4. Verifique os logs do Supabase para erros específicos

O sistema deve funcionar perfeitamente após essas correções! 🚀