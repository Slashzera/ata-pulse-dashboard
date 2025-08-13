# Debug: Processo Administrativo

## 🔍 Verificações para Debug

### **1. Verificar Console do Navegador**
Quando gerar o relatório, abra DevTools (F12) → Console e procure por:
```
ATA Debug - Processo ADM: 90013/2024
ATA Debug - Processo ADM: 90014/2024
```

### **2. Verificar Dados das ATAs**
Execute no SQL Editor do Supabase:
```sql
-- Ver todas as ATAs com processo administrativo
SELECT 
  n_ata,
  processo_adm,
  favorecido,
  objeto
FROM atas 
WHERE favorecido ILIKE '%especifarma%'
ORDER BY n_ata;
```

### **3. Verificar se Campo Existe**
```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'atas' 
AND column_name = 'processo_adm';
```

## 🔧 Correções Aplicadas

### **Estrutura da Tabela Forçada:**
- ✅ **Bordas pretas**: Para garantir visibilidade
- ✅ **Larguras fixas**: Cada coluna com percentual definido
- ✅ **Cabeçalho destacado**: "PROCESSO ADM" em maiúsculo
- ✅ **Fallback**: "SEM PROCESSO" se campo vazio
- ✅ **Debug melhorado**: Log específico do processo_adm

### **CSS Otimizado:**
- ✅ **Layout fixo**: `table-layout: fixed`
- ✅ **Bordas fortes**: `border: 1px solid #000`
- ✅ **Quebra de palavra**: `word-wrap: break-word`

## 🧪 Teste Passo a Passo

### **1. Verificar Dados no Banco:**
```sql
SELECT n_ata, processo_adm FROM atas LIMIT 5;
```

### **2. Gerar Relatório com Debug:**
1. Abra DevTools (F12) → Console
2. Header → Exportar PDF
3. Especifarma → Gerar PDF
4. Veja logs no console

### **3. Verificar HTML Gerado:**
1. No relatório aberto, clique F12
2. Vá para Elements/Elementos
3. Procure por `<th>PROCESSO ADM</th>`
4. Verifique se existe `<td>90013/2024</td>`

## 📊 Estrutura Esperada

### **Cabeçalho:**
```html
<th style="width: 15%; background-color: #dbeafe;">PROCESSO ADM</th>
```

### **Dados:**
```html
<td style="background-color: #eff6ff; font-weight: bold;">90013/2024</td>
```

## 🚨 Possíveis Problemas

### **1. Campo Vazio no Banco:**
- Se `processo_adm` for NULL ou vazio
- Deve mostrar "SEM PROCESSO"

### **2. Campo Não Existe:**
- Se coluna não existir na tabela
- Deve mostrar "SEM PROCESSO"

### **3. Problema de Renderização:**
- HTML pode estar sendo cortado
- Verificar no DevTools se HTML está completo

## 🎯 Resultado Esperado

### **Console Debug:**
```
ATA Debug - Processo ADM: 90013/2024
ATA Debug - Processo ADM: 90014/2024
ATA Debug - Processo ADM: 90015/2024
```

### **Tabela no PDF:**
```
┌──────────┬─────────────────┬─────────┬─────────────────┬─────────────┬──────────┬─────────┬────────────┐
│ Nº ATA   │ PROCESSO ADM    │ Pregão  │ Objeto          │ Favorecido  │ Valor    │ Saldo   │ Vencimento │
├──────────┼─────────────────┼─────────┼─────────────────┼─────────────┼──────────┼─────────┼────────────┤
│ 006/2025 │ 90013/2024      │ 90013/  │ Fornecimento... │ Especifarma │ R$ 205k  │ R$ 181k │ 09/02/2026 │
└──────────┴─────────────────┴─────────┴─────────────────┴─────────────┴──────────┴─────────┴────────────┘
```

## 🚀 Próximos Passos

1. **Execute o SQL** para verificar dados
2. **Gere relatório** com DevTools aberto
3. **Verifique console** para logs de debug
4. **Inspecione HTML** se necessário
5. **Reporte resultado** do debug