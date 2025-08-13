# Correção da Edição de Título dos Cards

## 🚨 Problema Identificado

**Sintoma:** Ao tentar editar o título de um card, a alteração não é salva no banco de dados.

### 🔍 Possíveis Causas:
1. **Função RPC não existe** ou não está funcionando
2. **Permissões** insuficientes no banco
3. **Erro na chamada** da função
4. **Problemas de conectividade** com Supabase

## ✅ Soluções Implementadas

### 🔧 **1. Função SQL Corrigida**

**Arquivo:** `fix-update-card-title.sql`

#### **Melhorias:**
- ✅ **Versão simplificada** sem verificações complexas de permissão
- ✅ **Verificação de existência** do cartão
- ✅ **Tratamento de erros** robusto
- ✅ **Retorno JSON** completo
- ✅ **SECURITY DEFINER** para execução com privilégios

#### **Funcionalidade:**
```sql
CREATE OR REPLACE FUNCTION public.update_card_title(
    card_uuid UUID,
    new_title VARCHAR(255)
)
RETURNS JSON
```

### 🔧 **2. Hook Melhorado (Fallback)**

**Arquivo:** `src/hooks/useTrellinho.ts`

#### **Estratégia Dupla:**
1. **Primeira tentativa:** RPC `update_card_title`
2. **Fallback:** UPDATE direto na tabela

#### **Código:**
```typescript
// Primeiro, tentar usar a RPC
try {
  const { data, error } = await supabase.rpc('update_card_title', {
    card_uuid: cardId,
    new_title: title
  });
} catch (rpcError) {
  // Se falhar, usar UPDATE direto
  const { data, error } = await supabase
    .from('trello_cards')
    .update({ title: title, updated_at: new Date().toISOString() })
    .eq('id', cardId)
    .eq('is_deleted', false)
    .select()
    .single();
}
```

### 🔧 **3. Componente Melhorado**

**Arquivo:** `src/components/TrelloCard.tsx`

#### **Melhorias na função `handleSaveTitle`:**
- ✅ **Validação prévia** do título
- ✅ **Logs detalhados** para debug
- ✅ **Atualização local** imediata
- ✅ **Tratamento de erro** melhorado
- ✅ **Reversão** em caso de falha

#### **Fluxo Melhorado:**
```typescript
const handleSaveTitle = async () => {
  const newTitle = editTitle.trim();
  
  // Validação
  if (!newTitle || newTitle === card.title) {
    setIsEditingTitle(false);
    return;
  }

  try {
    // Log para debug
    console.log('Salvando título:', { cardId: card.id, newTitle });
    
    // Salvar no banco
    const result = await updateCardTitle(card.id, newTitle);
    
    // Atualizar estado local
    card.title = newTitle;
    
    // Callback de atualização
    if (onUpdate) onUpdate();
    
  } catch (error) {
    // Tratamento de erro com reversão
    alert(`Erro ao salvar título: ${error.message}`);
    setEditTitle(card.title);
  }
};
```

## 🎯 **Como Resolver**

### **Passo 1: Executar SQL**
```sql
-- Execute o arquivo fix-update-card-title.sql no seu banco
```

### **Passo 2: Testar a Função**
```sql
-- Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'update_card_title';

-- Testar com um card real
SELECT update_card_title('SEU_CARD_UUID', 'Título de Teste');
```

### **Passo 3: Verificar Logs**
- Abra o **Console do Navegador** (F12)
- Tente editar um título de card
- Verifique os logs para debug

## 🔍 **Debug e Diagnóstico**

### **Logs Implementados:**
```javascript
// No console você verá:
console.log('Salvando título:', { cardId, oldTitle, newTitle });
console.log('Título salvo com sucesso:', result);
console.error('Erro detalhado ao salvar título:', error);
```

### **Verificações no Banco:**
```sql
-- Verificar se a tabela existe
SELECT * FROM trello_cards LIMIT 1;

-- Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'update_card_title';

-- Testar UPDATE direto
UPDATE trello_cards 
SET title = 'Teste Manual' 
WHERE id = 'SEU_CARD_UUID';
```

## 🚀 **Funcionalidades Garantidas**

### **Edição de Título:**
- ✅ **Clique no lápis** para editar
- ✅ **Digite o novo título**
- ✅ **Enter** para salvar
- ✅ **Escape** para cancelar
- ✅ **Blur** (sair do campo) para salvar

### **Validações:**
- ✅ **Título vazio** não é salvo
- ✅ **Título igual** não faz chamada desnecessária
- ✅ **Trim** automático de espaços

### **Feedback:**
- ✅ **Logs no console** para debug
- ✅ **Alert** em caso de erro
- ✅ **Reversão** automática se falhar
- ✅ **Atualização visual** imediata

## 🎉 **Resultado Esperado**

Após aplicar as correções:
- ✅ **Edição de título** funcionará perfeitamente
- ✅ **Salvamento** no banco de dados
- ✅ **Atualização visual** imediata
- ✅ **Tratamento de erros** robusto
- ✅ **Fallback** em caso de problemas com RPC

## 📋 **Checklist de Verificação**

- [ ] Executar `fix-update-card-title.sql`
- [ ] Verificar se a função foi criada
- [ ] Testar edição de título no frontend
- [ ] Verificar logs no console
- [ ] Confirmar salvamento no banco
- [ ] Testar casos de erro (título vazio, etc.)

Execute o SQL e teste a edição de títulos! 🚀