import { PIN_DEMO } from './supabase'

const CLAVE_PIN = 'pinDispositivo'
const FORMATO_PIN = /^\d{4}$/

/** PIN vigente en este dispositivo (el guardado o el de respaldo del entorno). */
export function pinActual(): string {
  try {
    const guardado = localStorage.getItem(CLAVE_PIN)
    if (guardado && FORMATO_PIN.test(guardado)) return guardado
  } catch {
    // almacenamiento no disponible
  }
  return (PIN_DEMO ?? '').trim()
}

/** Persiste un PIN nuevo en el dispositivo. Devuelve false si no hay almacenamiento. */
export function guardarPin(pin: string): boolean {
  if (!FORMATO_PIN.test(pin)) return false
  try {
    localStorage.setItem(CLAVE_PIN, pin)
    return true
  } catch {
    return false
  }
}
