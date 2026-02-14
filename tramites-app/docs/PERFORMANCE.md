# Rendimiento – primera carga lenta (~15 s)

## Causas identificadas

1. **Cold start del servidor (serverless)**  
   En Vercel, Railway, Render, etc., la primera petición después de inactividad puede tardar 5–15 s mientras se inicia la función/contenedor.

2. **Carga de módulos pesados en la ruta de sesión**  
   Al cargar la app, el cliente llama a `GET /api/auth/session`. El handler de NextAuth cargaba `lib/auth`, que importaba **Prisma** y **bcrypt** en el nivel superior. Así, toda petición de sesión (incluso solo para leer el JWT) cargaba la DB y bcrypt, empeorando el cold start.

3. **Primera conexión a la base de datos**  
   La primera query a la DB (p. ej. tras despertar un servicio serverless como Neon) puede sumar varios segundos.

## Cambios realizados

- **Carga diferida en `lib/auth.ts`**: Prisma y bcrypt se cargan solo cuando hace falta (login con email/contraseña o OAuth con Google), mediante `getPrisma()` e `import("bcryptjs")` dentro de los callbacks. Así, `GET /api/auth/session` (solo JWT) **no** carga Prisma ni bcrypt y debería responder mucho más rápido en la primera carga.

## Recomendaciones adicionales

- **Connection pooler**: Si usás Neon, Supabase, etc., asegurate de usar la URL del **pooler** (no la conexión directa) en `DATABASE_URL` para reducir latencia y cold starts de la DB.
- **Warm-up**: Un cron que llame cada 5–10 min a una ruta simple (p. ej. `GET /api/health` que devuelva `{ ok: 1 }`) ayuda a que el servidor no se “duerma” y la primera visita sea más rápida.
- **Medir**: Usar `/api/debug/speed-test` para ver tiempos de DB y comparar antes/después. Si `db_connect_ms` es alto, el cuello de botella es la conexión a la DB.
