import { useEffect, useRef, useState } from 'react'
import { Delete, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { PIN_DEMO } from '../lib/supabase'
import { useApp } from '../store'

const MINUTOS_BLOQUEO = 10
const CLAVE_ACTIVIDAD = 'ultimaActividad'
const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const PIN = (PIN_DEMO ?? '').trim()

function registrarActividad(): void {
  try {
    localStorage.setItem(CLAVE_ACTIVIDAD, String(Date.now()))
  } catch {
    // almacenamiento no disponible
  }
}

function ultimaActividad(): number {
  try {
    const valor = Number(localStorage.getItem(CLAVE_ACTIVIDAD))
    if (Number.isFinite(valor) && valor > 0) return valor
  } catch {
    // almacenamiento no disponible
  }
  return Date.now()
}

/** Bloquea la sesión tras 10 minutos de inactividad; solo se reanuda con el PIN. */
export default function BloqueoInactividad() {
  const autenticado = useApp((estado) => estado.autenticado)
  const [bloqueado, setBloqueado] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const pinRef = useRef('')

  useEffect(() => {
    if (!autenticado || !PIN) return

    const umbral = MINUTOS_BLOQUEO * 60_000
    const evaluar = () => {
      if (Date.now() - ultimaActividad() > umbral) setBloqueado(true)
    }

    evaluar()
    const temporizador = window.setInterval(evaluar, 15_000)

    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
    const alActivar = () => registrarActividad()
    for (const evento of eventos) window.addEventListener(evento, alActivar, { passive: true })

    return () => {
      window.clearInterval(temporizador)
      for (const evento of eventos) window.removeEventListener(evento, alActivar)
    }
  }, [autenticado])

  const fijarPin = (valor: string) => {
    pinRef.current = valor
    setPin(valor)
  }

  const desbloquear = (valor: string) => {
    if (valor === PIN) {
      setError('')
      fijarPin('')
      registrarActividad()
      setBloqueado(false)
      return
    }
    setError('PIN incorrecto.')
    fijarPin('')
  }

  const pulsar = (digito: string) => {
    setError('')
    const siguiente = (pinRef.current + digito).slice(0, 4)
    fijarPin(siguiente)
    if (siguiente.length === 4) {
      setOcupado(true)
      window.setTimeout(() => {
        desbloquear(siguiente)
        setOcupado(false)
      }, 140)
    }
  }

  useEffect(() => {
    if (!bloqueado) return
    const manejar = (evento: KeyboardEvent) => {
      if (/^\d$/.test(evento.key)) pulsar(evento.key)
      else if (evento.key === 'Backspace') fijarPin(pinRef.current.slice(0, -1))
      else if (evento.key === 'Enter' && pinRef.current.length === 4) desbloquear(pinRef.current)
    }
    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  })

  if (!autenticado || !PIN || !bloqueado) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sesión bloqueada"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 px-5 backdrop-blur-sm"
    >
      <div className="w-full max-w-[22rem] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <header className="flex flex-col items-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
            <Lock size={20} aria-hidden />
          </span>
          <h2 className="text-base font-bold tracking-tight text-gray-800">Sesión bloqueada</h2>
          <p className="mt-1 text-xs text-gray-500">
            {MINUTOS_BLOQUEO} minutos sin actividad · Ingresa tu PIN para reanudar
          </p>
        </header>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-3" aria-live="polite">
            {[0, 1, 2, 3].map((indice) => (
              <span
                key={indice}
                className={`h-3.5 w-3.5 rounded-full transition-all ${
                  indice < pin.length ? 'scale-110 bg-apple-green' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="mt-3 h-4 text-xs font-medium text-coral" role="alert">
            {error}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {TECLAS.map((digito) => (
            <button
              key={digito}
              type="button"
              onClick={() => pulsar(digito)}
              disabled={ocupado}
              className="h-14 rounded-xl border border-gray-200 bg-white text-2xl font-semibold tabular-nums text-gray-800 transition-all hover:border-apple-green hover:bg-apple-green-soft hover:text-apple-green-dark active:scale-95 disabled:opacity-50"
            >
              {digito}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              fijarPin('')
              setError('')
            }}
            className="h-14 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 active:scale-95"
          >
            Limpiar
          </button>

          <button
            type="button"
            onClick={() => pulsar('0')}
            disabled={ocupado}
            className="h-14 rounded-xl border border-gray-200 bg-white text-2xl font-semibold tabular-nums text-gray-800 transition-all hover:border-apple-green hover:bg-apple-green-soft hover:text-apple-green-dark active:scale-95 disabled:opacity-50"
          >
            0
          </button>

          <button
            type="button"
            onClick={() => fijarPin(pinRef.current.slice(0, -1))}
            aria-label="Borrar último dígito"
            className="flex h-14 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 active:scale-95"
          >
            <Delete size={20} aria-hidden />
          </button>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
          {ocupado ? (
            <>
              <Loader2 size={13} className="animate-spin" aria-hidden />
              Verificando…
            </>
          ) : (
            <>
              <ShieldCheck size={13} aria-hidden />
              Tu sesión sigue activa en este dispositivo
            </>
          )}
        </p>
      </div>
    </div>
  )
}
