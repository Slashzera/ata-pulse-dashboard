# 🔧 Correção do Erro de Drag and Drop dos Cartões

## 🚨 Problema Identificado
Quando você tenta arrastar um cartão para outra lista, aparece o erro:
```
Erro ao carregar quadro
relation "trello_activities" does not exist
```

## 🔍 Causa do Problema
A tabela `trello_activities` não existe no banco de dados. Esta tabela é essencial para:
- Registrar atividades de movimentação dos cartões
- Histórico de alterações
- Funcionamento do drag and drop

## ✅ Solução
Execute o arquivo SQL que cria a tabela faltante.

### 📁 Arquivo para Executar:
**`fix-missing-activities-table.sql`**

### 🚀 Como Corrigir:
1. Acesse o **Supabase Dashboard**
2. Vá no **SQL Editor**
3. Copie e cole o conteúdo do arquivo `fix-missing-activities-table.sql`
4. Clique em **Run**

### 🎯 O que o arquivo faz:
1. **Verifica** se a tabela já existe
2. **Cria** a tabela `trello_activities` com todas as colunas necessárias
3. **Adiciona** índices para performance
4. **Configura** políticas de segurança (RLS)
5. **Confirma** que tudo foi criado corretamente

## 📋 Estrutura da Tabela Criada
```sql
trello_activities:
- id (UUID, chave primária)
- card_id (referência ao cartão)
- user_id (referência ao usuário)
- action_type (tipo da ação: 'card_moved', 'due_date_set', etc.)
- action_data (dados da ação em JSON)
- created_at (data/hora da ação)
```

## 🔒 Segurança
A tabela inclui políticas RLS que garantem que:
- Usuários só veem atividades de cartões que têm acesso
- Usuários só podem criar atividades para cartões que podem editar

## ✅ Resultado Esperado
Após executar o arquivo:
- ✅ Drag and drop funcionará normalmente
- ✅ Cartões poderão ser movidos entre listas
- ✅ Atividades serão registradas no histórico
- ✅ Não haverá mais erro de "relation does not exist"

## 🧪 Como Testar
1. Execute o arquivo SQL
2. Acesse um quadro no Trellinho
3. Tente arrastar um cartão para outra lista
4. O cartão deve mover normalmente sem erro

## 📝 Observações
- Esta correção não afeta dados existentes
- É seguro executar mesmo se a tabela já existir
- A funcionalidade de drag and drop ficará 100% operacional

## 🆘 Se ainda houver problemas
Se após executar o arquivo ainda houver erros:
1. Verifique se o arquivo foi executado completamente
2. Confirme se apareceram as mensagens de sucesso
3. Recarregue a página do Trellinho
4. Teste novamente o drag and drop