# Correção Definitiva do Cursor Piscando nos Botões "Novo"

## Problema Identificado
O cursor estava piscando quando passava sobre os botões "Novo" devido a conflitos entre elementos sobrepostos com diferentes z-index e transições CSS complexas.

## Causa Raiz
- **Elementos decorativos interferindo**: Os elementos `absolute` (círculos decorativos) estavam interferindo com os eventos do mouse
- **Conflitos de z-index**: Múltiplas camadas com z-index causando instabilidade no cursor
- **Transições complexas**: Animações de scale e múltiplas propriedades causando conflitos

## Soluções Implementadas

### 1. Adição de `pointer-events-none`
```css
pointer-events-none
```
- Aplicado a todos os elementos decorativos absolutos
- Impede que elementos de fundo interfiram com os botões

### 2. Z-index Específico para Botões
```css
relative z-20
```
- Botões agora têm z-index mais alto (z-20)
- Garante que ficam sempre acima dos elementos decorativos

### 3. Simplificação das Transições
```css
transition-colors duration-200
```
- Removido `transition-all` que causava conflitos
- Focado apenas em `transition-colors` para suavidade
- Reduzido `hover:scale-105` que causava instabilidade

### 4. Elementos Decorativos Corrigidos
```html
<div className="absolute ... pointer-events-none"></div>
```
- Todos os 3 elementos decorativos por card agora têm `pointer-events-none`
- Mantém o visual sem interferir na funcionalidade

## Alterações por Card

### ✅ Nova ATA
- Elementos decorativos: `pointer-events-none`
- Botão: `relative z-20` + `transition-colors duration-200`

### ✅ Nova Adesão  
- Elementos decorativos: `pointer-events-none`
- Botão: `relative z-20` + `transition-colors duration-200`

### ✅ Contratos Antigos
- Elementos decorativos: `pointer-events-none`
- Botão: `relative z-20` + `transition-colors duration-200`

### ✅ Aquisição Global
- Elementos decorativos: `pointer-events-none`
- Botão: `relative z-20` + `transition-colors duration-200`

## Resultado Final
- ✅ **Cursor não pisca mais**: Elementos decorativos não interferem
- ✅ **Botões funcionam perfeitamente**: Z-index correto garante clicabilidade
- ✅ **Transições suaves**: Animações otimizadas sem conflitos
- ✅ **Visual mantido**: Design moderno preservado
- ✅ **Performance melhorada**: Menos transições complexas

## Arquivos Modificados
- `src/components/PedidosSection.tsx`

## Data da Correção
14 de agosto de 2025

## Teste de Validação
- [x] Cursor não pisca ao passar sobre os botões
- [x] Botões respondem ao clique corretamente
- [x] Modal de criação abre normalmente
- [x] Animações funcionam suavemente
- [x] Design visual mantido