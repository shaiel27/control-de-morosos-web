import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ClipboardCopy,
  Keyboard,
  LifeBuoy,
  Mail,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react'
import { obtenerTasas } from '../lib/api'
import { NOMBRE_TIENDA } from '../lib/tienda'

interface Pregunta {
  categoria: string
  pregunta: string
  respuesta: string
}

const PREGUNTAS: Pregunta[] = [
  {
    categoria: 'Primeros pasos',
    pregunta: '¿Cómo registro mi primer fiado?',
    respuesta:
      'Pulsa “Registrar Fiado” en la barra lateral (o el botón coral en el encabezado), elige o busca el cliente, escribe el monto en la moneda que prefieras y confirma. El saldo del cliente se actualiza al instante en el Panel y en su ficha.',
  },
  {
    categoria: 'Primeros pasos',
    pregunta: '¿Cómo registro un abono?',
    respuesta:
      'Pulsa “Registrar Abono”, selecciona al cliente y captura el dinero entregado. El abono reduce el saldo y puedes anotar la referencia de la transferencia en la observación.',
  },
  {
    categoria: 'Primeros pasos',
    pregunta: '¿Cómo agrego un cliente nuevo?',
    respuesta:
      'Ve a Clientes → “Nuevo cliente”. Solo el nombre es obligatorio; la cédula, el teléfono y el límite de crédito pueden completarse después desde su ficha.',
  },
  {
    categoria: 'Fiados y abonos',
    pregunta: '¿Qué pasa si un cliente se pasa del límite de crédito?',
    respuesta:
      'El sistema avisa antes de guardar: si el nuevo saldo supera el límite configurado, la operación queda bloqueada. Puedes subir el límite desde la ficha del cliente o cobrar un abono primero.',
  },
  {
    categoria: 'Fiados y abonos',
    pregunta: '¿Cómo salgo la cuenta completa de un cliente?',
    respuesta:
      'En el modal de abono usa el botón “Saldar cuenta completa”: calcula el saldo actual y registra el abono de una sola vez.',
  },
  {
    categoria: 'Fiados y abonos',
    pregunta: '¿Qué es el Libro de Fiados?',
    respuesta:
      'Es el historial completo de movimientos de la tienda. Puedes filtrarlo por tipo (fiado o abono), por periodo, buscar por nombre o número de recibo y exportarlo a Excel (CSV).',
  },
  {
    categoria: 'Clientes',
    pregunta: '¿Cómo veo el estado de cuenta de un cliente?',
    respuesta:
      'Entra a su ficha: verás saldo total, uso del límite, historial y el botón “Generar Recibo (PDF)” que descarga un estado de cuenta con saldos corridos y totales.',
  },
  {
    categoria: 'Clientes',
    pregunta: '¿Puedo buscar por cédula o teléfono?',
    respuesta:
      'Sí. La barra superior (atajo Ctrl/⌘ + K) y el buscador de Clientes aceptan nombre, cédula y teléfono; también puedes filtrar por deudores o solventes.',
  },
  {
    categoria: 'Reportes',
    pregunta: '¿Qué incluye el Reporte general de cuentas?',
    respuesta:
      'Todas las cuentas de todos los clientes, deban o no: fiado, abonado, saldo, último movimiento y estado (Debe, Al día o A favor), con filtros, búsqueda y exportación a CSV.',
  },
  {
    categoria: 'Reportes',
    pregunta: '¿Cómo hago el corte de caja?',
    respuesta:
      'En Reportes y Cierre elige el periodo (hoy, 7 días, 30 días o mes), revisa los KPIs y la cartera por cobrar, y usa “Exportar corte” para descargar el CSV con todos los movimientos del período.',
  },
  {
    categoria: 'Cuenta y seguridad',
    pregunta: '¿Cómo cambio mi contraseña?',
    respuesta:
      'En Configuración → “Cambiar contraseña”. Se valida contra Supabase y aplica de inmediato en todos los equipos donde entres con ese correo.',
  },
  {
    categoria: 'Cuenta y seguridad',
    pregunta: '¿Para qué sirve el PIN y cada cuánto pide?',
    respuesta:
      'El PIN solo reanuda la sesión después de 10 minutos de inactividad, sin cerrar la sesión. En un equipo nuevo siempre se pide primero correo y contraseña. El PIN se guarda por dispositivo y se cambia en Configuración.',
  },
  {
    categoria: 'Cuenta y seguridad',
    pregunta: '¿Cómo agrego a otra persona de la caja?',
    respuesta:
      'En Configuración → “Usuarios funcionales” crea el acceso con nombre, correo y contraseña inicial. La persona nueva debe abrir el correo de confirmación antes de poder entrar.',
  },
  {
    categoria: 'Problemas comunes',
    pregunta: 'La app dice “Faltan variables de Supabase”',
    respuesta:
      'El archivo .env no tiene VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Crea el .env a partir de .env.example, reinicia el servidor de desarrollo y vuelve a entrar.',
  },
  {
    categoria: 'Problemas comunes',
    pregunta: 'Me bloqueó la pantalla y no recuerdo el PIN',
    respuesta:
      'El PIN se guarda en el dispositivo. Si lo olvidaste, desde Configuración cámbialo con el PIN vigente, o restablece el valor de respaldo VITE_PIN_DEMO en el .env y reinicia.',
  },
  {
    categoria: 'Problemas comunes',
    pregunta: 'Los datos no cargan o aparece un error en rojo',
    respuesta:
      'Revisa tu conexión y pulsa “Probar conexión con la base de datos” más abajo. Si persiste, copia el diagnóstico y envíalo al soporte.',
  },
]

const ATAJOS: { tecla: string; accion: string }[] = [
  { tecla: 'Ctrl / ⌘ + K', accion: 'Buscar cliente, cédula o teléfono' },
  { tecla: 'Enter', accion: 'Confirmar el PIN de 4 dígitos' },
  { tecla: 'Backspace', accion: 'Borrar el último dígito del PIN' },
  { tecla: 'Esc', accion: 'Cerrar el modal abierto' },
]

function diagnostico(): string {
  return [
    `${NOMBRE_TIENDA} · soporte técnico`,
    `Fecha: ${new Date().toLocaleString('es-CO')}`,
    `Página: ${window.location.origin}`,
    `En línea: ${navigator.onLine ? 'sí' : 'no'}`,
    `Navegador: ${navigator.userAgent}`,
  ].join('\n')
}

export default function Ayuda() {
  const [busqueda, setBusqueda] = useState('')
  const [conexion, setConexion] = useState<'idle' | 'probando' | 'ok' | 'fallo'>('idle')
  const [copiado, setCopiado] = useState(false)

  const texto = busqueda.trim().toLowerCase()
  const filtradas = useMemo(
    () =>
      PREGUNTAS.filter((item) =>
        texto
          ? `${item.categoria} ${item.pregunta} ${item.respuesta}`.toLowerCase().includes(texto)
          : true,
      ),
    [texto],
  )

  const categorias = useMemo(() => {
    const mapa = new Map<string, Pregunta[]>()
    for (const item of filtradas) {
      const lista = mapa.get(item.categoria) ?? []
      lista.push(item)
      mapa.set(item.categoria, lista)
    }
    return [...mapa.entries()]
  }, [filtradas])

  const probarConexion = async () => {
    setConexion('probando')
    try {
      await obtenerTasas()
      setConexion('ok')
    } catch {
      setConexion('fallo')
    }
  }

  const copiarDiagnostico = async () => {
    try {
      await navigator.clipboard.writeText(diagnostico())
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2200)
    } catch {
      setCopiado(false)
    }
  }

  const enviarCorreo = () => {
    const asunto = encodeURIComponent(`Soporte ${NOMBRE_TIENDA}`)
    const cuerpo = encodeURIComponent(`${diagnostico()}\n\nDescribe el problema:\n`)
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Ayuda y Soporte</h1>
          <p className="text-sm text-gray-500">
            Guías de uso del mostrador, atajos y contacto con soporte.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar en la ayuda…"
            aria-label="Buscar en la ayuda"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green"
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <header className="mb-4 flex items-center gap-2">
          <LifeBuoy size={17} aria-hidden className="text-apple-green-dark" />
          <h2 className="text-base font-semibold text-gray-800">Preguntas frecuentes</h2>
          <span className="ml-auto text-xs font-semibold text-gray-400">
            {filtradas.length} de {PREGUNTAS.length}
          </span>
        </header>

        {filtradas.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-gray-800">Sin resultados</p>
            <p className="mt-1 text-xs text-gray-500">
              Prueba con otra palabra, por ejemplo “abono”, “PIN” o “corte”.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {categorias.map(([categoria, items]) => (
              <div key={categoria}>
                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  {categoria}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <details
                      key={item.pregunta}
                      className="group rounded-lg border border-gray-100 px-4 py-3 transition-colors hover:border-gray-200"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-800">
                        {item.pregunta}
                        <ChevronDown
                          size={15}
                          aria-hidden
                          className="shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                        />
                      </summary>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">{item.respuesta}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center gap-2">
            <Keyboard size={17} aria-hidden className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-800">Atajos de teclado</h2>
          </header>
          <ul className="divide-y divide-gray-100">
            {ATAJOS.map((atajo) => (
              <li key={atajo.tecla} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-xs text-gray-600">{atajo.accion}</span>
                <kbd className="shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                  {atajo.tecla}
                </kbd>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <header className="mb-4 flex items-center gap-2">
            <LifeBuoy size={17} aria-hidden className="text-apple-green-dark" />
            <h2 className="text-base font-semibold text-gray-800">Soporte</h2>
          </header>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
              <span className="text-xs text-gray-600">Conexión con la base de datos</span>
              <button
                type="button"
                onClick={() => void probarConexion()}
                disabled={conexion === 'probando'}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:border-apple-green hover:text-apple-green-dark disabled:opacity-60"
              >
                <RefreshCw
                  size={12}
                  aria-hidden
                  className={conexion === 'probando' ? 'animate-spin' : undefined}
                />
                {conexion === 'probando'
                  ? 'Probando…'
                  : conexion === 'ok'
                    ? 'Conectado'
                    : conexion === 'fallo'
                      ? 'Sin conexión'
                      : 'Probar'}
              </button>
            </div>
            {conexion === 'ok' && (
              <p className="text-[11px] font-medium text-apple-green-dark">
                Supabase respondió correctamente.
              </p>
            )}
            {conexion === 'fallo' && (
              <p className="text-[11px] font-medium text-coral">
                No se pudo contactar a Supabase. Revisa tu conexión.
              </p>
            )}

            <button type="button" onClick={() => void copiarDiagnostico()} className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-apple-green hover:text-apple-green-dark">
              <span className="flex items-center justify-center gap-2">
                <ClipboardCopy size={15} aria-hidden />
                {copiado ? 'Diagnóstico copiado' : 'Copiar diagnóstico técnico'}
              </span>
            </button>

            <button
              type="button"
              onClick={enviarCorreo}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-apple-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98]"
            >
              <Send size={15} aria-hidden />
              Enviar mensaje a soporte
            </button>

            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-gray-400">
              <Mail size={13} aria-hidden className="mt-0.5 shrink-0" />
              El mensaje abre en tu correo con el diagnóstico adjunto (versión, navegador y estado
              de conexión) para que el soporte responda más rápido.
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}
