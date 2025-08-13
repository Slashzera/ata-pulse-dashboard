# Instalação do Sistema de Lixeira

## Passo a Passo para Implementação

### 1. Executar o SQL no Supabase

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor** no menu lateral
4. **IMPORTANTE**: Primeiro teste a sintaxe executando o arquivo `test-syntax.sql`
5. Se o teste passar, copie todo o conteúdo do arquivo `create-trash-system.sql`
6. Cole no editor SQL
7. Clique em **Run** para executar

**Nota**: O arquivo SQL foi corrigido para usar a sintaxe correta do PostgreSQL (`$$` ao invés de `$`).

### 2. Verificar a Instalação

Execute esta consulta para verificar se tudo foi criado corretamente:

```sql
-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('atas', 'pedidos') 
AND column_name IN ('deleted_at', 'deleted_by', 'is_deleted');

-- Verificar se as funções foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('move_to_trash', 'restore_from_trash', 'permanently_delete', 'cleanup_trash');

-- Verificar se a view foi criada
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'trash_items';
```

### 3. Testar o Sistema

Execute estes comandos para testar as funcionalidades:

```sql
-- 1. Listar itens na lixeira (deve estar vazio inicialmente)
SELECT * FROM trash_items;

-- 2. Testar movendo um item para lixeira (substitua o UUID por um real)
-- SELECT move_to_trash('atas', 'seu-uuid-aqui');

-- 3. Verificar se apareceu na lixeira
SELECT * FROM trash_items;

-- 4. Testar restauração (substitua o UUID)
-- SELECT restore_from_trash('atas', 'seu-uuid-aqui');

-- 5. Verificar logs de auditoria
SELECT * FROM trash_log ORDER BY created_at DESC LIMIT 5;
```

### 4. Configurar Permissões (se necessário)

Se você tiver problemas de permissão, execute:

```sql
-- Garantir que as políticas RLS estão corretas
ALTER TABLE trash_log ENABLE ROW LEVEL SECURITY;

-- Recriar políticas se necessário
DROP POLICY IF EXISTS "Allow authenticated users to view trash log" ON trash_log;
CREATE POLICY "Allow authenticated users to view trash log" 
    ON trash_log FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert trash log" ON trash_log;
CREATE POLICY "Allow authenticated users to insert trash log" 
    ON trash_log FOR INSERT TO authenticated WITH CHECK (true);
```

### 5. Atualizar o Frontend

Os componentes React já foram criados. Certifique-se de que:

1. ✅ `src/components/TrashManager.tsx` - Componente principal
2. ✅ `src/hooks/useTrash.ts` - Hook personalizado
3. ✅ `src/components/TrashConfirmDialog.tsx` - Dialog de confirmação
4. ✅ `src/pages/Trash.tsx` - Página da lixeira
5. ✅ `src/components/SQLEditor.tsx` - Editor SQL
6. ✅ `src/pages/SQLEditor.tsx` - Página do editor
7. ✅ Componentes atualizados: `DeleteATADialog.tsx`, `DeletePedidoDialog.tsx`

### 6. Adicionar Navegação

Adicione links no seu menu principal para acessar:

```typescript
// Exemplo de como adicionar no seu componente de navegação
<Link to="/trash" className="nav-link">
  <Trash2 className="h-4 w-4" />
  Lixeira
</Link>

<Link to="/sql-editor" className="nav-link">
  <Database className="h-4 w-4" />
  SQL Editor
</Link>
```

### 7. Configurar Limpeza Automática (Opcional)

Para automatizar a limpeza da lixeira, você pode:

1. **Criar um cron job no Supabase Edge Functions:**

```typescript
// supabase/functions/cleanup-trash/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase.rpc('cleanup_trash')
  
  return new Response(
    JSON.stringify({ deleted_count: data, error }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

2. **Ou configurar um cron job no seu servidor:**

```bash
# Executar limpeza todo domingo às 2h da manhã
0 2 * * 0 curl -X POST https://seu-projeto.supabase.co/functions/v1/cleanup-trash
```

### 8. Monitoramento

Adicione estas consultas aos seus dashboards de monitoramento:

```sql
-- Quantidade de itens na lixeira por tabela
SELECT 
    table_name,
    COUNT(*) as items_in_trash
FROM trash_items 
GROUP BY table_name;

-- Atividade da lixeira nos últimos 7 dias
SELECT 
    DATE(created_at) as date,
    action,
    COUNT(*) as count
FROM trash_log 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), action
ORDER BY date DESC;

-- Itens mais antigos na lixeira
SELECT 
    table_name,
    title,
    deleted_at,
    EXTRACT(days FROM NOW() - deleted_at) as days_in_trash
FROM trash_items 
ORDER BY deleted_at ASC
LIMIT 10;
```

## Solução de Problemas

### Erro: "relation does not exist"
- Verifique se o SQL foi executado completamente
- Confirme se você está no schema correto (public)

### Erro: "permission denied"
- Verifique as políticas RLS
- Confirme se o usuário tem permissões adequadas

### Componentes não aparecem
- Verifique se todas as dependências estão instaladas
- Confirme se as rotas foram adicionadas ao App.tsx

### Performance lenta
- Execute `ANALYZE` nas tabelas após a migração
- Verifique se os índices foram criados corretamente

## Contato

Se encontrar problemas durante a instalação, verifique:

1. Logs do Supabase Dashboard
2. Console do navegador para erros JavaScript
3. Network tab para erros de API
4. Documentação do Supabase para troubleshooting

## Próximos Passos

Após a instalação bem-sucedida:

1. Teste todas as funcionalidades
2. Configure backup regular
3. Treine usuários no novo sistema
4. Configure monitoramento
5. Planeje limpeza automática