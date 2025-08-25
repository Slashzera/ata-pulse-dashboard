# Correção da ATA 085/2025 Invisível

## Problema Identificado
A ATA 085/2025 foi criada mas não aparece na lista de ATAs, mesmo não havendo duplicidade real.

## Possíveis Causas
1. **ATA marcada como deletada**: A ATA pode ter sido criada mas marcada como `is_deleted = true`
2. **Cache do React Query**: Os dados podem estar em cache e não atualizados
3. **Filtro de busca**: A query pode estar filtrando incorretamente
4. **Problema de sincronização**: Delay entre criação e exibição

## Soluções Implementadas

### 1. Scripts SQL de Diagnóstico e Correção
- `diagnose-ata-085-2025.sql` - Diagnóstico completo
- `fix-ata-085-visibility.sql` - Correção direta

**Execute um dos scripts para:**
- Verificar se a ATA existe
- Restaurar se estiver deletada
- Criar se não existir

### 2. Melhorias no Hook useAtas
```typescript
// Busca mais inclusiva
.or('is_deleted.is.null,is_deleted.eq.false')

// Logs de debug específicos para ATA 085/2025
const ata085 = data?.find(ata => ata.n_ata === '085/2025');
if (ata085) {
  console.log('ATA 085/2025 encontrada:', ata085);
} else {
  console.log('ATA 085/2025 NÃO encontrada na lista');
}

// Configurações para refresh mais frequente
staleTime: 0,
refetchOnWindowFocus: true,
```

### 3. Componente de Debug Temporário
Adicionado `DebugATAs.tsx` com botões para:
- **Forçar Atualização**: Invalida cache e recarrega ATAs
- **Buscar ATA 085/2025**: Busca específica no banco
- **Restaurar ATA 085/2025**: Restaura se estiver deletada

## Como Resolver o Problema

### Opção 1: Usar o Componente de Debug
1. Acesse a tela de ATAs Normais
2. Use o componente laranja "Debug ATAs" no topo
3. Clique em "Buscar ATA 085/2025" para verificar status
4. Se necessário, clique em "Restaurar ATA 085/2025"
5. Clique em "Forçar Atualização" para refresh

### Opção 2: Executar Script SQL
1. Acesse o banco PostgreSQL
2. Execute o script `fix-ata-085-visibility.sql`
3. Recarregue a página do sistema

### Opção 3: Verificação Manual
```sql
-- Verificar se ATA existe
SELECT * FROM atas WHERE n_ata = '085/2025';

-- Restaurar se deletada
UPDATE atas 
SET is_deleted = false 
WHERE n_ata = '085/2025' AND is_deleted = true;
```

## Funcionalidades Adicionadas

### Debug Component
- ✅ Botão para forçar refresh das ATAs
- ✅ Busca específica da ATA 085/2025
- ✅ Restauração automática se deletada
- ✅ Feedback visual do status

### Melhorias no Hook
- ✅ Query mais inclusiva (inclui is_deleted null)
- ✅ Logs específicos para debug
- ✅ Refresh automático mais frequente
- ✅ Debug específico para ATA 085/2025

### Scripts SQL
- ✅ Diagnóstico completo da situação
- ✅ Restauração automática se deletada
- ✅ Criação se não existir
- ✅ Verificação de integridade

## Arquivos Criados/Modificados

- `src/components/DebugATAs.tsx` - Componente de debug temporário
- `src/components/ModernATAsView.tsx` - Adicionado componente debug
- `src/hooks/useAtas.ts` - Melhorado query e logs
- `diagnose-ata-085-2025.sql` - Script de diagnóstico
- `fix-ata-085-visibility.sql` - Script de correção

## Status
🔧 **EM CORREÇÃO** - Use o componente de debug ou execute o script SQL para resolver.

## Remoção do Debug
Após resolver o problema, remover:
1. Import do `DebugATAs` no `ModernATAsView.tsx`
2. Componente `<DebugATAs />` da renderização
3. Arquivo `src/components/DebugATAs.tsx`
4. Reverter configurações de cache no `useAtas` se necessário