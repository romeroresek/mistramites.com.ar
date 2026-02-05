# Sistema de Trámites Online

Plataforma completa para gestionar trámites del estado con autenticación Google, pagos por Mercado Pago y panel de administración.

## Características

✅ Autenticación con Google (NextAuth)
✅ Registro de múltiples oficinas (Propiedad, Personas, Apostillas, Catastro)
✅ Panel de usuario para ver estado de trámites
✅ Panel de administrador para gestionar trámites
✅ Pagos integrados con Mercado Pago
✅ Base de datos PostgreSQL
✅ Webhook para confirmar pagos automáticamente

## Requisitos

- Node.js 18+
- npm o yarn
- PostgreSQL
- Credenciales Google OAuth
- Credenciales Mercado Pago (Argentina)

## Instalación Local

### 1. Clonar el repositorio

\`\`\`bash
git clone <repo-url>
cd tramites-app
npm install
\`\`\`

### 2. Configurar variables de entorno

Copia \`.env.local.example\` a \`.env.local\` y completa:

\`\`\`env
# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
NEXTAUTH_SECRET=genera_una_cadena_aleatoria

# Base de datos
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/tramites_db

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key

# URLs
NEXTAUTH_URL=http://localhost:3000
\`\`\`

### 3. Crear base de datos PostgreSQL

\`\`\`bash
createdb tramites_db
\`\`\`

### 4. Ejecutar migraciones

\`\`\`bash
npx prisma migrate dev
\`\`\`

### 5. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre http://localhost:3000

## Obtener Credenciales

### Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Ve a "APIs y servicios" > "Credenciales"
4. Clic en "Crear credenciales" > "ID de cliente OAuth"
5. Selecciona "Aplicación web"
6. Agrega \`http://localhost:3000\` a "URIs autorizados de redireccionamiento"
7. Copia el Client ID y Secret

### Mercado Pago (Argentina)

1. Crea una cuenta en [Mercado Pago](https://www.mercadopago.com.ar)
2. Ve a "Configuración" > "Credenciales"
3. Copia el Access Token
4. En URLs de Notificación, configura: \`https://tudominio.com/api/mercadopago/webhook\`

## Deploy en Render

### 1. Crear cuenta en Render

Ve a https://render.com y crea una cuenta

### 2. Conectar repositorio

1. Haz push de tu código a GitHub
2. En Render, crea un nuevo "Web Service"
3. Conecta tu repositorio de GitHub

### 3. Configurar variables de entorno

En Render, agrega en "Environment":

\`\`\`
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
NEXTAUTH_SECRET=genera_una_cadena_aleatoria
NEXTAUTH_URL=https://tu-app.onrender.com
DATABASE_URL=postgresql://...
\`\`\`

### 4. Crear base de datos PostgreSQL en Render

1. Crea un nuevo "PostgreSQL"
2. Copia la URL de conexión
3. Pégala en \`DATABASE_URL\`

### 5. Configurar build y start

Build command:
\`\`\`
npm install && npx prisma migrate deploy && npm run build
\`\`\`

Start command:
\`\`\`
npm start
\`\`\`

### 6. Deploy

Render desplegará automáticamente cuando hagas push a main.

## Estructura del Proyecto

\`\`\`
tramites-app/
├── app/
│   ├── api/
│   │   ├── auth/              # NextAuth
│   │   ├── tramites/          # CRUD de trámites
│   │   ├── mercadopago/       # Pagos y webhooks
│   │   └── admin/             # APIs de admin
│   ├── admin/                 # Panel de admin
│   ├── oficinas/              # Páginas por oficina
│   ├── mis-tramites/          # Dashboard de usuario
│   ├── pago/                  # Flujo de pago
│   └── login/                 # Página de login
├── prisma/
│   └── schema.prisma          # Esquema de BD
└── package.json
\`\`\`

## Flujo de Usuario

1. **Login**: Usuario se autentica con Google
2. **Seleccionar Oficina**: Elige qué trámite realizar
3. **Crear Trámite**: Completa formulario y envía
4. **Pagar**: Mercado Pago confirma el pago
5. **Seguimiento**: Usuario ve estado en "Mis Trámites"

## Flujo de Administrador

1. **Login**: Admin se autentica (rol: admin)
2. **Ver Trámites**: Lista de todos los trámites
3. **Actualizar Estado**: Cambia estado a "en_proceso", "completado", etc.
4. **Cargar Documentos**: Sube documentos para que usuario descargue

## URLs Principales

- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Mis Trámites**: http://localhost:3000/mis-tramites
- **Panel Admin**: http://localhost:3000/admin

## Funcionalidades Futuras

- [ ] Carga de documentos por usuarios
- [ ] Descargar documentos del admin
- [ ] Notificaciones por email
- [ ] Historial de cambios
- [ ] Búsqueda y filtrado avanzado

## Soporte

Para preguntas, abre un issue en GitHub.

---

Desarrollado con Next.js, TypeScript, Tailwind CSS, Prisma y Mercado Pago.
