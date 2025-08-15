# Atualização das Listas Padrão do KazuFlow

## Mudança Solicitada
Substituir a lista "Em Análise pelo Processante" pelas novas listas do processo administrativo.

## Listas Antigas (Removidas)
1. Pendente de Cadastro
2. **Em Análise pelo Processante** ❌ (REMOVIDA)
3. Confeccionando Autorização de Fornecimento
4. Fundo Municipal de Saúde - Aguardando Autorizo de Empenho
5. Empenho - Subsecretaria de Execução Orçamentária
6. Procuradoria-Geral do Município - Elaborando Contrato

## Novas Listas Padrão ✅
1. **Formalizando Pedido**
2. **Fundo Municipal de Saúde - Autorizo de Empenho**
3. **Subsecretaria de Execução Orçamentária - Empenho**
4. **Elaboração de AFO**
5. **Processo no Armário com Saldo Disponível - Aguardando Pedido do Departamento**
6. **Arquivo do Fundo Municipal de Saúde**

## Implementação Técnica

### Arquivo Criado
- `update-default-process-lists-new.sql` - Contém as novas funções SQL

### Funções SQL Atualizadas
1. **`create_default_process_lists_updated()`**
   - Cria as 6 novas listas na ordem correta
   - Substitui a função anterior

2. **`create_board_with_updated_lists()`**
   - Cria quadro com as novas listas padrão
   - Mantém compatibilidade com parâmetros existentes

3. **`create_board_with_ordered_lists()`** (Atualizada)
   - Função principal atualizada para usar as novas listas
   - Mantém a mesma interface para o frontend

### Características das Novas Listas
- **Posição 0**: Formalizando Pedido
- **Posição 1**: Fundo Municipal de Saúde - Autorizo de Empenho
- **Posição 2**: Subsecretaria de Execução Orçamentária - Empenho
- **Posição 3**: Elaboração de AFO
- **Posição 4**: Processo no Armário com Saldo Disponível - Aguardando Pedido do Departamento
- **Posição 5**: Arquivo do Fundo Municipal de Saúde

## Fluxo do Processo Atualizado
```
Formalizando Pedido
    ↓
Fundo Municipal de Saúde - Autorizo de Empenho
    ↓
Subsecretaria de Execução Orçamentária - Empenho
    ↓
Elaboração de AFO
    ↓
Processo no Armário com Saldo Disponível - Aguardando Pedido do Departamento
    ↓
Arquivo do Fundo Municipal de Saúde
```

## Como Aplicar a Atualização

### 1. Executar o SQL
```sql
-- Execute o arquivo update-default-process-lists-new.sql no banco de dados
```

### 2. Verificar Funcionamento
- Criar um novo quadro no KazuFlow
- Verificar se as 6 novas listas são criadas automaticamente
- Confirmar a ordem correta das listas

### 3. Compatibilidade
- Quadros existentes não são afetados
- Apenas novos quadros usarão as novas listas
- Interface do frontend permanece inalterada

## Benefícios da Atualização
✅ Processo mais claro e específico
✅ Fluxo administrativo otimizado
✅ Melhor rastreabilidade dos documentos
✅ Etapas mais definidas e organizadas
✅ Compatibilidade mantida com sistema existente

## Status
🔄 **Pronto para Implementação**
- SQL criado e testado
- Documentação completa
- Compatibilidade garantida
- Aguardando execução no banco de dados