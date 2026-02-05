# Archivos Importantes - Localización Rápida

## Documentos de Guía (Lee primero)

| Archivo | Contenido | Cuándo leerlo |
|---------|----------|--------------|
| **RESUMEN.md** | Visión general del proyecto | Primero - para entender qué tienes |
| **GUIA_INICIO.md** | Pasos detallados de setup | Segundo - para instalar |
| **CHECKLIST_SETUP.md** | Checklist de validación | Junto a GUIA_INICIO para verificar |
| **COMANDOS_RAPIDOS.md** | Comandos útiles | Cuando necesites copiar/pegar rápido |
| **README.md** | Documentación técnica | Para referencia durante desarrollo |

---

## Archivos del Proyecto (tramites-app/)

### Configuración Base

```
tramites-app/
├── package.json              ← Dependencias del proyecto
├── tsconfig.json             ← Configuración de TypeScript
├── next.config.js            ← Configuración de Next.js
├── tailwind.config.js        ← Estilos CSS
├── postcss.config.js         ← PostCSS config
├── .env.local.example        ← Template de variables (copiar a .env.local)
├── .gitignore                ← Archivos a no subir a git
└── render.yaml               ← Configuración para Render
```

### Base de Datos

```
prisma/
└── schema.prisma             ← 🔑 Definición de tablas
                               EDITA AQUÍ para cambiar estructura
```

### Frontend - Páginas Públicas

```
app/
├── page.tsx                  ← HOME - seleccionar oficina
├── login/page.tsx            ← Página de login
├── layout.tsx                ← Layout principal
├── globals.css               ← Estilos globales
│
├── oficinas/                 ← 4 Oficinas del estado
│   ├── registro-propiedad/page.tsx
│   ├── registro-personas/page.tsx
│   ├── apostillas/page.tsx
│   └── catastro/page.tsx
│
├── mis-tramites/page.tsx     ← Dashboard del usuario
├── pago/[id]/page.tsx        ← Página de pago
```

### Backend - APIs

```
app/api/
│
├── auth/[...nextauth]/route.ts     ← 🔑 Autenticación Google
│                                    EDITA AQUÍ para agregar más providers
│
├── tramites/route.ts               ← CRUD de trámites (GET, POST)
│
├── mercadopago/
│   ├── route.ts                    ← 🔑 Crear preferencia de pago
│   └── webhook/route.ts            ← Confirmación de pago automática
│
└── admin/
    ├── tramites/route.ts           ← GET todos los trámites
    └── tramites/[id]/route.ts      ← GET/PUT un trámite (actualizar)
```

### Panel de Administrador

```
app/admin/
└── page.tsx                  ← 🔑 Dashboard del admin
                               Aquí el admin ve tabla de trámites
```

---

## Dónde Editar Cada Cosa

### Quiero agregar más trámites en una oficina

📝 **Edita**: `tramites-app/app/oficinas/*/page.tsx`

```tsx
const TRAMITES = [
  { id: "id-unico", nombre: "Nombre del trámite", monto: 1000 },
  // Agrega más aquí
]
```

---

### Quiero cambiar los montos de los trámites

📝 **Edita**: `tramites-app/app/oficinas/*/page.tsx`

Busca `monto:` y cambia el valor

---

### Quiero agregar un nuevo proveedor de autenticación (Ej: GitHub)

📝 **Edita**: `tramites-app/app/api/auth/[...nextauth]/route.ts`

Importa el provider y agrégalo a `providers: []`

---

### Quiero cambiar la estructura de la BD

📝 **Edita**: `tramites-app/prisma/schema.prisma`

Luego ejecuta: `npx prisma migrate dev`

---

### Quiero cambiar los estilos (colores, fonts, etc)

📝 **Edita**:
- `tramites-app/tailwind.config.js` (colores, fuentes)
- `tramites-app/app/globals.css` (estilos globales)
- `tramites-app/app/*/page.tsx` (estilos específicos de página)

---

### Quiero cambiar la lógica de los formularios

📝 **Edita**: `tramites-app/app/oficinas/*/page.tsx`

Busca `<form onSubmit={handleSubmit}>` y modifica

---

### Quiero agregar validaciones

📝 **Edita**:
- Frontend: `tramites-app/app/*/page.tsx`
- Backend: `tramites-app/app/api/tramites/route.ts`

---

### Quiero cambiar cómo se actualiza el estado de un trámite

📝 **Edita**:
- Admin: `tramites-app/app/admin/page.tsx`
- API: `tramites-app/app/api/admin/tramites/[id]/route.ts`

---

### Quiero agregar campos a un trámite (Ej: DNI del usuario)

📝 **Edita**:
1. Schema: `tramites-app/prisma/schema.prisma`
2. API: `tramites-app/app/api/tramites/route.ts`
3. Formulario: `tramites-app/app/oficinas/*/page.tsx`

---

## Variables de Entorno

📍 **Archivo**: `tramites-app/.env.local`

```env
# Google OAuth - Obtienes de Google Cloud Console
GOOGLE_CLIENT_ID=tu_valor
GOOGLE_CLIENT_SECRET=tu_valor

# Seguridad - Generas con: node -e "console.log(...)"
NEXTAUTH_SECRET=tu_valor

# Base de datos - De PostgreSQL
DATABASE_URL=postgresql://...

# Mercado Pago - De Mercado Pago Argentina
MERCADOPAGO_ACCESS_TOKEN=APP_USR_...
MERCADOPAGO_PUBLIC_KEY=tu_valor

# URLs - Cambia en producción
NEXTAUTH_URL=http://localhost:3000
```

**⚠️ IMPORTANTE**:
- NO comitas `.env.local` a GitHub
- Está en `.gitignore` así que git no lo sube automáticamente
- En Render, agregas las variables en Settings → Environment

---

## Rutas de la Aplicación

| Ruta | Archivo | Quién | Descripción |
|------|---------|-------|------------|
| `/` | `app/page.tsx` | Usuario | Home - seleccionar oficina |
| `/login` | `app/login/page.tsx` | Anónimo | Página de login |
| `/oficinas/registro-propiedad` | `app/oficinas/registro-propiedad/page.tsx` | Usuario | Trámites de propiedad |
| `/oficinas/registro-personas` | `app/oficinas/registro-personas/page.tsx` | Usuario | Trámites de personas |
| `/oficinas/apostillas` | `app/oficinas/apostillas/page.tsx` | Usuario | Apostillas |
| `/oficinas/catastro` | `app/oficinas/catastro/page.tsx` | Usuario | Catastro |
| `/mis-tramites` | `app/mis-tramites/page.tsx` | Usuario | Dashboard de trámites |
| `/pago/[id]` | `app/pago/[id]/page.tsx` | Usuario | Página de pago |
| `/admin` | `app/admin/page.tsx` | Admin | Panel de administrador |
| `/api/auth/*` | `app/api/auth/[...nextauth]/route.ts` | Sistema | Rutas de autenticación |
| `/api/tramites` | `app/api/tramites/route.ts` | Sistema | APIs de trámites |
| `/api/mercadopago` | `app/api/mercadopago/route.ts` | Sistema | Crear preferencia de pago |
| `/api/mercadopago/webhook` | `app/api/mercadopago/webhook/route.ts` | Mercado Pago | Confirmar pago |
| `/api/admin/*` | `app/api/admin/*/route.ts` | Admin | APIs del admin |

---

## Comandos Más Usados

```bash
# Desarrollo
npm run dev                    # Ejecutar localmente

# Base de datos
npx prisma migrate dev         # Crear migración
npx prisma studio             # Ver/editar BD visualmente
npx prisma migrate reset       # Limpiar y recrear BD

# Build
npm run build                  # Compilar para producción
npm start                      # Iniciar en producción

# Git
git add .
git commit -m "mensaje"
git push                       # Subir a GitHub
```

---

## Estructura de Carpetas Visual

```
mistramites.com.ar/
│
├── 📄 RESUMEN.md (LEE PRIMERO)
├── 📄 GUIA_INICIO.md
├── 📄 CHECKLIST_SETUP.md
├── 📄 COMANDOS_RAPIDOS.md
├── 📄 ARCHIVOS_IMPORTANTES.md (este archivo)
│
└── 📁 tramites-app/ (Tu aplicación)
    ├── 📄 package.json
    ├── 📄 .env.local (SECRETO - no commitear)
    │
    ├── 📁 app/
    │   ├── page.tsx (HOME)
    │   ├── login/page.tsx
    │   ├── admin/page.tsx
    │   ├── mis-tramites/page.tsx
    │   │
    │   ├── 📁 oficinas/
    │   │   ├── registro-propiedad/page.tsx
    │   │   ├── registro-personas/page.tsx
    │   │   ├── apostillas/page.tsx
    │   │   └── catastro/page.tsx
    │   │
    │   ├── 📁 pago/
    │   │   └── [id]/page.tsx
    │   │
    │   └── 📁 api/
    │       ├── 📁 auth/[...nextauth]/
    │       ├── 📁 tramites/
    │       ├── 📁 mercadopago/
    │       └── 📁 admin/
    │
    └── 📁 prisma/
        └── schema.prisma (BASE DE DATOS)
```

---

## Flujo de Código Cuando el Usuario Crea un Trámite

```
Usuario completa formulario en /oficinas/registro-propiedad

                    ↓

Evento onClick → handleSubmit() en page.tsx

                    ↓

Fetch POST a /api/tramites

                    ↓

Backend (route.ts):
- Valida datos
- Crea registro en BD (tabla tramites)
- Crea pago asociado (tabla pagos)
- Retorna datos

                    ↓

Frontend recibe respuesta

                    ↓

Router.push(`/pago/${tramite.id}`)

                    ↓

Página de pago crea preferencia en Mercado Pago

                    ↓

Usuario es redirigido a Mercado Pago

                    ↓

Mercado Pago envía webhook a /api/mercadopago/webhook

                    ↓

Backend:
- Verifica que sea válido
- Actualiza tabla pagos (estado: confirmado)
- Actualiza tabla tramites (estado: en_proceso)

                    ↓

Usuario ve cambio en /mis-tramites
```

---

## Checklist Rápido - Antes de Empezar

- [ ] Leíste RESUMEN.md
- [ ] Leíste GUIA_INICIO.md
- [ ] Tienes credenciales de Google
- [ ] Tienes credenciales de Mercado Pago
- [ ] Tienes PostgreSQL instalado
- [ ] Ejecutaste `npm install`
- [ ] Creaste `.env.local`
- [ ] Ejecutaste `npx prisma migrate dev`
- [ ] Ejecutaste `npm run dev`
- [ ] Accediste a http://localhost:3000

---

¡Listo! Ahora sabes dónde está cada cosa.

**Si necesitas cambiar algo específico**, busca el archivo en esta guía y edítalo.

**¿Duda?** Vuelve a GUIA_INICIO.md
