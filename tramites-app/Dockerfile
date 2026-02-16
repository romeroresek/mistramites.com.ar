FROM node:20-alpine

# Instalar dependencias necesarias para Prisma en Alpine
RUN apk add --no-cache openssl libc6-compat

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

# Variables dummy para el build (Next.js las necesita para compilar)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
ENV SUPABASE_SERVICE_ROLE_KEY="dummy-key"
ENV NEXTAUTH_SECRET="dummy-secret"
ENV NEXTAUTH_URL="http://localhost:3000"

# Build de Next.js
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Comando de inicio (usa variables de Railway en runtime)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
