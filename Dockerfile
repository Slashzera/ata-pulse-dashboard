# -------------------------
# Etapa de build
# -------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o código
COPY . .

# Builda o Vite (gera /dist)
RUN npm run build

# -------------------------
# Etapa de execução
# -------------------------
FROM node:20-alpine

WORKDIR /app

# Copia apenas o resultado do build
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Instala apenas dependências de produção (se precisar de libs em runtime)
RUN npm install --omit=dev

EXPOSE 3000

# Usa o preview do Vite como servidor
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
