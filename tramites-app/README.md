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

## Guía de estilos (mobile-first)

Para mantener el mismo aspecto en todo el sitio (/, /admin, /mis-tramites, etc.) usamos estas convenciones:

### Layout general
- **Página**: `min-h-screen bg-gray-50` o `bg-gray-100` según sección.
- **Contenido principal**: `max-w-7xl mx-auto px-4 sm:px-4 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]`.
- **Footer**: `bg-white border-t border-gray-200`, contenido `max-w-7xl mx-auto px-4 py-4`, texto `text-center text-gray-500 text-xs sm:text-sm`.

### Navegación
- **Navbar**: `bg-white border-b border-gray-200 sticky top-0 z-40`, contenedor `max-w-7xl mx-auto px-4`, altura `h-14`.
- **Botón menú (hamburguesa)**: área táctil mínimo 44px: `min-w-[44px] min-h-[44px] flex items-center justify-center ... rounded -m-1`.
- **Menú lateral**: `fixed top-0 right-0 ... w-56 bg-white ... rounded-bl-lg`, ítems con `px-3 py-2 text-sm`, cierre con área táctil ≥44px.

### Cards y contenedores
- **Card**: `bg-white border border-gray-200 rounded-lg`, padding `p-4`.
- **Card con cabecera**: cabecera `p-4 border-b border-gray-200`, cuerpo `p-4`.
- **Cards táctiles (links)**: envolver en `Link` con `block min-h-[44px]`, card con `rounded-lg p-3 hover:shadow-md active:bg-gray-50`.

### Botones
- **Primario (CTA)**: `min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800`.
- **Secundario / outline**: `min-h-[44px] px-4 py-3 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 active:bg-gray-100`.
- **Danger**: `... bg-red-600 ... hover:bg-red-700` y para texto/link `text-red-600 hover:bg-red-50`.

### Tipografía
- **Título de página**: `text-xl sm:text-2xl font-semibold text-gray-900`.
- **Título de sección/card**: `text-sm sm:text-base font-semibold text-gray-900`.
- **Cuerpo**: `text-sm text-gray-600` (evitar `text-xs` en bloques largos).
- **Secundario / metadatos**: `text-sm text-gray-500` o `text-gray-400`.

### Áreas táctiles y accesibilidad
- **Mínimo recomendado**: 44px de altura (o min-h-[44px]) en botones y enlaces principales.
- **Viewport**: no usar `userScalable: false`; permitir zoom para accesibilidad.
- **Safe area**: en `main`, usar `pb-[max(1.5rem,env(safe-area-inset-bottom))]` para dispositivos con barra de inicio.

### Tablas (desktop)
- Contenedor: `bg-white border border-gray-200 rounded-lg overflow-x-auto`.
- Celdas: `px-4 py-3 text-sm`, cabeceras `font-semibold text-gray-600`.

### Modales / diálogos
- Overlay: `fixed inset-0 bg-black/50 ... z-50 p-4`.
- Contenido: `bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full`.
- Botones de acción: mismos estilos que botones primario/secundario con `min-h-[44px]` donde aplique.

---

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
