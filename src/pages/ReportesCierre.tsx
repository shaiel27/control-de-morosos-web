import { useMemo, useState } from 'react'
import {
  ChartNoAxesColumn,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Lock,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Cargando from '../components/Cargando'
import { exportarCSV, nombreDeArchivo } from '../lib/exportar'
import { formatFecha, formatHora, formatMoney, inicialesDe, plural } from '../lib/money'
import {
  clientesConDeuda,
  cuentasGenerales,
  desdeDias,
  desdeHoy,
  desdeMes,
  enRango,
  ordenarDesc,
  resumenPeriodo,
  serieDiaria,
} from '../lib/selectors'
import { useApp } from '../store'

type RangoReporte = 'hoy' | '7' | '30' | 'mes'
type FiltroCuenta = 'todos' | 'deuda' | 'solvente'

const FILTROS_CUENTA: { id: FiltroCuenta; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todas' },
  { id: 'deuda', etiqueta: 'Con deuda' },
  { id: 'solvente', etiqueta: 'Sin deuda' },
]

const promedioDiario = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

const RANGOS: { id: RangoReporte; etiqueta: string }[] = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: '7', etiqueta: '7 días' },
  { id: '30', etiqueta: '30 días' },
  { id: 'mes', etiqueta: 'Mes actual' },
]

const diaFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })

function desdeDe(rango: RangoReporte): Date {
  if (rango === 'hoy') return desdeHoy()
  if (rango === 'mes') return desdeMes()
  return desdeDias(Number(rango)) ?? desdeHoy()
}

export default function ReportesCierre() {
  const clientes = useApp((estado) => estado.clientes)
  const transacciones = useApp((estado) => estado.transacciones)
  const tasas = useApp((estado) => estado.tasas)
  const moneda = useApp((estado) => estado.moneda)
  const cargando = useApp((estado) => estado.cargando)

  const [rango, setRango] = useState<RangoReporte>('7')
  const [aviso, setAviso] = useState('')
  const [filtroCuenta, setFiltroCuenta] = useState<FiltroCuenta>('todos')
  const [busquedaCuenta, setBusquedaCuenta] = useState('')

  const cuentas = useMemo(() => cuentasGenerales(clientes, transacciones), [clientes, transacciones])

  if (cargando) {
    return (
      <div className="space-y-5">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Reportes y Cierre</h1>
          <p className="text-sm text-gray-500">
            Corte de caja, cartera pendiente y exportaciones.
          </p>
        </section>
        <Cargando />
      </div>
    )
  }

  const desde = desdeDe(rango)
  const etiquetaRango = RANGOS.find((opcion) => opcion.id === rango)?.etiqueta ?? ''
  const periodo = ordenarDesc(enRango(transacciones, desde))
  const resumen = resumenPeriodo(periodo)
  const serie = serieDiaria(transacciones, 7)
  const deudores = clientesConDeuda(clientes, transacciones).slice(0, 6)

  const maximoDia = Math.max(1, ...serie.map((dia) => Math.max(dia.fiado, dia.abono)))
  const maxDeuda = Math.max(1, ...deudores.map((fila) => fila.saldo))

  const textoBusqueda = busquedaCuenta.trim().toLowerCase()
  const cuentasFiltradas = cuentas.filter((fila) => {
    if (filtroCuenta === 'deuda' && fila.saldo <= 0) return false
    if (filtroCuenta === 'solvente' && fila.saldo > 0) return false
    if (!textoBusqueda) return true
    const { cliente } = fila
    return `${cliente.nombre} ${cliente.apellido} ${cliente.telefono ?? ''} ${cliente.cedula ?? ''}`
      .toLowerCase()
      .includes(textoBusqueda)
  })

  const totalCartera = cuentas.reduce((total, fila) => total + Math.max(fila.saldo, 0), 0)
  const conDeuda = cuentas.filter((fila) => fila.saldo > 0).length
  const solventes = cuentas.length - conDeuda

  const nombreDe = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId)
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente eliminado'
  }

  const avisar = (texto: string) => {
    setAviso(texto)
    window.setTimeout(() => setAviso(''), 2600)
  }

  const exportar = () => {
    if (periodo.length === 0) return avisar('No hay movimientos en este período')
    const sufijo = rango === 'mes' ? 'mes' : rango === 'hoy' ? 'hoy' : `${rango}d`
    exportarCSV(
      nombreDeArchivo(`corte-${sufijo}`),
      ['Fecha', 'Hora', 'Cliente', 'Tipo', 'Observación', 'Monto COP'],
      periodo.map((tx) => [
        formatFecha(tx.fecha),
        formatHora(tx.fecha),
        nombreDe(tx.clienteId),
        tx.tipo === 'fiado' ? 'Fiado' : 'Abono',
        tx.observacion,
        tx.montoCop,
      ]),
    )
    avisar(`Corte exportado: ${plural(periodo.length, 'movimiento', 'movimientos')}`)
  }

  const cerrarCaja = () => {
    avisar(
      `Corte listo (demo): entraron ${formatMoney(resumen.abono, moneda, tasas)} y se fiaron ${formatMoney(resumen.fiado, moneda, tasas)}`,
    )
  }

  const estadoDe = (saldo: number) => {
    if (saldo > 0) return { texto: 'Debe', clase: 'bg-coral-soft text-coral' }
    if (saldo < 0) return { texto: 'A favor', clase: 'bg-apple-green-soft text-apple-green-dark' }
    return { texto: 'Al día', clase: 'bg-gray-100 text-gray-500' }
  }

  const exportarGeneral = () => {
    if (cuentasFiltradas.length === 0) return avisar('No hay cuentas para exportar')
    exportarCSV(
      nombreDeArchivo('reporte-general'),
      ['Cliente', 'Teléfono', 'Cédula', 'Fiado COP', 'Abonado COP', 'Saldo COP', 'Estado', 'Último movimiento'],
      cuentasFiltradas.map((fila) => [
        `${fila.cliente.nombre} ${fila.cliente.apellido}`,
        fila.cliente.telefono,
        fila.cliente.cedula,
        fila.fiado,
        fila.abono,
        fila.saldo,
        estadoDe(fila.saldo).texto,
        fila.ultimoMovimiento ? formatFecha(fila.ultimoMovimiento) : 'Sin movimientos',
      ]),
    )
    avisar(`Reporte general exportado: ${plural(cuentasFiltradas.length, 'cuenta', 'cuentas')}`)
  }

  const kpis = [
    {
      etiqueta: 'Fiado en el período',
      valor: formatMoney(resumen.fiado, moneda, tasas),
      sufijo: moneda,
      detalle: `${etiquetaRango} · ${plural(
        periodo.filter((tx) => tx.tipo === 'fiado').length,
        'fiado',
        'fiados',
      )}`,
      icono: TrendingDown,
      acento: 'border-l-coral',
      chip: 'bg-coral-soft text-coral',
      texto: 'text-coral',
    },
    {
      etiqueta: 'Abonado en el período',
      valor: formatMoney(resumen.abono, moneda, tasas),
      sufijo: moneda,
      detalle: `${etiquetaRango} · ${plural(
        periodo.filter((tx) => tx.tipo === 'abono').length,
        'abono',
        'abonos',
      )}`,
      icono: TrendingUp,
      acento: 'border-l-apple-green',
      chip: 'bg-apple-green-soft text-apple-green-dark',
      texto: 'text-apple-green-dark',
    },
    {
      etiqueta: 'Movimientos',
      valor: String(resumen.movimientos),
      sufijo: resumen.movimientos === 1 ? 'registro' : 'registros',
      detalle:
        resumen.movimientos === 0
          ? 'Nada registrado en este período'
          : `Promedio de ${promedioDiario.format(
              resumen.movimientos / Math.max(1, serie.length),
            )} movimientos al día`,
      icono: ClipboardList,
      acento: 'border-l-gray-800',
      chip: 'bg-gray-100 text-gray-700',
      texto: 'text-gray-800',
    },
  ]

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Reportes y Cierre</h1>
          <p className="text-sm text-gray-500">
            Corte de caja, cartera pendiente y exportaciones.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {RANGOS.map(({ id, etiqueta }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRango(id)}
                aria-pressed={rango === id}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  rango === id
                    ? 'border-gray-800 bg-gray-800 text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          <div className="relative self-start sm:self-auto">
            <button
              type="button"
              onClick={exportar}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-apple-green hover:text-apple-green-dark"
            >
              <Download size={16} aria-hidden />
              Exportar corte
            </button>
            {aviso && (
              <span
                role="status"
                className="absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg"
              >
                {aviso}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map(({ etiqueta, valor, sufijo, detalle, icono: Icono, acento, chip, texto }) => (
          <article
            key={etiqueta}
            className={`rounded-xl border border-l-4 border-gray-200 bg-white p-4 shadow-sm ${acento}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500">{etiqueta}</span>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${chip}`}>
                <Icono size={15} aria-hidden />
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${texto}`}>
              {valor} <span className="text-xs font-semibold opacity-70">{sufijo}</span>
            </p>
            <p className="mt-1 text-[11px] leading-snug text-gray-500">{detalle}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Reporte general de cuentas</h2>
            <p className="text-xs text-gray-500">
              Todas las cuentas de todos los clientes, deban o no.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTROS_CUENTA.map(({ id, etiqueta }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltroCuenta(id)}
                aria-pressed={filtroCuenta === id}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filtroCuenta === id
                    ? 'border-gray-800 bg-gray-800 text-white'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {etiqueta}
              </button>
            ))}

            <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
              <Search
                size={14}
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={busquedaCuenta}
                onChange={(evento) => setBusquedaCuenta(evento.target.value)}
                placeholder="Buscar cliente, teléfono o cédula"
                className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-800 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={exportarGeneral}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-apple-green hover:text-apple-green-dark"
            >
              <FileSpreadsheet size={14} aria-hidden />
              Exportar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 border-b border-gray-100 p-5 sm:grid-cols-4">
          <div>
            <span className="block text-[11px] font-medium text-gray-400">Cuentas</span>
            <span className="block text-lg font-bold tabular-nums text-gray-800">
              {cuentas.length}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-gray-400">Con deuda</span>
            <span className="block text-lg font-bold tabular-nums text-coral">{conDeuda}</span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-gray-400">Sin deuda</span>
            <span className="block text-lg font-bold tabular-nums text-apple-green-dark">
              {solventes}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-gray-400">Total por cobrar</span>
            <span className="block text-lg font-bold tabular-nums text-gray-800">
              {formatMoney(totalCartera, moneda, tasas)}
            </span>
          </div>
        </div>

        {cuentasFiltradas.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-gray-800">Sin resultados</p>
            <p className="mt-1 text-xs text-gray-500">
              {cuentas.length === 0
                ? 'Aún no hay clientes registrados.'
                : 'Ajusta la búsqueda o el filtro para ver cuentas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-2.5 font-semibold">Cliente</th>
                  <th className="px-3 py-2.5 font-semibold">Cédula</th>
                  <th className="px-3 py-2.5 font-semibold">Último movimiento</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Fiado</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Abonado</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cuentasFiltradas.map((fila) => {
                  const estado = estadoDe(fila.saldo)
                  return (
                    <tr key={fila.cliente.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link
                          to={`/app/clientes/${fila.cliente.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                            {inicialesDe(`${fila.cliente.nombre} ${fila.cliente.apellido}`)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-800">
                              {fila.cliente.nombre} {fila.cliente.apellido}
                            </span>
                            <span className="block truncate text-[11px] text-gray-400">
                              {fila.cliente.telefono || 'Sin teléfono'}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-xs tabular-nums text-gray-500">
                        {fila.cliente.cedula || '—'}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {fila.ultimoMovimiento ? formatFecha(fila.ultimoMovimiento) : 'Sin movimientos'}
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-gray-600">
                        {formatMoney(fila.fiado, moneda, tasas)}
                      </td>
                      <td className="px-3 py-3 text-right text-sm tabular-nums text-apple-green-dark">
                        {formatMoney(fila.abono, moneda, tasas)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-2 text-sm font-bold tabular-nums ${
                            fila.saldo > 0 ? 'text-coral' : 'text-gray-800'
                          }`}
                        >
                          {formatMoney(fila.saldo, moneda, tasas)}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50/60 text-sm font-bold text-gray-800">
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500" colSpan={3}>
                    {plural(cuentasFiltradas.length, 'cuenta', 'cuentas')} · Totales
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-coral">
                    {formatMoney(
                      cuentasFiltradas.reduce((total, fila) => total + fila.fiado, 0),
                      moneda,
                      tasas,
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-apple-green-dark">
                    {formatMoney(
                      cuentasFiltradas.reduce((total, fila) => total + fila.abono, 0),
                      moneda,
                      tasas,
                    )}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {formatMoney(
                      cuentasFiltradas.reduce((total, fila) => total + fila.saldo, 0),
                      moneda,
                      tasas,
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-7">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Movimientos por día</h2>
              <p className="text-xs text-gray-500">Últimos 7 días, fiado frente a abonado</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-coral" aria-hidden />
                Fiado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-apple-green" aria-hidden />
                Abonado
              </span>
              <ChartNoAxesColumn size={15} aria-hidden className="text-gray-300" />
            </div>
          </header>

          <div className="flex h-48 items-end gap-2 border-b border-gray-100 pb-1 sm:gap-3">
            {serie.map((dia) => (
              <div key={dia.clave} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/2 max-w-[16px] rounded-t-sm bg-coral transition-all"
                    style={{ height: `${(dia.fiado / maximoDia) * 100}%` }}
                    title={`${formatFecha(dia.fecha.toISOString())} · Fiado ${formatMoney(dia.fiado, moneda, tasas)}`}
                  />
                  <div
                    className="w-1/2 max-w-[16px] rounded-t-sm bg-apple-green transition-all"
                    style={{ height: `${(dia.abono / maximoDia) * 100}%` }}
                    title={`${formatFecha(dia.fecha.toISOString())} · Abonado ${formatMoney(dia.abono, moneda, tasas)}`}
                  />
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-gray-700">
                  {dia.fecha.getDate()}
                </span>
                <span className="-mt-1.5 text-[10px] text-gray-400">
                  {diaFmt.format(dia.fecha).slice(0, 3)}
                </span>
              </div>
            ))}
          </div>

          <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              Día más alto:{' '}
              <strong className="text-gray-800">
                {formatMoney(Math.max(...serie.map((dia) => Math.max(dia.fiado, dia.abono))), moneda, tasas)}
              </strong>
            </span>
            <span>
              Fiado en 7 días:{' '}
              <strong className="text-coral">
                {formatMoney(
                  serie.reduce((total, dia) => total + dia.fiado, 0),
                  moneda,
                  tasas,
                )}
              </strong>
            </span>
          </footer>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-5">
          <header className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Cartera por cobrar</h2>
              <p className="text-xs text-gray-500">Mayores saldos abiertos de la tienda</p>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              {plural(deudores.length, 'cliente', 'clientes')}
            </span>
          </header>

          {deudores.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-800">No hay deudas abiertas</p>
              <p className="mt-1 text-xs text-gray-500">Toda la cartera está solvente hoy.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {deudores.map(({ cliente, saldo }) => {
                const limite = cliente.limiteCreditoCop
                const agotado = limite !== null && saldo >= limite
                const uso =
                  limite !== null && limite > 0
                    ? Math.min(saldo / limite, 1)
                    : Math.min(saldo / maxDeuda, 1)
                return (
                  <li key={cliente.id} className="px-5 py-3.5">
                    <Link
                      to={`/app/clientes/${cliente.id}`}
                      className="block rounded-lg transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                          {inicialesDe(`${cliente.nombre} ${cliente.apellido}`)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-800">
                            {cliente.nombre} {cliente.apellido}
                          </span>
                          <span className="block truncate text-[11px] text-gray-400">
                            {cliente.telefono}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-coral">
                          {formatMoney(saldo, moneda, tasas)}
                        </span>
                      </div>
                      <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <span
                          className="block h-full rounded-full bg-coral"
                          style={{ width: `${uso * 100}%` }}
                        />
                      </span>
                      {limite !== null && (
                        <span
                          className={`mt-1 block text-[11px] font-semibold ${
                            agotado ? 'text-coral' : 'text-gray-400'
                          }`}
                        >
                          {agotado ? 'Crédito agotado' : `${Math.round((saldo / limite) * 100)}% del límite`}
                          {' · límite '}
                          {formatMoney(limite, moneda, tasas)}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </article>
      </section>

      <section className="rounded-xl bg-ink p-5 text-white shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Lock size={18} aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold">Corte de caja · {etiquetaRango}</h2>
              <p className="text-xs text-gray-400">
                {plural(resumen.movimientos, 'movimiento', 'movimientos')} desde{' '}
                {formatFecha(desde.toISOString())}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 lg:gap-8">
            <div>
              <span className="block text-[11px] font-medium text-gray-400">Fiado</span>
              <span className="block text-base font-bold tabular-nums text-coral">
                {formatMoney(resumen.fiado, moneda, tasas)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-gray-400">Abonado</span>
              <span className="block text-base font-bold tabular-nums text-apple-green">
                {formatMoney(resumen.abono, moneda, tasas)}
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-gray-400">Diferencia</span>
              <span
                className={`block text-base font-bold tabular-nums ${
                  resumen.diferencia >= 0 ? 'text-apple-green' : 'text-coral'
                }`}
              >
                {formatMoney(resumen.diferencia, moneda, tasas)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={exportar}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
            >
              <Download size={16} aria-hidden />
              Descargar CSV
            </button>
            <button
              type="button"
              onClick={cerrarCaja}
              className="flex items-center justify-center gap-2 rounded-lg bg-apple-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98]"
            >
              <Lock size={16} aria-hidden />
              Cerrar caja
            </button>
          </div>
        </div>

        <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-gray-400">
          Corte del {formatFecha(new Date().toISOString())}. Tasas del día: USD/COP{' '}
          <strong className="text-gray-200">{tasas.usdCop}</strong> · VED/COP{' '}
          <strong className="text-gray-200">{tasas.usdVes}</strong>
        </p>
      </section>
    </div>
  )
}
