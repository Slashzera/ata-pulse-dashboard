# Correção da Imagem do Hospital no Login

## Problema Identificado
A imagem do Hospital São José não está aparecendo no fundo da tela de login.

## Solução Implementada

### 1. Estrutura de Background em Camadas
```jsx
{/* Background com imagem do hospital */}
<div 
  className="fixed inset-0 z-0"
  style={{
    backgroundImage: `url('/lovable-uploads/1a5507c1-31ce-49b2-b5b1-3a1e8960d42a.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}
/>

{/* Overlay azul */}
<div 
  className="fixed inset-0 z-10"
  style={{
    background: `linear-gradient(135deg, 
      rgba(30, 64, 175, 0.75) 0%, 
      rgba(59, 130, 246, 0.65) 25%, 
      rgba(96, 165, 250, 0.55) 50%, 
      rgba(147, 197, 253, 0.45) 75%, 
      rgba(219, 234, 254, 0.35) 100%
    )`
  }}
/>
```

### 2. Z-Index Organizado
- **z-0**: Imagem de fundo
- **z-10**: Overlay azul
- **z-20**: Conteúdo (card de login)

### 3. Para Usar a Imagem do Hospital São José

#### Opção 1: Salvar a imagem manualmente
1. Salve a imagem como `hospital-sao-jose.jpg` em `public/lovable-uploads/`
2. Altere a linha 78 do arquivo `src/pages/Auth.tsx`:
```jsx
backgroundImage: `url('/lovable-uploads/hospital-sao-jose.jpg')`,
```

#### Opção 2: Usar imagem existente (atual)
- Está usando a imagem `1a5507c1-31ce-49b2-b5b1-3a1e8960d42a.png` que já existe no sistema
- Funciona como fallback até a imagem do hospital ser adicionada

## Resultado
- Background em camadas separadas para melhor controle
- Overlay azul semitransparente mantém legibilidade
- Card de login com glassmorphism sobre a imagem
- Z-index organizado para evitar conflitos

## Próximos Passos
1. Adicionar a imagem real do Hospital São José
2. Testar em diferentes resoluções
3. Ajustar opacidade do overlay se necessário