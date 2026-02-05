# Checklist de Setup - Sistema de Trámites

Sigue este checklist para asegurar que todo está configurado correctamente.

## Pre-Requisitos

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm instalado (`npm --version`)
- [ ] Git instalado (`git --version`)
- [ ] PostgreSQL instalado o acceso a BD en línea
- [ ] Cuenta de GitHub (para push del código)

## Paso 1: Obtener Credenciales

### Google OAuth

- [ ] Acceso a Google Cloud Console
- [ ] Crear proyecto
- [ ] Habilitar Google+ API
- [ ] Crear credenciales OAuth
  - [ ] Copiar **Client ID**
  - [ ] Copiar **Client Secret**
  - [ ] Agregar `http://localhost:3000/api/auth/callback/google` a URIs

### Mercado Pago

- [ ] Cuenta de Mercado Pago Argentina
- [ ] Ir a Credenciales
  - [ ] Copiar **Access Token** (comienza con `APP_USR_`)
  - [ ] Copiar **Public Key**

### PostgreSQL

- [ ] PostgreSQL instalado localmente
  - [ ] O cuenta en ElephantSQL
- [ ] Base de datos `tramites_db` creada
- [ ] Obtener **DATABASE_URL**

## Paso 2: Instalar Proyecto

- [ ] Abrir terminal en carpeta `tramites-app`
- [ ] Ejecutar `npm install`
- [ ] Esperar a que termine (puede tardar 2-3 min)

## Paso 3: Configurar Variables

- [ ] Copiar `.env.local.example` a `.env.local`
- [ ] Completar `GOOGLE_CLIENT_ID`
- [ ] Completar `GOOGLE_CLIENT_SECRET`
- [ ] Generar `NEXTAUTH_SECRET` (comando: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Completar `DATABASE_URL`
- [ ] Completar `MERCADOPAGO_ACCESS_TOKEN`
- [ ] Completar `MERCADOPAGO_PUBLIC_KEY`
- [ ] Verificar que `NEXTAUTH_URL=http://localhost:3000`

## Paso 4: Base de Datos

- [ ] Ejecutar `npx prisma migrate dev`
- [ ] Escribir nombre de migración: `init`
- [ ] Verificar que se crearon las tablas

## Paso 5: Ejecutar Localmente

- [ ] Ejecutar `npm run dev`
- [ ] Abrir http://localhost:3000
- [ ] Verificar que carga la página
- [ ] Click en "Iniciar sesión con Google"

## Paso 6: Probar Flujo Completo

### Usuario Normal

- [ ] Iniciar sesión con tu cuenta Google
- [ ] Ver home con 4 oficinas
- [ ] Click en una oficina
- [ ] Seleccionar un trámite
- [ ] Click "Continuar al pago"
- [ ] Ver página de pago de Mercado Pago
- [ ] (Opcional) Probar con tarjeta de test: `4111 1111 1111 1111`

### Ver Trámites

- [ ] Después del pago, ir a `/mis-tramites`
- [ ] Ver el trámite creado
- [ ] Ver estado "pendiente"
- [ ] Ver monto correcto

## Paso 7: Panel de Admin

- [ ] Ir a http://localhost:3000/admin
- [ ] Ver error 403 (No autorizado)
- [ ] Abrir Prisma Studio: `npx prisma studio`
- [ ] En tabla `users`, buscar tu usuario
- [ ] Cambiar `role` de `"usuario"` a `"admin"`
- [ ] Ir nuevamente a `/admin`
- [ ] Ver lista de trámites

### Panel Admin - Prueba

- [ ] Ver tabla con todos los trámites
- [ ] Click en "Ver detalles" de un trámite
- [ ] Cambiar estado a `"en_proceso"`
- [ ] Cambiar estado a `"completado"`
- [ ] Volver a `/mis-tramites` del usuario
- [ ] Verificar que el estado se actualizó

## Paso 8: Limpiar y Resetear

- [ ] (Opcional) Limpiar BD: `npx prisma migrate reset`
- [ ] Volverá a crear todo desde cero

## Pre-Deploy Checklist

- [ ] Código funciona localmente sin errores
- [ ] Todas las variables de entorno están configuradas
- [ ] Testeado flujo completo de usuario
- [ ] Testeado panel de admin
- [ ] Testeado pago de Mercado Pago
- [ ] No hay datos sensibles en código
- [ ] `.env.local` NO está en git (revisar `.gitignore`)

## Deploy en Render Checklist

### 1. Preparar GitHub

- [ ] Inicializar git: `git init`
- [ ] Agregar archivos: `git add .`
- [ ] Primer commit: `git commit -m "Initial commit"`
- [ ] Crear repositorio en GitHub (https://github.com/new)
- [ ] Copiar URL del repositorio
- [ ] Conectar: `git remote add origin https://...`
- [ ] Cambiar rama: `git branch -M main`
- [ ] Hacer push: `git push -u origin main`

### 2. En Render.com

- [ ] Crear cuenta en https://render.com
- [ ] Click "New" → "Web Service"
- [ ] Conectar GitHub
- [ ] Seleccionar repositorio
- [ ] Completar formulario:
  - [ ] Name: `tramites-app`
  - [ ] Runtime: `Node`
  - [ ] Region: `Frankfurt` (más cercana a Argentina)
  - [ ] Branch: `main`
  - [ ] Build command: `npm install && npx prisma migrate deploy && npm run build`
  - [ ] Start command: `npm start`

### 3. Variables de Entorno (Render)

En "Environment Variables", agregar:

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXTAUTH_SECRET` (generar nueva)
- [ ] `MERCADOPAGO_ACCESS_TOKEN`
- [ ] `MERCADOPAGO_PUBLIC_KEY`
- [ ] `NODE_VERSION=18`

### 4. Base de Datos (Render)

- [ ] Click "New" → "PostgreSQL"
- [ ] Name: `tramites-db`
- [ ] Copiar URL de conexión
- [ ] En Web Service, agregar variable: `DATABASE_URL` con la URL copiada

### 5. URLs Finales (Render)

- [ ] Actualizar `NEXTAUTH_URL` a `https://tu-app-nombre.onrender.com`
- [ ] Actualizar webhook de Mercado Pago a `https://tu-app-nombre.onrender.com/api/mercadopago/webhook`

### 6. Deploy

- [ ] Click "Create Web Service"
- [ ] Esperar a que termine el build (5-10 min)
- [ ] Ver URL en el panel
- [ ] Abrir y probar

## Post-Deploy

- [ ] Acceder a la URL de Render
- [ ] Probar login con Google
- [ ] Probar crear trámite
- [ ] Probar pago
- [ ] Verificar en admin
- [ ] Revisar logs en Render si hay errores

## Solucionar Problemas

Si algo no funciona:

- [ ] Revisar logs: En Render, ir a "Logs"
- [ ] Revisar variables de entorno: Settings → Environment
- [ ] Probar localmente primero
- [ ] Revisar que no haya cambios sin commitear
- [ ] Hacer nuevo push y redeploy

## Notas Finales

| Cosa | Valor |
|------|-------|
| Costo inicial | $0 (todo gratuito) |
| Dominio Render | `https://tu-app.onrender.com` |
| Dominio personalizado | +$10/mes (opcional) |
| Base de datos | Gratuita en Render |
| Mercado Pago | Comisión por transacción (~2%) |

---

Una vez completado todo, ¡tu app estará en línea! 🚀

¿Tienes dudas? Revisa los otros documentos:
- `GUIA_INICIO.md` - Explicación detallada
- `COMANDOS_RAPIDOS.md` - Comandos útiles
- `README.md` - Documentación técnica
