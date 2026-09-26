/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_CORREO_DEMO: string
  readonly VITE_PIN_DEMO: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
