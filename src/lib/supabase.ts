import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const clave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

if (!url || !clave) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en el archivo .env')
}

export const supabase = createClient(url, clave, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

export const CORREO_DEMO = import.meta.env.VITE_CORREO_DEMO
export const PIN_DEMO = import.meta.env.VITE_PIN_DEMO
