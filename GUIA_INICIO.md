# Guía de Inicio - Sistema de Trámites Online

## Bienvenida

Te he creado un **proyecto completo** de un sistema de trámites para Argentina con:
- ✅ Autenticación con Google
- ✅ 4 oficinas diferentes (Propiedad, Personas, Apostillas, Catastro)
- ✅ Panel de usuario para ver estado de trámites
- ✅ Panel de administrador
- ✅ Integración con Mercado Pago para pagos
- ✅ Base de datos PostgreSQL
- ✅ Todo listo para deploy en Render

---

## Paso 1: Obtener Credenciales

### A. Google OAuth Credentials

1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto (o usa uno existente)
3. Ve a **"APIs y servicios"** → **"Biblioteca"**
4. Busca **"Google+ API"** y habilítala
5. Ve a **"Credenciales"**
6. Clic en **"Crear credenciales"** → **"ID de cliente OAuth"**
7. Selecciona **"Aplicación web"**
8. En **"URIs autorizados de redireccionamiento"**, agrega:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/signin/google`
9. Copia el **Client ID** y **Client Secret**

### B. Mercado Pago Credentials

1. Ve a https://www.mercadopago.com.ar
2. Inicia sesión o crea una cuenta
3. Ve a **"Configuración"** → **"Integraciones"** → **"Credenciales"**
4. Copia tu **Access Token** (con prefijo `APP_USR_`)
5. También copia tu **Public Key**

---

## Paso 2: Instalar dependencias

Abre la terminal en la carpeta `tramites-app` y ejecuta:

```bash
cd tramites-app
npm install
```

Esto instalará todas las librerías necesarias (Next.js, Prisma, NextAuth, etc.)

---

## Paso 3: Configurar PostgreSQL Localmente

### Opción A: Windows (Recomendado)

1. Descarga PostgreSQL desde https://www.postgresql.org/download/windows/
2. Durante la instalación:
   - Contraseña para `postgres`: pon la que quieras (ej: `admin123`)
   - Puerto: `5432` (por defecto)
   - Locale: Spanish (Argentina)
3. Una vez instalado, abre **pgAdmin** (viene incluido)
4. Crea una nueva base de datos:
   - Click derecho en **"Databases"** → **"Create"** → **"Database"**
   - Nombre: `tramites_db`

### Opción B: Usar PostgreSQL Online (más fácil para empezar)

1. Ve a https://www.elephantsql.com (tier gratuito)
2. Crea una cuenta
3. Crea una nueva instancia
4. Copia la URL de conexión

---

## Paso 4: Configurar variables de entorno

1. Abre `tramites-app/.env.local.example`
2. Reemplaza los valores con tus credenciales:

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_SECRET=genera_una_cadena_larga_y_aleatoria

# Base de datos (ejemplo para PostgreSQL local)
# DATABASE_URL=postgresql://postgres:admin123@localhost:5432/tramites_db

# O si usas ElephantSQL:
# DATABASE_URL=postgresql://usuario:contrasena@servidor.elephantsql.com:5432/tramites_db

# Mercado Pago (Argentina)
MERCADOPAGO_ACCESS_TOKEN=APP_USR_tu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui

# URLs
NEXTAUTH_URL=http://localhost:3000
```

3. Guarda el archivo como `.env.local` (sin `.example`)

---

## Paso 5: Crear la base de datos

Ejecuta este comando para crear las tablas:

```bash
npx prisma migrate dev
```

Te pedirá un nombre para la migración, escribe: `init`

---

## Paso 6: Ejecutar localmente

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## Paso 7: Crear usuario admin

Por defecto, los usuarios nuevos tienen rol `usuario`. Para crear un **admin**:

### Opción A: Editar en pgAdmin

1. Abre pgAdmin
2. Ve a tu base de datos `tramites_db`
3. Ve a **Tables** → **users**
4. Edita el usuario y cambia `role` de `usuario` a `admin`

### Opción B: Usar CLI

```bash
npx prisma studio
```

Se abrirá una interfaz visual donde puedes editar directamente.

---

## Flujo de Prueba Local

### 1. Usuario Normal

```
1. Abre http://localhost:3000
2. Click "Iniciar sesión con Google"
3. Selecciona tu cuenta de Google
4. Selecciona una oficina (ej: Registro Propiedad)
5. Selecciona un trámite
6. Click "Continuar al pago"
7. Te llevará a Mercado Pago (en modo prueba)
```

### 2. Administrador

```
1. Abre http://localhost:3000/admin
2. Verás tabla con todos los trámites
3. Click en "Ver detalles" de un trámite
4. Cambia el estado (pendiente → en_proceso → completado)
```

---

## Deploy en Render (Producción)

Cuando tengas todo funcionando localmente:

### 1. Subir código a GitHub

```bash
git init
git add .
git commit -m "Initial commit - tramites app"
git branch -M main
git remote add origin https://github.com/tu-usuario/tramites-app.git
git push -u origin main
```

### 2. Crear cuenta en Render

Ve a https://render.com y crea una cuenta (es gratis)

### 3. Conectar GitHub

1. Clic en **"New"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name**: `tramites-app`
   - **Runtime**: `Node`
   - **Build command**: `npm install && npx prisma migrate deploy && npm run build`
   - **Start command**: `npm start`

### 4. Agregar variables de entorno

En Render, ve a **"Environment"** y agrega todas las variables de `.env.local`

### 5. Crear base de datos PostgreSQL

1. En Render, clic en **"New"** → **"PostgreSQL"**
2. Nombre: `tramites-db`
3. Copia la URL de conexión
4. Cópiala en `DATABASE_URL` en el Web Service

### 6. Actualizar URLs

En Render, cambia:
```
NEXTAUTH_URL=https://tu-app.onrender.com
```

### 7. Deploy

Clic en **"Deploy"**. Render desplegará automáticamente. Cuando termina, tu app estará en:
```
https://tu-app-nombre.onrender.com
```

---

## Prueba de Mercado Pago en Desarrollo

Mercado Pago proporciona tarjetas de prueba:

**Tarjeta VISA:** `4111 1111 1111 1111`
- Exp: cualquier fecha futura
- CVV: `123`
- Email: cualquiera

---

## Estructura de Carpetas Explicada

```
tramites-app/
├── app/                        # Tu aplicación (Next.js App Router)
│   ├── api/
│   │   ├── auth/              # Rutas de autenticación con NextAuth
│   │   ├── tramites/          # API para crear/obtener trámites
│   │   ├── mercadopago/       # Integración de pagos
│   │   └── admin/             # APIs solo para administrador
│   │
│   ├── (páginas públicas)
│   ├── page.tsx               # Página principal (/home)
│   ├── login/page.tsx         # Página de login
│   ├── globals.css            # Estilos globales (Tailwind)
│   ├── layout.tsx             # Layout principal
│   │
│   ├── oficinas/              # Páginas por oficina
│   │   ├── registro-propiedad/page.tsx
│   │   ├── registro-personas/page.tsx
│   │   ├── apostillas/page.tsx
│   │   └── catastro/page.tsx
│   │
│   ├── mis-tramites/          # Dashboard de usuario
│   ├── admin/                 # Panel de administrador
│   └── pago/                  # Páginas de pago
│
├── prisma/
│   └── schema.prisma          # Definición de la base de datos
│                               # (tablas, relaciones, etc.)
│
├── package.json               # Dependencias del proyecto
├── next.config.js             # Configuración de Next.js
├── tsconfig.json              # Configuración de TypeScript
├── tailwind.config.js         # Configuración de Tailwind CSS
└── README.md                  # Este archivo
```

---

## Próximos Pasos para Expandir

### 1. Agregar más trámites por oficina

Edita los archivos en `tramites-app/app/oficinas/*/page.tsx`

Ejemplo para Registro de Personas:

```tsx
const TRAMITES = [
  { id: "cambio-domicilio", nombre: "Cambio de Domicilio", monto: 600 },
  { id: "actualizar-datos", nombre: "Actualizar Datos Personales", monto: 400 },
  { id: "certificado", nombre: "Certificado de Existencia", monto: 300 },
]
```

### 2. Cargar documentos

- Los documentos pueden guardarse en **AWS S3** o **Cloudinary** (servicio gratuito)
- Crea un API endpoint `/api/documentos/upload` que reciba archivos
- Guarda en la BD la URL del documento

### 3. Enviar emails

Integra **SendGrid** o **Nodemailer** para:
- Confirmar creación de trámite
- Notificar cambios de estado
- Avisar cuando hay documentos para descargar

### 4. Webhooks de Mercado Pago

Ya está implementado, pero puedes mejorar:
- Enviar email cuando se confirme pago
- Registrar intentos fallidos
- Historial de pagos más detallado

---

## Troubleshooting

### Error: "NEXTAUTH_SECRET not set"
→ Agrega `NEXTAUTH_SECRET=una-cadena-larga-aleatoria` a `.env.local`

### Error: "Cannot find module 'prisma'"
→ Ejecuta `npm install` nuevamente

### Error: "Database connection failed"
→ Verifica que PostgreSQL esté corriendo y que `DATABASE_URL` sea correcta

### Error: "Google OAuth failed"
→ Verifica que los `Client ID` y `Client Secret` sean correctos
→ Verifica que `NEXTAUTH_URL` sea correcto (`http://localhost:3000` para desarrollo)

---

## Dudas Frecuentes

**P: ¿Debo pagar por Render?**
R: No, el tier gratuito funciona bien para empezar. Cuando crezca, upgrade a paid.

**P: ¿Debo pagar por PostgreSQL en Render?**
R: No, Render da una BD PostgreSQL gratis con tu web service.

**P: ¿Puedo usar MySQL en lugar de PostgreSQL?**
R: Sí, pero necesitas cambiar `provider = "postgresql"` a `provider = "mysql"` en `prisma/schema.prisma`

**P: ¿Cómo agrego más usuarios administradores?**
R: Edita la BD y cambia `role` de `usuario` a `admin`

---

## Contacto y Soporte

Si tienes dudas sobre:
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth**: https://next-auth.js.org
- **Mercado Pago**: https://developers.mercadopago.com
- **Render**: https://render.com/docs

---

¡Mucho éxito con tu proyecto! 🚀
