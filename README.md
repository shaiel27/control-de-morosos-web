# Control de Fiados

App web (React + Vite + TypeScript) para llevar el control de fiados y morosos de una tienda. Usa Supabase como backend.

Producción: https://control-de-morosos-web.shaielbecerra.workers.dev/

## Desarrollo local

```bash
cp .env.example .env   # completar con los datos de Supabase
pnpm install
pnpm dev
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publishable de Supabase |
| `VITE_CORREO_DEMO` | Correo de la cuenta demo |
| `VITE_PIN_DEMO` | PIN de la cuenta demo |

Las variables `VITE_*` se incrustan en el JavaScript al compilar, así que son públicas. La seguridad de los datos depende de las políticas RLS de Supabase.

## Despliegue (Cloudflare Workers)

El Worker `control-de-morosos-web` está conectado a este repositorio y se despliega solo con cada push a `main`. La configuración está en `wrangler.jsonc`: sirve `dist/` como assets estáticos con fallback SPA para React Router.

Configuración en Cloudflare (Worker → Settings → Build):

- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy`
- Las variables `VITE_*` deben estar en **Build → Variables and secrets** (variables de build, no de runtime).

"Retry deployment" vuelve a construir el mismo commit. Para desplegar cambios nuevos hay que hacer push a `main`.

Despliegue manual:

```bash
pnpm build
npx wrangler deploy
```
