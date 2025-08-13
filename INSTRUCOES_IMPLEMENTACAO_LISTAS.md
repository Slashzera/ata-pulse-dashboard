# 🚀 Instruções para Implementar Listas Padrão nos Processos

## ✅ O que foi implementado
Agora quando você cadastrar um novo processo no Trellinho, serão criadas automaticamente 8 listas com os nomes exatos que você solicitou:

1. Pendente de Cadastro
2. Em Análise pelo Processante  
3. Confeccionando Autorização de Fornecimento
4. Fundo Municipal de Saúde - Aguardando Autorizo de Empenho
5. Empenho - Subsecretaria de Execução Orçamentária
6. Procuradoria-Geral do Município - Fazer Contrato
7. Processo Finalizado - Arquivado no Fundo Municipal de Saúde
8. Processo no Armário com Saldo Disponível - Aguardando Pedido Departamento

## 📋 Como instalar

### Passo 1: Executar o SQL
1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `fix-function-conflict.sql`
4. Clique em **Run** para executar

**Nota:** Este arquivo resolve conflitos de versões anteriores da função e cria a versão correta.

### Passo 2: Testar (Opcional)
1. No SQL Editor, execute o arquivo `test-default-process-lists.sql`
2. Descomente a seção de teste prático se quiser ver funcionando
3. Verifique se aparece "✅ TESTE PASSOU"

### Passo 3: Usar no Sistema
1. Acesse o sistema Trellinho
2. Clique em **"Cadastrar Novo Processo"**
3. Preencha os dados normalmente
4. Ao criar o processo, as 8 listas aparecerão automaticamente!

## 🎯 Resultado Esperado
Depois da instalação, toda vez que você criar um novo processo, verá exatamente isso:

```
┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
│ Pendente de Cadastro    │ │ Em Análise pelo         │ │ Confeccionando          │
│                         │ │ Processante             │ │ Autorização de          │
│ + Adicionar um cartão   │ │                         │ │ Fornecimento            │
└─────────────────────────┘ │ + Adicionar um cartão   │ │                         │
                            └─────────────────────────┘ │ + Adicionar um cartão   │
                                                        └─────────────────────────┘
```
E assim por diante com todas as 8 listas!

## ⚠️ Importante
- ✅ Não afeta processos já existentes
- ✅ Funciona com todos os tipos de processo
- ✅ Interface continua igual
- ✅ Todas as outras funcionalidades continuam normais

## 🆘 Se algo der errado
1. Verifique se executou o SQL corretamente
2. Execute o arquivo de teste para diagnosticar
3. As listas antigas (A fazer, Em andamento, etc.) foram substituídas pelas novas

## 📞 Pronto para usar!
Após executar o SQL, a funcionalidade já estará ativa. Teste criando um novo processo e veja as listas aparecerem automaticamente! 🎉