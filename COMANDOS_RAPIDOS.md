# Comandos Rápidos - Sistema de Trámites

## Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear/actualizar base de datos
npx prisma migrate dev

# 3. Ejecutar localmente
npm run dev
# Abre: http://localhost:3000

# 4. Ver/editar BD visualmente (UI de Prisma)
npx prisma studio
# Abre: http://localhost:5555
```

## Base de Datos

```bash
# Ver esquema actual
npx prisma db pull

# Crear nueva tabla/cambios
npx prisma migrate dev --name nombre_migracion

# Limpiar BD completamente (⚠️ cuidado!)
npx prisma migrate reset

# Ver historial de migraciones
npx prisma migrate status
```

## Deploy en Render

```bash
# 1. Inicializar git (si no lo hiciste)
git init
git add .
git commit -m "Initial commit"

# 2. Crear repositorio en GitHub
# Ir a https://github.com/new
# Copiar URL

# 3. Conectar con GitHub
git remote add origin https://github.com/tu-usuario/tramites-app.git
git branch -M main
git push -u origin main

# 4. En Render.com:
# - Clic en "New" → "Web Service"
# - Conectar GitHub
# - Configurar build command: npm install && npx prisma migrate deploy && npm run build
# - Configurar start command: npm start
# - Agregar variables de entorno
# - Deploy!
```

## Generar NEXTAUTH_SECRET

```bash
# Windows PowerShell
$([System.Guid]::NewGuid()).ToString()

# Linux/Mac
openssl rand -base64 32

# O usa esta en cualquier lado
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Agregar usuario admin

### Opción 1: Usando Prisma Studio
```bash
npx prisma studio
# Abre en navegador → users → edita usuario → cambia role de "usuario" a "admin"
```

### Opción 2: Con SQL directo (en pgAdmin)
```sql
UPDATE users SET role = 'admin' WHERE email = 'tumail@gmail.com';
```

## Build y producción

```bash
# Compilar para producción
npm run build

# Iniciar en modo producción (localmente)
npm start

# Ver archivos que se van a subir a producción
ls -la .next/
```

## Troubleshooting

```bash
# Si hay conflictos de dependencias
npm install --legacy-peer-deps

# Limpiar cache de npm
npm cache clean --force

# Reinstalar todo desde cero
rm -rf node_modules package-lock.json
npm install

# Ver logs de desarrollo (más detallado)
npm run dev -- --debug

# Verificar puerto 3000 en uso (Windows)
netstat -ano | findstr :3000

# Matar proceso en puerto 3000 (Windows)
taskkill /PID <numero> /F

# Verificar variables de entorno
echo $NEXTAUTH_URL  # Linux/Mac
echo %NEXTAUTH_URL%  # Windows
```

## URLs Útiles en Desarrollo

- **App**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Prisma Studio**: http://localhost:5555
- **Next.js Logs**: Terminal donde ejecutaste `npm run dev`

## Estructura Rápida

```
tramites-app/
├── app/api/                 # Rutas de API
├── app/oficinas/            # Páginas de oficinas
├── app/admin/               # Panel admin
├── app/mis-tramites/        # Dashboard usuario
├── prisma/schema.prisma     # Base de datos
├── .env.local               # Variables (no commitear!)
└── README.md                # Este proyecto
```

## Editar tipos de trámites

Los trámites están hardcodeados en cada página de oficina:

```tsx
// tramites-app/app/oficinas/registro-propiedad/page.tsx
const TRAMITES = [
  { id: "inscripcion", nombre: "Inscripción de Propiedad", monto: 1500 },
  // Agrega más aquí
]
```

Para hacerlo dinámico (en DB), crea tabla adicional:
```prisma
model TipoTramite {
  id        String   @id @default(cuid())
  nombre    String
  oficina   String
  monto     Float
  createdAt DateTime @default(now())
}
```

## Mercado Pago

```bash
# Credenciales de test (siempre comienzan con APP_USR_)
# Tarjeta test: 4111 1111 1111 1111
# Exp: 11/25
# CVV: 123
```

## Páginas importantes

| Página | URL | Descripción |
|--------|-----|-------------|
| Home | `/` | Seleccionar oficina |
| Login | `/login` | Iniciar sesión |
| Mis trámites | `/mis-tramites` | Ver estado de trámites |
| Oficinas | `/oficinas/*` | Crear trámites |
| Pago | `/pago/[id]` | Procesar pago |
| Admin | `/admin` | Panel de administrador |

## Commits útiles

```bash
git add .
git commit -m "feat: agregar nueva oficina"
git commit -m "fix: corregir error de pago"
git commit -m "docs: actualizar README"
```

## Tips importantes

1. **Nunca commitear `.env.local`** - las credenciales son secretas
2. **Hacer migraciones** antes de cambios grandes en schema.prisma
3. **Probar localmente** antes de hacer push
4. **Variables de Render** van en Settings → Environment
5. **Webhook de Mercado Pago** en Render tiene URL como: `https://tu-app.onrender.com/api/mercadopago/webhook`

---

¿Necesitas ayuda con algo? ¡Pregunta!
