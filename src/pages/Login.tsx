import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Loader2, Lock, Mail, Store } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../store'

export default function Login() {
  const navigate = useNavigate()
  const autenticado = useApp((estado) => estado.autenticado)
  const ocupado = useApp((estado) => estado.ocupado)
  const errorStore = useApp((estado) => estado.error)
  const ingresar = useApp((estado) => estado.ingresar)
  const limpiarError = useApp((estado) => estado.limpiarError)

  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [errorLocal, setErrorLocal] = useState('')

  const error = errorLocal || errorStore || ''

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
          <p className="text-sm text-gray-500">Bodega Los Malabares · Peñón Michelena–Táchira</p>
        </header>

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

        <p className="mt-6 text-center text-[11px] leading-relaxed text-gray-400">
          En este dispositivo puedes reanudar la sesión con tu PIN tras 5 minutos de inactividad.
        </p>
      </div>
    </main>
  )
}
