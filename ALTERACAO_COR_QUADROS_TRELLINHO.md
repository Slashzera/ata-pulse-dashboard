# Alteração de Cor dos Quadros no Trellinho

## ✅ Funcionalidade Implementada

### 🎨 **Seletor de Cores para Quadros**

Implementei a funcionalidade de alterar a cor dos quadros diretamente no menu de 3 pontos:

#### 📍 **Localização:**
- **Arquivo:** `src/components/Trellinho.tsx`
- **Componente:** `BoardCard`
- **Acesso:** Menu de 3 pontos → "Alterar cor"

#### 🔧 **Funcionalidades:**

##### **1. Nova Opção no Menu** (ícone paleta)
- ✅ **Posição:** Entre "Editar título" e "Copiar quadro"
- ✅ **Ícone:** `Palette` (paleta de cores)
- ✅ **Texto:** "Alterar cor"
- ✅ **Hover:** Fundo cinza claro

##### **2. Modal de Seleção de Cores**
- ✅ **Overlay:** Fundo escuro semi-transparente
- ✅ **Modal:** Fundo branco centralizado
- ✅ **Título:** "Alterar Cor do Quadro"
- ✅ **Grid:** 4 colunas de cores
- ✅ **Botão fechar:** X no canto superior direito

##### **3. Paleta de Cores Disponíveis**
- ✅ **12 cores** pré-definidas
- ✅ **Cores variadas:** Azul, Verde, Laranja, Vermelho, etc.
- ✅ **Hover effect:** Escala 105%
- ✅ **Indicador:** Cor atual marcada com círculo

## 🎨 **Cores Disponíveis**

### **Paleta Completa:**
```typescript
const availableColors = [
  { name: 'Azul', value: '#0079bf' },
  { name: 'Verde', value: '#61bd4f' },
  { name: 'Laranja', value: '#ff9f1a' },
  { name: 'Vermelho', value: '#eb5a46' },
  { name: 'Roxo', value: '#c377e0' },
  { name: 'Rosa', value: '#ff78cb' },
  { name: 'Verde Claro', value: '#51e898' },
  { name: 'Azul Claro', value: '#00c2e0' },
  { name: 'Cinza', value: '#c4c9cc' },
  { name: 'Amarelo', value: '#f2d600' },
  { name: 'Marrom', value: '#8b4513' },
  { name: 'Azul Escuro', value: '#344563' }
];
```

### **Visualização:**
```
┌─────┬─────┬─────┬─────┐
│ 🔵  │ 🟢  │ 🟠  │ 🔴  │
│ 🟣  │ 🩷  │ 🟢  │ 🔵  │
│ ⚪  │ 🟡  │ 🟤  │ 🔵  │
└─────┴─────┴─────┴─────┘
```

## 🔧 **Interface do Modal**

### **Layout:**
```
┌─────────────────────────────────┐
│ Alterar Cor do Quadro        ✕ │
├─────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│ │ 🔵│ │ 🟢│ │ 🟠│ │ 🔴│       │
│ └───┘ └───┘ └───┘ └───┘       │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│ │ 🟣│ │ 🩷│ │ 🟢│ │ 🔵│       │
│ └───┘ └───┘ └───┘ └───┘       │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│ │ ⚪│ │ 🟡│ │ 🟤│ │ 🔵│       │
│ └───┘ └───┘ └───┘ └───┘       │
├─────────────────────────────────┤
│                    [Cancelar]   │
└─────────────────────────────────┘
```

### **Elementos:**
- ✅ **Título:** "Alterar Cor do Quadro"
- ✅ **Grid 4x3:** 12 cores organizadas
- ✅ **Botões de cor:** 64px de altura
- ✅ **Indicador:** Círculo branco na cor atual
- ✅ **Botão cancelar:** Canto inferior direito
- ✅ **Fechar (X):** Canto superior direito

## 🔧 **Implementação Técnica**

### **Estados Adicionados:**
```typescript
const [showColorPicker, setShowColorPicker] = useState(false);
```

### **Função de Alteração:**
```typescript
const handleColorSelect = async (color: string) => {
  try {
    await updateBoard(board.id, { background_color: color });
    setShowColorPicker(false);
    onUpdate();
  } catch (error) {
    console.error('Erro ao alterar cor do quadro:', error);
    alert('Erro ao alterar cor. Tente novamente.');
  }
};
```

### **Hook Utilizado:**
```typescript
const { updateBoard } = useTrellinho();
```

## 🎯 **Fluxos de Uso**

### **Para Alterar Cor do Quadro:**
1. **Hover** sobre o quadro
2. Clique nos **3 pontos** (canto inferior direito)
3. Clique em **"Alterar cor"** (ícone paleta)
4. **Modal** de cores abre
5. **Clique** na cor desejada
6. **Cor é aplicada** automaticamente
7. **Modal fecha** automaticamente

### **Para Cancelar:**
- **Clique em "Cancelar"** no modal
- **Clique no X** no canto superior direito
- **Clique fora** do modal (overlay)

## 🎨 **Recursos Visuais**

### **Indicador de Cor Atual:**
- ✅ **Círculo branco** na cor selecionada
- ✅ **Ponto preto** no centro do círculo
- ✅ **Borda destacada** na cor atual

### **Hover Effects:**
- ✅ **Escala 105%** ao passar o mouse
- ✅ **Borda cinza** no hover
- ✅ **Transição suave** de 200ms

### **Responsividade:**
- ✅ **Grid adaptável** em dispositivos móveis
- ✅ **Modal centralizado** em todas as telas
- ✅ **Margens adequadas** (16px nas laterais)

## 🚀 **Benefícios da Implementação**

### **Usabilidade:**
- ✅ **Acesso rápido** via menu contextual
- ✅ **Visualização clara** das cores disponíveis
- ✅ **Indicador** da cor atual
- ✅ **Aplicação instantânea** da nova cor

### **Interface:**
- ✅ **Modal elegante** e profissional
- ✅ **Grid organizado** de cores
- ✅ **Feedback visual** claro
- ✅ **Múltiplas formas** de cancelar

### **Funcionalidade:**
- ✅ **12 cores** pré-definidas
- ✅ **Atualização** em tempo real
- ✅ **Persistência** no banco de dados
- ✅ **Tratamento de erros** robusto

## 📋 **Menu Atualizado**

### **Estrutura do Menu:**
```
┌─────────────────────────┐
│ ✏️  Editar título       │
│ 🎨  Alterar cor         │
│ 📋  Copiar quadro       │
├─────────────────────────┤
│ 🗑️  Excluir quadro      │
└─────────────────────────┘
```

### **Ordem das Opções:**
1. **Editar título** - Modificar nome
2. **Alterar cor** - Mudar aparência
3. **Copiar quadro** - Duplicar (futuro)
4. **Excluir quadro** - Remover (destrutivo)

## 🎉 **Status da Implementação**

- ✅ **Opção no menu** adicionada
- ✅ **Modal de cores** funcionando
- ✅ **12 cores** disponíveis
- ✅ **Indicador** da cor atual
- ✅ **Hover effects** implementados
- ✅ **Atualização** em tempo real
- ✅ **Tratamento de erros** ativo
- ✅ **Responsividade** garantida
- ✅ **Múltiplas formas** de cancelar

## 🔧 **Personalização Futura**

### **Possíveis Melhorias:**
- ✅ **Cores customizadas** com color picker
- ✅ **Gradientes** como opção
- ✅ **Imagens de fundo** personalizadas
- ✅ **Temas** pré-definidos
- ✅ **Cores favoritas** do usuário

A funcionalidade de alterar cor dos quadros está completamente implementada e funcional! 🎨🚀