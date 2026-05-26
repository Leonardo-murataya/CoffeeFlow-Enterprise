Despliegue en Vercel — Guía rápida

Objetivo

- Permitir desplegar cada app (`admin`, `pos`, `kds`) desde el mismo repositorio con la mínima configuración en Vercel.

Requisitos previos

- Acceso a la cuenta de Vercel y permisos para conectar el repositorio GitHub.
- Variables de entorno de Supabase (ver abajo).

Pasos (por app)

1. En Vercel, clic en "New Project" → "Import Git Repository" y selecciona este repositorio.
2. Al crear el proyecto, cambia el campo "Root Directory" al subdirectorio correspondiente:
    - admin → `apps/admin`
    - pos → `apps/pos`
    - kds → `apps/kds`
3. Framework detectado: Next.js (si no lo detecta, fuerza con `@vercel/next` en la configuración del proyecto).
4. Revisa los comandos de Build & Output (deberían ser):
    - Build Command: `npm run build`
    - Install Command: `npm install`
    - Output Directory: (Next.js se detecta automáticamente)

Variables de entorno (necesarias)

- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto Supabase (pública)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — clave anónima pública de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — clave secreta para acciones de servidor (no exponer públicamente)
- `NEXT_PUBLIC_POS_URL` — URL pública del proyecto POS desplegado en Vercel
- `NEXT_PUBLIC_KDS_URL` — URL pública del proyecto KDS desplegado en Vercel

Notas importantes

- Este monorepo usa paquetes locales (`packages/*`). Cada app incluye `next.config.ts` con `transpilePackages` para compilar los paquetes locales en el build de Vercel.
- No subas `SUPABASE_SERVICE_ROLE_KEY` a ningún archivo público. Añádela en Vercel como `Environment Variable` tipo `Secret` en `Production`.
- Si quieres desplegar las tres apps como proyectos independientes en Vercel, repite el proceso 3 veces cambiando solo el `Root Directory`.
- Una vez tengas las URLs finales de POS y KDS, añade `NEXT_PUBLIC_POS_URL` y `NEXT_PUBLIC_KDS_URL` en el proyecto `admin` para que los atajos no apunten a `localhost`.

Comprobación posterior al despliegue

- Revisa los logs de build en Vercel; si falla por falta de variables, añádelas en el Dashboard → Settings → Environment Variables.
- Si ves errores relacionados con versiones de Node, asegúrate de que cada proyecto use Node.js 20+ (configurable en Vercel Project Settings → General → Environment → Node Version).

Opcional: Automatizar mediante la CLI

- Puedes usar `vercel` CLI tras login para crear proyectos y añadir variables. Ejemplo:
    - `vercel projects create coffeeflow-admin --root apps/admin`
    - `vercel env add NEXT_PUBLIC_SUPABASE_URL production`

Si quieres, puedo:

- Hacer commit de estos archivos (`vercel.json` y `DEPLOYMENT.md`) y pushear a `main`.
- O guiarte paso a paso en la conexión del repo en tu cuenta Vercel.

Dime qué prefieres y procedo.
