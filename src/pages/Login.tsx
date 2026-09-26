import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Delete, Loader2, Lock, Mail, Store } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../store'

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export default function Login() {
  const navigate = useNavigate()
  const autenticado = useApp((estado) => estado.autenticado)
  const ocupado = useApp((estado) => estado.ocupado)
  const errorStore = useApp((estado) => estado.error)
  const ingresar = useApp((estado) => estado.ingresar)
  const ingresarConPin = useApp((estado) => estado.ingresarConPin)
  const limpiarError = useApp((estado) => estado.limpiarError)

  const [pin, setPin] = useState('')
  const pinRef = useRef('')
  const [modo, setModo] = useState<'pin' | 'correo'>('pin')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [errorLocal, setErrorLocal] = useState('')

  const error = errorLocal || errorStore || ''

  const fijarPin = (valor: string) => {
    pinRef.current = valor
    setPin(valor)
  }

  const entrar = async (valor: string) => {
    const correcto = await ingresarConPin(valor)
    if (!correcto) fijarPin('')
  }

  const pulsar = (digito: string) => {
    if (ocupado) return
    setErrorLocal('')
    limpiarError()
    const siguiente = (pinRef.current + digito).slice(0, 4)
    fijarPin(siguiente)
    if (siguiente.length === 4) window.setTimeout(() => void entrar(siguiente), 140)
  }

  useEffect(() => {
    if (modo !== 'pin') return

    const manejar = (evento: KeyboardEvent) => {
      if (/^\d$/.test(evento.key)) pulsar(evento.key)
      else if (evento.key === 'Backspace') fijarPin(pinRef.current.slice(0, -1))
      else if (evento.key === 'Enter' && pinRef.current.length === 4) void entrar(pinRef.current)
    }

    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  })

  const enviarCorreo = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!correo.includes('@') || clave.length < 4) {
      setErrorLocal('Revisa el correo y la contraseña.')
      return
    }
    setErrorLocal('')
    const correcto = await ingresar(correo, clave)
    if (correcto) navigate('/app', { replace: true })
  }

  if (autenticado) return <Navigate to="/app" replace />

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-[22rem]">
        <header className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-apple-green-soft text-apple-green-dark">
            <Store size={24} aria-hidden />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Control de Saldo</h1>
          <p className="text-sm text-gray-500">Gestión de Mostrador · Caja Principal 01</p>
        </header>

        {modo === 'pin' ? (
          <section aria-label="Acceso con PIN">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-5 text-center">
              <p className="text-xs font-semibold text-gray-500">Ingresa tu PIN</p>
              <div className="mt-3 flex items-center justify-center gap-3" aria-live="polite">
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
                  setErrorLocal('')
                }}
                className="h-14 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50 active:scale-95"
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
                className="flex h-14 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 active:scale-95"
              >
                <Delete size={20} aria-hidden />
              </button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
              {ocupado ? (
                <>
                  <Loader2 size={13} className="animate-spin" aria-hidden />
                  Verificando con Supabase…
                </>
              ): (
                'Ingresa el PIN de tu usuario'
              )}
            </p>
          </section>
        ) : (
          <form onSubmit={(evento) => void enviarCorreo(evento)} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Correo</span>
              <span className="relative block">
                <Mail
                  size={16}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  autoComplete="email"
                  value={correo}
                  onChange={(evento) => {
                    setCorreo(evento.target.value)
                    setErrorLocal('')
                    limpiarError()
                  }}
                  placeholder="caja@tienda.com"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Contraseña</span>
              <span className="relative block">
                <Lock
                  size={16}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={clave}
                  onChange={(evento) => {
                    setClave(evento.target.value)
                    setErrorLocal('')
                    limpiarError()
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green"
                />
              </span>
            </label>

            <p className="h-4 text-xs font-medium text-coral" role="alert">
              {error}
            </p>

            <button
              type="submit"
              disabled={ocupado}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-apple-green py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98] disabled:opacity-60"
            >
              {ocupado ? 'Verificando…' : 'Entrar al panel'}
              {ocupado ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <ArrowRight size={16} aria-hidden />
              )}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setModo(modo === 'pin' ? 'correo' : 'pin')
            setErrorLocal('')
          }}
          className="mt-6 w-full rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-800"
        >
          {modo === 'pin' ? 'Iniciar con correo y contraseña' : 'Volver al acceso con PIN'}
        </button>
      </div>
    </main>
  )
}
