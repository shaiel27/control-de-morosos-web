import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Download,
  Loader2,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Wallet,
  X,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Cargando from '../components/Cargando'
import {
  formatFecha,
  formatHora,
  formatMoney,
  iniciales,
  parseMonto,
  plural,
  textoMonto,
} from '../lib/money'
import { generarReciboCliente } from '../lib/reciboPdf'
import { movimientosDe, saldoDe } from '../lib/selectors'
import { useApp } from '../store'

export default function ClientProfile() {
  const { clienteId } = useParams()
  const clientes = useApp((estado) => estado.clientes)
  const transacciones = useApp((estado) => estado.transacciones)
  const tasas = useApp((estado) => estado.tasas)
  const moneda = useApp((estado) => estado.moneda)
  const cargando = useApp((estado) => estado.cargando)
  const definirMoneda = useApp((estado) => estado.definirMoneda)
  const abrirModal = useApp((estado) => estado.abrirModal)
  const actualizarLimite = useApp((estado) => estado.actualizarLimite)
  const actualizarCedula = useApp((estado) => estado.actualizarCedula)

  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [avisoPdf, setAvisoPdf] = useState<{ ok: boolean; texto: string } | null>(null)
  const [editandoCedula, setEditandoCedula] = useState(false)
  const [cedulaTexto, setCedulaTexto] = useState('')
  const [errorCedula, setErrorCedula] = useState('')
  const [guardandoCedula, setGuardandoCedula] = useState(false)
  const [cedulaGuardada, setCedulaGuardada] = useState(false)
  const [editandoLimite, setEditandoLimite] = useState(false)
  const [limiteTexto, setLimiteTexto] = useState('')
  const [errorLimite, setErrorLimite] = useState('')
  const [guardandoLimite, setGuardandoLimite] = useState(false)
  const [limiteGuardado, setLimiteGuardado] = useState(false)

  const cliente = clientes.find((c) => c.id === clienteId)

  if (cargando) {
    return (
      <div className="space-y-5">
        <Volver />
        <Cargando />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
        <p className="text-sm font-semibold text-gray-800">Este cliente ya no existe</p>
        <Link
          to="/app/clientes"
          className="mt-3 inline-block rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Volver al directorio
        </Link>
      </div>
    )
  }

  const saldo = saldoDe(transacciones, cliente.id)
  const historial = movimientosDe(transacciones, cliente.id)
  const debe = saldo > 0
  const monedas: ('COP' | 'USD' | 'VED')[] = ['COP', 'USD', 'VED']
  const limite = cliente.limiteCreditoCop
  const usado = Math.max(saldo, 0)
  const porcentaje = limite ? Math.round((usado / limite) * 100) : 0
  const agotado = limite !== null && usado >= limite

  const mostrarAviso = (aviso: { ok: boolean; texto: string }) => {
    setAvisoPdf(aviso)
    window.setTimeout(() => setAvisoPdf(null), 3200)
  }

  const generarPdf = async () => {
    setGenerandoPdf(true)
    try {
      await generarReciboCliente({ cliente, transacciones, tasas })
      mostrarAviso({ ok: true, texto: 'Recibo PDF descargado' })
    } catch {
      mostrarAviso({ ok: false, texto: 'No se pudo generar el PDF' })
    } finally {
      setGenerandoPdf(false)
    }
  }

  const abrirEdicionLimite = () => {
    setLimiteTexto(limite !== null ? textoMonto(limite) : '')
    setErrorLimite('')
    setEditandoLimite(true)
  }

  const guardarLimite = async () => {
    const texto = limiteTexto.trim()
    const valor = texto ? parseMonto(texto, 'COP', tasas) : null
    if (texto && (valor === null || valor <= 0)) {
      setErrorLimite('El límite debe ser mayor que cero.')
      return
    }
    setErrorLimite('')
    setGuardandoLimite(true)
    const ok = await actualizarLimite(cliente.id, valor)
    setGuardandoLimite(false)
    if (!ok) {
      setErrorLimite(useApp.getState().error ?? 'No se pudo guardar el límite.')
      return
    }
    setEditandoLimite(false)
    setLimiteGuardado(true)
    window.setTimeout(() => setLimiteGuardado(false), 2200)
  }

  const abrirEdicionCedula = () => {
    setCedulaTexto(cliente.cedula)
    setErrorCedula('')
    setEditandoCedula(true)
  }

  const guardarCedula = async () => {
    const limpia = cedulaTexto.replace(/\D/g, '')
    if (limpia && limpia.length < 4) {
      setErrorCedula('La cédula debe tener al menos 4 dígitos.')
      return
    }
    setErrorCedula('')
    setGuardandoCedula(true)
    const ok = await actualizarCedula(cliente.id, limpia)
    setGuardandoCedula(false)
    if (!ok) {
      setErrorCedula(useApp.getState().error ?? 'No se pudo guardar la cédula.')
      return
    }
    setEditandoCedula(false)
    setCedulaGuardada(true)
    window.setTimeout(() => setCedulaGuardada(false), 2200)
  }

  const equivalentes = monedas
    .filter((opcion) => opcion !== moneda)
    .map((opcion) => `${formatMoney(saldo, opcion, tasas)} ${opcion}`)
    .join(' · ')

  return (
    <div className="space-y-5">
      <Volver />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-xl font-bold text-gray-500">
                {iniciales(cliente.nombre, cliente.apellido)}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-800">
                    {cliente.nombre} {cliente.apellido}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      debe
                        ? 'bg-coral-soft text-coral-dark'
                        : 'bg-apple-green-soft text-apple-green-dark'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${debe ? 'bg-coral' : 'bg-apple-green'}`}
                      aria-hidden
                    />
                    {debe ? 'Con fiado vigente' : 'Cuenta solvente'}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 [&>span]:whitespace-nowrap">
                  <span className="flex items-center gap-1.5 font-medium text-gray-700">
                    <Phone size={13} aria-hidden />
                    {cliente.telefono}
                  </span>
                  {editandoCedula ? (
                    <span className="flex items-center gap-1.5">
                      <input
                        inputMode="numeric"
                        maxLength={12}
                        value={cedulaTexto}
                        onChange={(evento) => {
                          setCedulaTexto(evento.target.value.replace(/\D/g, ''))
                          setErrorCedula('')
                        }}
                        aria-label="Cédula del cliente"
                        placeholder="1000000001"
                        autoFocus
                        className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold tabular-nums text-gray-800 outline-none transition-colors focus:border-apple-green"
                      />
                      <button
                        type="button"
                        onClick={() => void guardarCedula()}
                        disabled={guardandoCedula}
                        aria-label="Guardar cédula"
                        title="Guardar cédula"
                        className="rounded-md bg-apple-green p-1 text-white transition-colors hover:bg-apple-green-dark disabled:opacity-50"
                      >
                        {guardandoCedula ? (
                          <Loader2 size={12} className="animate-spin" aria-hidden />
                        ) : (
                          <Check size={12} aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoCedula(false)
                          setErrorCedula('')
                        }}
                        aria-label="Cancelar edición de cédula"
                        title="Cancelar"
                        className="rounded-md border border-gray-200 bg-white p-1 text-gray-500 transition-colors hover:bg-gray-100"
                      >
                        <X size={12} aria-hidden />
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      CC {cliente.cedula || 'sin registrar'}
                      <button
                        type="button"
                        onClick={abrirEdicionCedula}
                        aria-label="Editar cédula"
                        title="Editar cédula"
                        className="rounded-md p-0.5 text-gray-400 transition-colors hover:text-apple-green-dark"
                      >
                        <Pencil size={11} aria-hidden />
                      </button>
                    </span>
                  )}
                  <span>Cliente desde {formatFecha(cliente.desde)}</span>
                </div>
                {errorCedula && (
                  <p className="mt-1 text-[11px] font-semibold text-coral" role="alert">
                    {errorCedula}
                  </p>
                )}
                {cedulaGuardada && (
                  <p className="mt-1 text-[11px] font-semibold text-apple-green-dark" role="status">
                    Cédula actualizada
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => void generarPdf()}
                disabled={generandoPdf}
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm font-semibold text-apple-green-dark transition-colors hover:bg-apple-green-soft disabled:cursor-wait disabled:opacity-60 sm:w-auto"
              >
                {generandoPdf ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                ) : (
                  <Download size={16} aria-hidden />
                )}
                {generandoPdf ? 'Generando…' : 'Generar Recibo (PDF)'}
              </button>
              {avisoPdf && (
                <span
                  role={avisoPdf.ok ? 'status' : 'alert'}
                  className={`absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-medium text-white shadow-lg ${
                    avisoPdf.ok ? 'bg-apple-green-dark' : 'bg-coral'
                  }`}
                >
                  {avisoPdf.texto}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <span className="block text-xs text-gray-500">Movimientos</span>
              <span className="text-base font-bold text-gray-800 tabular-nums">
                {historial.length}
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <span className="block text-xs text-gray-500">Último movimiento</span>
              <span className="text-base font-bold text-gray-800">
                {historial[0] ? formatFecha(historial[0].fecha) : '—'}
              </span>
            </div>
            <div className="col-span-2 rounded-lg bg-gray-50 p-3 sm:col-span-1">
              <span className="block text-xs text-gray-500">Estado</span>
              <span
                className={`text-base font-bold ${debe ? 'text-coral' : 'text-apple-green-dark'}`}
              >
                {debe
                  ? plural(
                      historial.filter((t) => t.tipo === 'fiado').length,
                      'fiado',
                      'fiados',
                    )
                  : 'Sin deuda'}
              </span>
            </div>
          </div>
        </article>

        <article className="flex flex-col rounded-xl border border-l-4 border-gray-200 border-l-coral bg-white p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-wide text-gray-500">
              Saldo total actual
            </span>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {monedas.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => definirMoneda(opcion)}
                  aria-pressed={moneda === opcion}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    moneda === opcion
                      ? 'bg-white text-apple-green-dark shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p
              className={`text-4xl font-bold tracking-tight tabular-nums ${
                debe ? 'text-coral' : 'text-apple-green-dark'
              }`}
            >
              {formatMoney(saldo, moneda, tasas)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{equivalentes}</p>
          </div>

          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-gray-500">Límite de crédito</span>
              {editandoLimite ? (
                <span className="text-[11px] font-semibold text-apple-green-dark">
                  Editando…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums text-gray-700">
                    {limite !== null ? formatMoney(limite, moneda, tasas) : 'Sin límite'}
                  </span>
                  <button
                    type="button"
                    onClick={abrirEdicionLimite}
                    aria-label="Editar límite de crédito"
                    title="Editar límite de crédito"
                    className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-apple-green hover:text-apple-green-dark"
                  >
                    <Pencil size={12} aria-hidden />
                  </button>
                </span>
              )}
            </div>

            {editandoLimite ? (
              <div className="mt-2 space-y-2">
                <input
                  inputMode="decimal"
                  value={limiteTexto}
                  onChange={(evento) => {
                    setLimiteTexto(evento.target.value.replace(/[^\d.,]/g, ''))
                    setErrorLimite('')
                  }}
                  placeholder="Ej. 500.000"
                  aria-label="Nuevo límite de crédito en pesos"
                  autoFocus
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold tabular-nums text-gray-800 outline-none transition-colors focus:border-apple-green"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-500">
                    Vacío = sin límite de crédito
                  </span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoLimite(false)
                        setErrorLimite('')
                      }}
                      className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void guardarLimite()}
                      disabled={guardandoLimite}
                      className="inline-flex items-center gap-1.5 rounded-md bg-apple-green px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-apple-green-dark disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {guardandoLimite ? (
                        'Guardando…'
                      ) : (
                        <>
                          <Check size={12} aria-hidden />
                          Guardar
                        </>
                      )}
                    </button>
                  </span>
                </div>
                <p className="min-h-3 text-[11px] font-semibold text-coral" role="alert">
                  {errorLimite}
                </p>
              </div>
            ) : (
              <>
                {limite !== null && (
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${agotado ? 'bg-coral' : 'bg-apple-green'}`}
                      style={{ width: `${Math.min(porcentaje, 100)}%` }}
                    />
                  </div>
                )}
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {limite === null
                    ? 'Sin límite de crédito. Define uno para avisar al superarlo.'
                    : agotado
                      ? 'Crédito agotado. Registra un abono o amplía el límite.'
                      : `Disponible ${formatMoney(limite - usado, moneda, tasas)} · usado ${porcentaje}%`}
                </p>
                {limiteGuardado && (
                  <p className="text-[11px] font-semibold text-apple-green-dark" role="status">
                    Límite actualizado
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={() => abrirModal({ tipo: 'fiado', clienteId: cliente.id })}
              className="flex items-center justify-center gap-2 rounded-lg border border-coral px-4 py-3 text-sm font-semibold text-coral transition-colors hover:bg-coral-soft active:scale-[0.98]"
            >
              <Plus size={16} aria-hidden />
              Fiar
            </button>
            <button
              type="button"
              onClick={() => abrirModal({ tipo: 'abono', clienteId: cliente.id })}
              className="flex items-center justify-center gap-2 rounded-lg bg-apple-green px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98]"
            >
              <Wallet size={16} aria-hidden />
              Abonar
            </button>
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Libro Mayor</h2>
            <p className="text-xs text-gray-500">
              {historial.length} movimiento{historial.length === 1 ? '' : 's'} registrado
              {historial.length === 1 ? '' : 's'} en esta cuenta
            </p>
          </div>
          <a
            href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-apple-green hover:text-apple-green-dark"
          >
            <MessageCircle size={14} aria-hidden />
            WhatsApp
          </a>
        </header>

        {historial.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-gray-800">Sin movimientos todavía</p>
            <p className="mt-1 text-xs text-gray-500">
              Registra el primer fiado o abono para abrir el historial de esta cuenta.
            </p>
          </div>
        ) : (
          <ul className="scrollbar-slim max-h-[28rem] divide-y divide-gray-100 overflow-y-auto">
            {historial.map((tx) => {
              const esFiado = tx.tipo === 'fiado'
              return (
                <li
                  key={tx.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-gray-50 sm:flex-nowrap sm:px-5 sm:py-3.5"
                >
                  <span className="w-full shrink-0 whitespace-nowrap text-xs text-gray-500 sm:w-auto">
                    <span className="font-medium text-gray-700">{formatFecha(tx.fecha)}</span>
                    <span className="tabular-nums"> · {formatHora(tx.fecha)}</span>
                  </span>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      esFiado ? 'bg-coral-soft text-coral-dark' : 'bg-apple-green-soft text-apple-green-dark'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${esFiado ? 'bg-coral' : 'bg-apple-green'}`}
                      aria-hidden
                    />
                    {esFiado ? 'Fiado' : 'Abono'}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-800">
                      {tx.observacion}
                    </span>
                    <span className="flex flex-wrap items-center gap-1 text-[11px] text-gray-400">
                      <Receipt size={11} aria-hidden />
                      Recibo {esFiado ? 'F' : 'A'}-{tx.id.slice(-4).toUpperCase()}
                      {tx.referencia && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-600">
                          Ref. {tx.referencia}
                        </span>
                      )}
                    </span>
                  </span>

                  <span
                    className={`ml-auto shrink-0 text-sm font-bold tabular-nums sm:ml-0 ${
                      esFiado ? 'text-coral' : 'text-apple-green-dark'
                    }`}
                  >
                    {esFiado ? '+' : '−'}
                    {formatMoney(tx.montoCop, moneda, tasas)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Volver() {
  return (
    <Link
      to="/app/clientes"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition-colors hover:text-apple-green-dark"
    >
      <ArrowLeft size={16} aria-hidden />
      Directorio de clientes
    </Link>
  )
}
