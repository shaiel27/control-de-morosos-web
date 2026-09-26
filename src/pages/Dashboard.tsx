import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import Cargando from '../components/Cargando'
import ConversorRapido from '../components/ConversorRapido'
import { formatFecha, formatHora, formatMoney, inicialesDe, plural } from '../lib/money'
import type { Moneda } from '../lib/types'
import { resumenCartera, ultimasTransacciones } from '../lib/selectors'
import { useApp } from '../store'

export default function Dashboard() {
  const navigate = useNavigate()
  const clientes = useApp((estado) => estado.clientes)
  const transacciones = useApp((estado) => estado.transacciones)
  const tasas = useApp((estado) => estado.tasas)
  const moneda = useApp((estado) => estado.moneda)
  const cargando = useApp((estado) => estado.cargando)
  const abrirModal = useApp((estado) => estado.abrirModal)
  const [conversorAbierto, setConversorAbierto] = useState(false)

  useEffect(() => {
    if (!conversorAbierto) return
    const manejar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setConversorAbierto(false)
    }
    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  }, [conversorAbierto])

  if (cargando) {
    return (
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Panel</h1>
          <p className="text-sm text-gray-500">Resumen de la cartera y la caja.</p>
        </section>
        <Cargando />
      </div>
    )
  }

  const resumen = resumenCartera(clientes, transacciones)
  const recientes = ultimasTransacciones(transacciones, 5)
  const otraMoneda: Moneda = moneda === 'COP' ? 'USD' : 'COP'
  const hayTasaDe = (monedaDe: Moneda) =>
    monedaDe === 'COP' || (monedaDe === 'USD' ? tasas.usdCop > 0 : tasas.usdVes > 0)
  const equivalencia = (monto: number) =>
    hayTasaDe(otraMoneda)
      ? `≈ ${formatMoney(monto, otraMoneda, tasas)} en ${otraMoneda}`
      : ''
  const nombreDe = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId)
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente eliminado'
  }

  const metricas = [
    {
      etiqueta: 'Total por cobrar',
      valor: formatMoney(resumen.porCobrar, moneda, tasas),
      sufijo: moneda,
      detalle: equivalencia(resumen.porCobrar),
      pie: plural(resumen.conDeuda, 'cliente con saldo', 'clientes con saldo'),
      icono: Wallet,
      acento: 'border-l-coral',
      chip: 'bg-coral-soft text-coral',
      texto: 'text-coral',
    },
    {
      etiqueta: 'Clientes con deuda',
      valor: String(resumen.conDeuda),
      sufijo: `de ${resumen.clientesTotales}`,
      detalle: 'Cartera activa al día de hoy',
      pie: plural(
        resumen.clientesTotales - resumen.conDeuda,
        'cliente solvente',
        'clientes solventes',
      ),
      icono: Users,
      acento: 'border-l-gray-800',
      chip: 'bg-gray-100 text-gray-700',
      texto: 'text-gray-800',
    },
    {
      etiqueta: 'Recuperado este mes',
      valor: formatMoney(resumen.recuperadoMes, moneda, tasas),
      sufijo: moneda,
      detalle: equivalencia(resumen.recuperadoMes),
      pie: plural(resumen.abonosMes, 'abono registrado', 'abonos registrados'),
      icono: TrendingUp,
      acento: 'border-l-apple-green',
      chip: 'bg-apple-green-soft text-apple-green-dark',
      texto: 'text-apple-green-dark',
    },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Panel</h1>
          <p className="text-sm text-gray-500">
            Resumen de la cartera y movimientos de las últimas horas.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:flex">
          <button
            type="button"
            onClick={() => navigate('/app/clientes', { state: { nuevo: true } })}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-apple-green px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98] sm:gap-2 sm:px-4 sm:text-sm"
          >
            <UserPlus size={16} aria-hidden />
            Nuevo Cliente
          </button>
          <button
            type="button"
            onClick={() => abrirModal({ tipo: 'fiado', clienteId: null })}
            className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-coral px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-coral-dark active:scale-[0.98] sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus size={16} aria-hidden />
            Transacción Rápida
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {metricas.map(({ etiqueta, valor, sufijo, detalle, pie, icono: Icono, acento, chip, texto }) => (
          <article
            key={etiqueta}
            className={`rounded-xl border border-l-4 border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${acento}`}
          >
            <div className="mb-2.5 flex items-center justify-between sm:mb-3">
              <span className="text-sm font-medium text-gray-500">{etiqueta}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${chip}`}>
                <Icono size={17} aria-hidden />
              </span>
            </div>
            <div
              className={`text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${texto}`}
            >
              {valor} <span className="text-sm font-semibold opacity-70">{sufijo}</span>
            </div>
            {detalle && <p className="mt-1 text-xs text-gray-500">{detalle}</p>}
            <p className="mt-3 border-t border-gray-100 pt-3 text-xs font-semibold text-gray-600 sm:mt-4">
              {pie}
            </p>
          </article>
        ))}
      </section>

      <button
        type="button"
        onClick={() => setConversorAbierto(true)}
        className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-apple-green lg:hidden"
      >
        <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <ArrowLeftRight size={16} aria-hidden />
          </span>
          Conversor rápido
        </span>
        <span className="text-xs font-medium text-gray-400">USD · COP · VED</span>
      </button>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
        <header className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Actividad Reciente</h2>
            <p className="text-xs text-gray-500">Últimos 5 movimientos registrados en caja</p>
          </div>
          <Link
            to="/app/libro"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-apple-green-dark hover:underline"
          >
            Ver libro completo
            <ArrowRight size={14} aria-hidden />
          </Link>
        </header>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="hidden px-5 py-3 sm:table-cell">Fecha</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Tipo</th>
              <th className="px-5 py-3 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {recientes.map((tx) => {
              const esFiado = tx.tipo === 'fiado'
              return (
                <tr key={tx.id} className="transition-colors hover:bg-gray-50">
                  <td className="hidden whitespace-nowrap px-5 py-3.5 sm:table-cell">
                    <div className="font-medium text-gray-800">{formatFecha(tx.fecha)}</div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Clock size={11} aria-hidden />
                      {formatHora(tx.fecha)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500 sm:flex">
                        {inicialesDe(nombreDe(tx.clienteId))}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-gray-800">
                          {nombreDe(tx.clienteId)}
                        </span>
                        <span className="block truncate text-[11px] text-gray-400 sm:hidden">
                          {formatFecha(tx.fecha)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        esFiado ? 'bg-coral-soft text-coral-dark' : 'bg-apple-green-soft text-apple-green-dark'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${esFiado ? 'bg-coral' : 'bg-apple-green'}`}
                        aria-hidden
                      />
                      {esFiado ? 'Fiado' : 'Abono'}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums ${
                      esFiado ? 'text-coral' : 'text-apple-green-dark'
                    }`}
                  >
                    {esFiado ? '+' : '−'}
                    {formatMoney(tx.montoCop, moneda, tasas)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <footer className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
          <span>
            Cartera activa:{' '}
            <strong className="text-gray-800">
              {plural(resumen.conDeuda, 'cliente', 'clientes')}
            </strong>{' '}
            con deuda
          </span>
          <Link to="/app/clientes" className="font-semibold text-apple-green-dark hover:underline">
            Abrir directorio
          </Link>
        </footer>
      </section>

        <aside className="hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:block">
          <ConversorRapido />
        </aside>
      </div>

      {conversorAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setConversorAbierto(false)
          }}
        >
          <div
            role="dialog"
            aria-label="Conversor rápido"
            className="animate-modal w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <ArrowLeftRight size={17} aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">Conversor rápido</h2>
                  <p className="text-xs text-gray-500">
                    Del monto capturado a pesos, bolívares y dólares
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConversorAbierto(false)}
                aria-label="Cerrar ventana"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={17} aria-hidden />
              </button>
            </header>
            <div className="p-5">
              <ConversorRapido sinCabecera />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
