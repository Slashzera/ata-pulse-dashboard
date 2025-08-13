# Sistema de Lixeira 🗑️

Este documento explica como usar o sistema de lixeira implementado no projeto.

## Visão Geral

O sistema de lixeira permite que itens (ATAs, Pedidos, TACs) sejam "excluídos" de forma segura, movendo-os para uma lixeira onde podem ser restaurados posteriormente, ao invés de serem excluídos permanentemente do banco de dados.

## Funcionalidades

### 1. Soft Delete (Exclusão Suave)
- Itens são marcados como deletados ao invés de serem removidos
- Mantém histórico completo para auditoria
- Permite restauração posterior

### 2. Lixeira Centralizada
- Interface unificada para gerenciar todos os itens deletados
- Visualização por tipo de item (ATA, Pedido, TAC)
- Informações de quando e por quem foi deletado

### 3. Restauração
- Restaurar itens individuais da lixeira
- Processo simples com um clique
- Log de auditoria da restauração

### 4. Exclusão Permanente
- Opção para excluir permanentemente itens da lixeira
- Confirmação dupla para evitar acidentes
- Log de auditoria da exclusão permanente

### 5. Limpeza Automática
- Remove automaticamente itens mais antigos que 30 dias
- Executada manualmente pelo administrador
- Relatório de quantos itens foram removidos

## Como Usar

### Executar o SQL de Criação

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o arquivo `create-trash-system.sql`

### Acessar a Lixeira

1. Navegue para `/trash` no seu aplicativo
2. Visualize todos os itens na lixeira
3. Use os botões "Restaurar" ou "Excluir Permanentemente"

### Excluir Itens

Quando excluir ATAs ou Pedidos, você verá duas opções:

1. **Mover para Lixeira (Recomendado)**
   - Exclusão segura e reversível
   - Item pode ser restaurado posteriormente
   - Não requer justificativa

2. **Exclusão Permanente**
   - Remove permanentemente do banco
   - Requer justificativa obrigatória
   - Não pode ser desfeita

### SQL Editor

Acesse `/sql-editor` para:
- Executar consultas personalizadas
- Visualizar dados da lixeira
- Testar funções do sistema
- Consultas predefinidas disponíveis

## Estrutura do Banco de Dados

### Colunas Adicionadas às Tabelas Existentes

```sql
-- Adicionado a todas as tabelas principais
deleted_at TIMESTAMP WITH TIME ZONE    -- Quando foi deletado
deleted_by UUID                        -- Quem deletou
is_deleted BOOLEAN DEFAULT FALSE       -- Se está deletado
```

### Nova Tabela: trash_log

```sql
CREATE TABLE trash_log (
    id UUID PRIMARY KEY,
    table_name TEXT,           -- Nome da tabela
    record_id UUID,            -- ID do registro
    action TEXT,               -- 'deleted', 'restored', 'permanently_deleted'
    user_id UUID,              -- Usuário que executou a ação
    deleted_at TIMESTAMP,      -- Quando foi deletado
    restored_at TIMESTAMP,     -- Quando foi restaurado
    metadata JSONB,            -- Dados adicionais
    created_at TIMESTAMP
);
```

### Nova View: trash_items

Unifica todos os itens deletados de diferentes tabelas em uma única visualização.

## Funções SQL Disponíveis

### move_to_trash(table_name, record_id, user_id)
Move um item para a lixeira (soft delete).

```sql
SELECT move_to_trash('atas', 'uuid-do-item');
```

### restore_from_trash(table_name, record_id, user_id)
Restaura um item da lixeira.

```sql
SELECT restore_from_trash('atas', 'uuid-do-item');
```

### permanently_delete(table_name, record_id, user_id)
Exclui permanentemente um item da lixeira.

```sql
SELECT permanently_delete('atas', 'uuid-do-item');
```

### cleanup_trash()
Remove itens da lixeira mais antigos que 30 dias.

```sql
SELECT cleanup_trash();
```

## Componentes React

### TrashManager
Componente principal para gerenciar a lixeira.

### useTrash Hook
Hook personalizado para operações de lixeira.

```typescript
const { moveToTrash, restoreFromTrash, permanentlyDelete, loading } = useTrash();
```

### TrashConfirmDialog
Dialog de confirmação para mover itens para lixeira.

### Componentes Atualizados
- `DeleteATADialog` - Agora oferece opção de lixeira
- `DeletePedidoDialog` - Agora oferece opção de lixeira

## Políticas de Segurança (RLS)

- Apenas usuários autenticados podem acessar a lixeira
- Logs de auditoria são protegidos
- Políticas atualizadas para considerar itens deletados

## Navegação

Adicione links para as novas páginas:

```typescript
// Lixeira
<Link to="/trash">Lixeira</Link>

// SQL Editor
<Link to="/sql-editor">SQL Editor</Link>
```

## Benefícios

1. **Segurança**: Reduz risco de perda acidental de dados
2. **Auditoria**: Histórico completo de todas as operações
3. **Flexibilidade**: Permite restauração quando necessário
4. **Conformidade**: Atende requisitos de auditoria e compliance
5. **Performance**: Soft delete é mais rápido que exclusão física

## Considerações

- Itens na lixeira ainda ocupam espaço no banco
- Limpeza automática deve ser executada periodicamente
- Backup regular continua sendo importante
- Monitore o crescimento da tabela de logs

## Troubleshooting

### Item não aparece na lixeira
- Verifique se `is_deleted = true`
- Confirme se a view `trash_items` está funcionando

### Erro ao restaurar
- Verifique permissões do usuário
- Confirme se o item ainda existe na lixeira

### Performance lenta
- Execute limpeza automática
- Considere arquivar logs antigos
- Verifique índices nas colunas de data

## Próximos Passos

1. Implementar notificações por email
2. Adicionar filtros avançados na lixeira
3. Relatórios de uso da lixeira
4. Integração com sistema de backup
5. API REST para operações de lixeira