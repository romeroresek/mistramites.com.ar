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

# Agregar variable dummy para el build (Next.js la necesita para compilar)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Build de Next.js
RUN npm run build

# Limpiar variable dummy (se usará la real en runtime)
ENV DATABASE_URL=""

# Exponer puerto
EXPOSE 3000

# Comando de inicio (usa variables de Railway en runtime)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
