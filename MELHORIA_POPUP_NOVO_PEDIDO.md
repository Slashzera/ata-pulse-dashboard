# Melhoria: Exibição do Processo Administrativo no Popup "Novo Pedido"

## Funcionalidade Implementada

Adicionado o número do processo administrativo na seleção de ATAs no popup "Novo Pedido", facilitando a identificação das ATAs pelos usuários.

## Melhorias Implementadas

### 1. Dropdown de Seleção de ATA
**Antes:**
```
ATA 001/2024 - Empresa XYZ (Saldo: R$ 50.000,00)
```

**Depois:**
```
ATA 001/2024 - Proc. 2024.001.123 - Empresa XYZ (Saldo: R$ 50.000,00)
```

### 2. Informações da ATA Selecionada
**Antes:**
- Número da ATA
- Favorecido  
- Saldo Disponível

**Depois:**
- Número da ATA
- **Processo Administrativo** (NOVO)
- Favorecido
- Saldo Disponível

## Formato de Exibição

### No Dropdown:
```
ATA [número] - Proc. [processo_adm] - [favorecido] (Saldo: [valor])
```

### Na Seção de Informações:
- **Número da ATA:** [número]
- **Processo Administrativo:** [processo_adm]
- **Favorecido:** [favorecido]
- **Saldo Disponível:** [valor]

## Tratamento de Dados

- **Campo presente:** Exibe o número do processo administrativo
- **Campo ausente/nulo:** Exibe "N/A"
- **Formatação:** Mantém consistência visual com outros campos

## Benefícios

✅ **Identificação mais precisa** - Usuários podem identificar ATAs pelo processo administrativo
✅ **Informação completa** - Todos os dados relevantes visíveis na seleção
✅ **Melhor usabilidade** - Facilita encontrar a ATA correta
✅ **Consistência** - Alinhado com outros relatórios do sistema

## Exemplo Prático

### Cenário:
Usuário precisa criar pedido para ATA relacionada ao processo "2024.001.456"

### Antes:
- Precisava memorizar número da ATA ou favorecido
- Informação do processo não estava visível

### Depois:
- Pode buscar diretamente pelo processo administrativo
- Informação completa na primeira visualização

## Arquivos Modificados

- `src/components/CreatePedidoDialog.tsx` - Componente do popup "Novo Pedido"

## Status
✅ **Implementado e Ativo**

## Teste
1. Clique em "Novo Pedido" em qualquer seção
2. Abra o dropdown "Selecione uma ATA"
3. Observe que agora aparece: "ATA [número] - Proc. [processo] - [favorecido] (Saldo: [valor])"
4. Selecione uma ATA e veja as informações detalhadas incluindo o processo administrativo

A melhoria está ativa em todos os popups de "Novo Pedido" do sistema!