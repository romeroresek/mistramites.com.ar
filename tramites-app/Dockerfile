FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar cliente Prisma
RUN npx prisma generate

# Copiar resto del código
COPY . .

# Build de Next.js
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
