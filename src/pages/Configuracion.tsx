import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  KeyRound,
  LifeBuoy,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { guardarPin, pinActual } from '../lib/pin'
import { supabase } from '../lib/supabase'
import { useApp } from '../store'

const CLAVE_USUARIOS = 'usuariosFuncionales'
const FORMATO_PIN = /^\d{4}$/
/** Destino del enlace de confirmación de correo de los usuarios nuevos. */
const URL_CONFIRMACION = 'https://control-de-morosos-web.shaielbecerra.workers.dev/'

interface UsuarioLocal {
  id: string
  nombre: string
  correo: string
  creado: string
}

function leerUsuarios(): UsuarioLocal[] {
  try {
    const bruto = localStorage.getItem(CLAVE_USUARIOS)
    if (!bruto) return []
    const lista = JSON.parse(bruto)
    return Array.isArray(lista) ? (lista as UsuarioLocal[]) : []
  } catch {
    return []
  }
}

function guardarUsuarios(lista: UsuarioLocal[]): boolean {
  try {
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(lista))
    return true
  } catch {
    return false
  }
}

const campo =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green'
const botonPrimario =
  'flex items-center justify-center gap-2 rounded-lg bg-apple-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98] disabled:opacity-60'

function Tarjeta({
  titulo,
  detalle,
  icono: Icono,
  children,
}: {
  titulo: string
  detalle: string
  icono: typeof KeyRound
  children: ReactNode
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <Icono size={17} aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{titulo}</h2>
          <p className="text-xs text-gray-500">{detalle}</p>
        </div>
      </header>
      {children}
    </article>
  )
}

function Aviso({ texto, tipo }: { texto: string; tipo: 'ok' | 'error' }) {
  if (!texto) return null
  return (
    <p
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`text-xs font-medium ${tipo === 'ok' ? 'text-apple-green-dark' : 'text-coral'}`}
    >
      {texto}
    </p>
  )
}

export default function Configuracion() {
  const ocupado = useApp((estado) => estado.ocupado)
  const cambiarClave = useApp((estado) => estado.cambiarClave)

  const [correo, setCorreo] = useState('')

  const [claveNueva, setClaveNueva] = useState('')
  const [claveRepeticion, setClaveRepeticion] = useState('')
  const [avisoClave, setAvisoClave] = useState('')
  const [errorClave, setErrorClave] = useState('')

  const [pinVigente, setPinVigente] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [pinRepeticion, setPinRepeticion] = useState('')
  const [avisoPin, setAvisoPin] = useState('')
  const [errorPin, setErrorPin] = useState('')

  const [usuarios, setUsuarios] = useState<UsuarioLocal[]>(() => leerUsuarios())
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [correoUsuario, setCorreoUsuario] = useState('')
  const [claveUsuario, setClaveUsuario] = useState('')
  const [avisoUsuario, setAvisoUsuario] = useState('')
  const [errorUsuario, setErrorUsuario] = useState('')
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setCorreo(data.user?.email ?? ''))
  }, [])

  const guardarClave = async () => {
    setAvisoClave('')
    if (claveNueva.length < 8) {
      setErrorClave('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (claveNueva !== claveRepeticion) {
      setErrorClave('Las contraseñas no coinciden.')
      return
    }
    setErrorClave('')
    const ok = await cambiarClave(claveNueva)
    if (!ok) {
      setErrorClave(useApp.getState().error ?? 'No se pudo cambiar la contraseña.')
      return
    }
    setClaveNueva('')
    setClaveRepeticion('')
    setAvisoClave('Contraseña actualizada correctamente.')
  }

  const actualizarPin = () => {
    setAvisoPin('')
    if (pinVigente !== pinActual()) {
      setErrorPin('El PIN actual no coincide.')
      return
    }
    if (!FORMATO_PIN.test(pinNuevo)) {
      setErrorPin('El nuevo PIN debe tener exactamente 4 dígitos.')
      return
    }
    if (pinNuevo !== pinRepeticion) {
      setErrorPin('Los PIN nuevos no coinciden.')
      return
    }
    if (!guardarPin(pinNuevo)) {
      setErrorPin('Este navegador no permite guardar el PIN.')
      return
    }
    setErrorPin('')
    setPinVigente('')
    setPinNuevo('')
    setPinRepeticion('')
    setAvisoPin('PIN actualizado para este dispositivo.')
  }

  const crearUsuario = async () => {
    setAvisoUsuario('')
    if (nombreUsuario.trim().length < 3) {
      setErrorUsuario('Escribe el nombre completo del usuario.')
      return
    }
    if (!correoUsuario.includes('@')) {
      setErrorUsuario('Escribe un correo válido.')
      return
    }
    if (claveUsuario.length < 8) {
      setErrorUsuario('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setErrorUsuario('')
    setCreando(true)

    const { data, error } = await supabase.auth.signUp({
      email: correoUsuario.trim(),
      password: claveUsuario,
      options: {
        data: { nombre: nombreUsuario.trim() },
        emailRedirectTo: URL_CONFIRMACION,
      },
    })

    setCreando(false)

    if (error) {
      setErrorUsuario(error.message)
      return
    }

    const pendiente = Boolean(data.user && !data.user.email_confirmed_at)
    const registro: UsuarioLocal = {
      id: data.user?.id ?? crypto.randomUUID(),
      nombre: nombreUsuario.trim(),
      correo: correoUsuario.trim().toLowerCase(),
      creado: new Date().toISOString(),
    }
    const siguiente = [registro, ...usuarios.filter((u) => u.correo !== registro.correo)]
    setUsuarios(siguiente)
    guardarUsuarios(siguiente)

    setNombreUsuario('')
    setCorreoUsuario('')
    setClaveUsuario('')
    setAvisoUsuario(
      pendiente
        ? `Usuario creado. ${registro.correo} debe confirmar su correo antes de poder entrar.`
        : 'Usuario creado y activo.',
    )
  }

  const quitarUsuario = (id: string) => {
    const siguiente = usuarios.filter((usuario) => usuario.id !== id)
    setUsuarios(siguiente)
    guardarUsuarios(siguiente)
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Configuración</h1>
          <p className="text-sm text-gray-500">
            Contraseña, PIN de bloqueo y usuarios funcionales del mostrador.
          </p>
        </div>
        {correo && (
          <span className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 sm:self-auto">
            <Mail size={13} aria-hidden />
            {correo}
          </span>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Tarjeta
          titulo="Cambiar contraseña"
          detalle="Es la clave con la que entras a la aplicación (Supabase Auth)."
          icono={KeyRound}
        >
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                Nueva contraseña
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={claveNueva}
                onChange={(evento) => {
                  setClaveNueva(evento.target.value)
                  setErrorClave('')
                }}
                placeholder="Mínimo 8 caracteres"
                className={campo}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                Repetir contraseña
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={claveRepeticion}
                onChange={(evento) => {
                  setClaveRepeticion(evento.target.value)
                  setErrorClave('')
                }}
                placeholder="••••••••"
                className={campo}
              />
            </label>
            <Aviso texto={errorClave} tipo="error" />
            <Aviso texto={avisoClave} tipo="ok" />
            <button
              type="button"
              onClick={() => void guardarClave()}
              disabled={ocupado}
              className={botonPrimario}
            >
              {ocupado ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
              Guardar contraseña
            </button>
          </div>
        </Tarjeta>

        <Tarjeta
          titulo="PIN de bloqueo"
          detalle={`Reanuda la sesión a los 10 minutos de inactividad. Vigente: ${
            pinActual() || 'no definido'
          }`}
          icono={ShieldCheck}
        >
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">PIN actual</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinVigente}
                onChange={(evento) => {
                  setPinVigente(evento.target.value.replace(/\D/g, '').slice(0, 4))
                  setErrorPin('')
                }}
                placeholder="••••"
                className={campo}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">PIN nuevo</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinNuevo}
                  onChange={(evento) => {
                    setPinNuevo(evento.target.value.replace(/\D/g, '').slice(0, 4))
                    setErrorPin('')
                  }}
                  placeholder="••••"
                  className={campo}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Repetir PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinRepeticion}
                  onChange={(evento) => {
                    setPinRepeticion(evento.target.value.replace(/\D/g, '').slice(0, 4))
                    setErrorPin('')
                  }}
                  placeholder="••••"
                  className={campo}
                />
              </label>
            </div>
            <Aviso texto={errorPin} tipo="error" />
            <Aviso texto={avisoPin} tipo="ok" />
            <button type="button" onClick={actualizarPin} className={botonPrimario}>
              Guardar PIN
            </button>
            <p className="text-[11px] leading-snug text-gray-400">
              El PIN se guarda en este dispositivo; cada caja define el suyo.
            </p>
          </div>
        </Tarjeta>
      </section>

      <Tarjeta
        titulo="Usuarios funcionales"
        detalle="Crea accesos de caja para cada persona que opere el mostrador."
        icono={Users}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Nombre</span>
              <input
                type="text"
                value={nombreUsuario}
                onChange={(evento) => {
                  setNombreUsuario(evento.target.value)
                  setErrorUsuario('')
                }}
                placeholder="Nombre y apellido"
                className={campo}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">Correo</span>
              <input
                type="email"
                autoComplete="off"
                value={correoUsuario}
                onChange={(evento) => {
                  setCorreoUsuario(evento.target.value)
                  setErrorUsuario('')
                }}
                placeholder="operador@correo.com"
                className={campo}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                Contraseña inicial
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={claveUsuario}
                onChange={(evento) => {
                  setClaveUsuario(evento.target.value)
                  setErrorUsuario('')
                }}
                placeholder="Mínimo 8 caracteres"
                className={campo}
              />
            </label>
            <Aviso texto={errorUsuario} tipo="error" />
            <Aviso texto={avisoUsuario} tipo="ok" />
            <button
              type="button"
              onClick={() => void crearUsuario()}
              disabled={creando}
              className={botonPrimario}
            >
              {creando ? <Loader2 size={16} className="animate-spin" aria-hidden /> : (
                <UserPlus size={16} aria-hidden />
              )}
              Agregar usuario
            </button>
            <p className="text-[11px] leading-snug text-gray-400">
              El usuario nuevo recibe un correo de confirmación; hasta abrirlo no puede iniciar
              sesión. Cada usuario entra con su correo y contraseña.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Registrados aquí</span>
              <span className="text-[11px] text-gray-400">{usuarios.length} en este dispositivo</span>
            </div>

            {usuarios.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">
                <p className="text-xs font-semibold text-gray-700">Sin usuarios registrados</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Los accesos que crees aparecerán en esta lista.
                </p>
              </div>
            ) : (
              <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-100">
                {usuarios.map((usuario) => (
                  <li key={usuario.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                      {usuario.nombre
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((parte) => parte.charAt(0))
                        .join('')
                        .toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800">
                        {usuario.nombre}
                      </span>
                      <span className="block truncate text-[11px] text-gray-400">
                        {usuario.correo}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarUsuario(usuario.id)}
                      aria-label={`Quitar a ${usuario.nombre}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-coral-soft hover:text-coral"
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Tarjeta>

      <section className="flex items-start gap-3 rounded-xl border border-apple-green/30 bg-apple-green-soft px-5 py-4">
        <LifeBuoy size={17} aria-hidden className="mt-0.5 shrink-0 text-apple-green-dark" />
        <p className="text-xs leading-relaxed text-gray-700">
          ¿Olvidaste la contraseña o el PIN? Desde otro equipo entra con las credenciales de
          administración y cámbialos aquí. La contraseña se valida en Supabase; el PIN solo
          desbloquea este dispositivo.
        </p>
      </section>
    </div>
  )
}
