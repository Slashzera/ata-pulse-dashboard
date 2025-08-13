# Instalação do Drag and Drop - Trellinho

## 📦 Dependência Necessária

Para implementar o drag and drop, você precisa instalar a biblioteca `@dnd-kit`:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

ou

```bash
yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## ✅ Funcionalidades que Serão Implementadas

### Drag and Drop:
- ✅ **Arrastar cartões** entre listas
- ✅ **Reordenar cartões** dentro da mesma lista
- ✅ **Feedback visual** durante o arraste
- ✅ **Animações suaves** de transição
- ✅ **Acessibilidade** com teclado

### Características:
- ✅ **Touch support**: Funciona em dispositivos móveis
- ✅ **Auto-scroll**: Scroll automático ao arrastar
- ✅ **Collision detection**: Detecção inteligente de colisão
- ✅ **Keyboard navigation**: Navegação por teclado

## 🚀 Após Instalar a Dependência

Execute os comandos acima e depois me informe que instalou. Eu criarei:

1. **DragDropContext** - Contexto para drag and drop
2. **DraggableCard** - Cartão arrastável
3. **DroppableList** - Lista que aceita drops
4. **Integração completa** com o sistema existente

## 📋 Estrutura que Será Criada

```
src/components/
├── dnd/
│   ├── DragDropContext.tsx     # Contexto principal
│   ├── DraggableCard.tsx       # Cartão arrastável
│   ├── DroppableList.tsx       # Lista drop zone
│   └── DragOverlay.tsx         # Overlay durante drag
├── TrelloBoard.tsx             # Atualizado com DnD
├── TrelloList.tsx              # Atualizado com DnD
└── TrelloCard.tsx              # Atualizado com DnD
```

## 🎯 Resultado Final

Após a implementação, você poderá:
- **Arrastar cartões** entre as 4 listas (A fazer, Em andamento, Em análise, Concluído)
- **Reordenar cartões** dentro da mesma lista
- **Ver feedback visual** durante o arraste
- **Usar teclado** para mover cartões (acessibilidade)

## ⚠️ Importante

Instale a dependência primeiro:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Depois me confirme que instalou para eu criar os componentes! 🚀