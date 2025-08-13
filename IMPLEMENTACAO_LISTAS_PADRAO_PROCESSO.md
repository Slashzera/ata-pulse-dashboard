# Implementação de Listas Padrão para Processos Administrativos

## Objetivo
Implementar a criação automática de listas (colunas) específicas quando um novo processo for cadastrado no sistema Trellinho, conforme solicitado.

## Listas Padrão Criadas Automaticamente
Quando um novo processo for cadastrado, o sistema criará automaticamente as seguintes listas na ordem especificada:

1. **Pendente de Cadastro** (posição 0)
2. **Em Análise pelo Processante** (posição 1)
3. **Confeccionando Autorização de Fornecimento** (posição 2)
4. **Fundo Municipal de Saúde - Aguardando Autorizo de Empenho** (posição 3)
5. **Empenho - Subsecretaria de Execução Orçamentária** (posição 4)
6. **Procuradoria-Geral do Município - Fazer Contrato** (posição 5)
7. **Processo Finalizado - Arquivado no Fundo Municipal de Saúde** (posição 6)
8. **Processo no Armário com Saldo Disponível - Aguardando Pedido Departamento** (posição 7)

## Implementação Técnica

### Arquivo SQL Criado
- `create-default-process-lists.sql` - Contém a modificação da função SQL

### Modificações Realizadas
1. **Função SQL Atualizada**: `create_board_with_type`
   - Modificada para criar as 8 listas específicas automaticamente
   - Mantém compatibilidade com o sistema existente
   - Preserva todas as funcionalidades anteriores

2. **Estrutura das Listas**:
   - Cada lista é criada com uma posição específica (0-7)
   - Títulos exatos conforme solicitado
   - Vinculadas automaticamente ao quadro criado

### Como Funciona
1. Usuário acessa o menu Trellinho
2. Clica em "Cadastrar Novo Processo"
3. Preenche os dados do processo (tipo, número, responsável, etc.)
4. Ao confirmar a criação:
   - O quadro é criado com os dados informados
   - **Automaticamente** são criadas as 8 listas padrão
   - O usuário é redirecionado para o quadro com as listas já prontas

### Compatibilidade
- ✅ Mantém compatibilidade total com o sistema existente
- ✅ Não afeta quadros já criados
- ✅ Funciona com todos os tipos de processo
- ✅ Interface do usuário permanece inalterada

## Instalação

### Passo 1: Executar o SQL
Execute o arquivo `create-default-process-lists.sql` no banco de dados Supabase:

```sql
-- O arquivo contém toda a lógica necessária
-- Basta executar no SQL Editor do Supabase
```

### Passo 2: Verificar Funcionamento
1. Acesse o sistema Trellinho
2. Crie um novo processo
3. Verifique se as 8 listas foram criadas automaticamente

## Resultado Esperado
Após a implementação, toda vez que um usuário cadastrar um novo processo no Trellinho, o sistema criará automaticamente um quadro com as 8 listas específicas do fluxo administrativo, exatamente como mostrado na imagem de exemplo fornecida.

## Observações Importantes
- As listas são criadas na ordem correta (0-7)
- Os nomes são exatamente como solicitado
- O sistema continua funcionando normalmente para todas as outras funcionalidades
- Não há impacto em processos já existentes

## Suporte
Se houver algum problema na implementação ou necessidade de ajustes, os arquivos podem ser modificados conforme necessário.