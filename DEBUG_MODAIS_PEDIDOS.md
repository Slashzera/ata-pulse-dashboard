# Debug dos Modais da Seção Pedidos

## Problema Reportado
Usuário não consegue clicar em nenhum modal da tela de pedidos após as alterações.

## Logs de Debug Adicionados

### 1. Função handleViewPedidoDetails
```javascript
const handleViewPedidoDetails = (pedido: Pedido) => {
  console.log('Abrindo detalhes do pedido:', pedido.id);
  setSelectedPedido(pedido);
  setIsPedidoDetailsOpen(true);
};
```

### 2. Função handleEditPedido
```javascript
const handleEditPedido = (pedido: Pedido) => {
  console.log('Editando pedido:', pedido.id);
  setEditingPedido(pedido);
  setIsEditPedidoDialogOpen(true);
};
```

### 3. Função handleDeletePedido
```javascript
const handleDeletePedido = (pedido: Pedido) => {
  console.log('Excluindo pedido:', pedido.id);
  setDeletingPedido(pedido);
  setIsDeletePedidoDialogOpen(true);
};
```

### 4. Função handleCreatePedidoForCategory
```javascript
const handleCreatePedidoForCategory = (category: string) => {
  console.log('Criando pedido para categoria:', category);
  const categoryAtasWithSaldo = getCategoryAtasForPedido(category).filter(ata => ata.saldo_disponivel > 0);
  
  if (categoryAtasWithSaldo.length === 0) {
    console.log('Sem ATAs com saldo para categoria:', category);
    setAlertCategory(getCategoryName(category));
    setShowNoSaldoAlert(true);
    setTimeout(() => setShowNoSaldoAlert(false), 5000);
    return;
  }
  
  console.log('Abrindo modal de criação para categoria:', category);
  setSelectedCategoryForNewPedido(category);
  setIsCreatePedidoDialogOpen(true);
};
```

## Como Testar

### 1. Abra o Console do Navegador
- Pressione F12 ou Ctrl+Shift+I
- Vá para a aba "Console"

### 2. Teste os Botões
- **Botões "Novo"**: Devem mostrar logs de criação
- **Botão "Ver Detalhes"**: Deve mostrar log de abertura de detalhes
- **Botão "Editar"**: Deve mostrar log de edição
- **Botão "Excluir"**: Deve mostrar log de exclusão

### 3. Verifique os Logs
Se os logs aparecerem no console, significa que:
- ✅ Os event handlers estão funcionando
- ✅ Os botões estão clicáveis
- ❌ O problema pode estar nos componentes de modal

Se os logs NÃO aparecerem, significa que:
- ❌ Os botões não estão funcionando
- ❌ Há algum problema de CSS ou JavaScript bloqueando os cliques

## Possíveis Causas

### 1. CSS Bloqueando Cliques
- Elementos sobrepostos com z-index alto
- `pointer-events: none` aplicado incorretamente
- Elementos absolutos cobrindo os botões

### 2. JavaScript Errors
- Erros no console impedindo execução
- Problemas com imports de componentes
- Estados não inicializados corretamente

### 3. Componentes de Modal
- Componentes PedidoDetailsDialog, EditPedidoDialog, etc. com problemas
- Props não sendo passadas corretamente
- Estados de abertura não funcionando

## Próximos Passos
1. Testar com os logs de debug
2. Verificar se aparecem mensagens no console
3. Identificar se o problema é nos botões ou nos modais
4. Corrigir baseado nos resultados dos logs

## Arquivos Modificados
- `src/components/PedidosSection.tsx`

## Data do Debug
14 de agosto de 2025