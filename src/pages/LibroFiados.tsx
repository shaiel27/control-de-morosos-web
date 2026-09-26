import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Download, Search, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import Cargando from '../components/Cargando'
import { exportarCSV, nombreDeArchivo } from '../lib/exportar'
import { formatFecha, formatHora, formatMoney, inicialesDe, plural } from '../lib/money'
import { desdeDias, enRango, ordenarDesc, resumenPeriodo } from '../lib/selectors'
import { useApp } from '../store'

type TipoFiltro = 'todos' | 'fiado' | 'abono'
type RangoFiltro = '7' | '30' | '90' | 'todo'

const TIPOS: { id: TipoFiltro; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'fiado', etiqueta: 'Fiados' },
  { id: 'abono', etiqueta: 'Abonos' },
]

const RANGOS: { id: RangoFiltro; etiqueta: string }[] = [
  { id: '7', etiqueta: '7 días' },
  { id: '30', etiqueta: '30 días' },
  { id: '90', etiqueta: '90 días' },
  { id: 'todo', etiqueta: 'Todo' },
]

const PASO = 10

export default function LibroFiados() {
  const clientes = useApp((estado) => estado.clientes)
  const transacciones = useApp((estado) => estado.transacciones)
  const tasas = useApp((estado) => estado.tasas)
  const moneda = useApp((estado) => estado.moneda)
  const cargando = useApp((estado) => estado.cargando)

  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<TipoFiltro>('todos')
  const [rango, setRango] = useState<RangoFiltro>('30')
  const [pagina, setPagina] = useState(1)
  const [aviso, setAviso] = useState('')
  const seccion = useRef<HTMLElement | null>(null)

  if (cargando) {
    return (
      <div className="space-y-5">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Libro de Fiados</h1>
          <p className="text-sm text-gray-500">
            Historial completo de fiados y abonos de toda la tienda.
          </p>
        </section>
        <Cargando />
      </div>
    )
  }

  const nombreDe = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId)
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente eliminado'
  }

  const reciboDe = (tipoTx: string, id: string) =>
    `Recibo ${tipoTx === 'fiado' ? 'F' : 'A'}-${id.slice(-4).toUpperCase()}`

  const query = busqueda.trim().toLowerCase()
  const desde = rango === 'todo' ? null : desdeDias(Number(rango))

  const filtradas = enRango(transacciones, desde).filter((tx) => {
    const coincideTipo = tipo === 'todos' || tx.tipo === tipo
    const texto = `${nombreDe(tx.clienteId)} ${tx.observacion} ${reciboDe(tx.tipo, tx.id)}`.toLowerCase()
    return coincideTipo && (query === '' || texto.includes(query))
  })

  const lista = ordenarDesc(filtradas)
  const resumen = resumenPeriodo(lista)
  const totalPaginas = Math.max(1, Math.ceil(lista.length / PASO))
  const paginaReal = Math.min(pagina, totalPaginas)
  const inicio = (paginaReal - 1) * PASO
  const visibles = lista.slice(inicio, inicio + PASO)

  const irA = (destino: number) => {
    const objetivo = Math.min(Math.max(1, destino), totalPaginas)
    setPagina(objetivo)
    if (seccion.current) {
      const y = seccion.current.getBoundingClientRect().top + window.scrollY - 160
      const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: Math.max(0, y), behavior: suave ? 'smooth' : 'auto' })
    }
  }

  const paginas: (number | '…')[] = []
  if (totalPaginas <= 7) {
    for (let i = 1; i <= totalPaginas; i++) paginas.push(i)
  } else {
    paginas.push(1)
    const desdeP = Math.max(2, paginaReal - 1)
    const hastaP = Math.min(totalPaginas - 1, paginaReal + 1)
    if (desdeP > 2) paginas.push('…')
    for (let i = desdeP; i <= hastaP; i++) paginas.push(i)
    if (hastaP < totalPaginas - 1) paginas.push('…')
    paginas.push(totalPaginas)
  }

  const conteos = {
    todos: lista.length,
    fiado: lista.filter((tx) => tx.tipo === 'fiado').length,
    abono: lista.filter((tx) => tx.tipo === 'abono').length,
  }

  const avisar = (texto: string) => {
    setAviso(texto)
    window.setTimeout(() => setAviso(''), 2600)
  }

  const exportar = () => {
    if (lista.length === 0) return avisar('No hay movimientos para exportar')
    exportarCSV(
      nombreDeArchivo('libro-de-fiados'),
      [
        'Fecha',
        'Hora',
        'Cliente',
        'Teléfono',
        'Tipo',
        'Observación',
        'Recibo',
        'Monto COP',
        'Monto USD',
        'Monto VED',
      ],
      lista.map((tx) => [
        formatFecha(tx.fecha),
        formatHora(tx.fecha),
        nombreDe(tx.clienteId),
        clientes.find((c) => c.id === tx.clienteId)?.telefono ?? '',
        tx.tipo === 'fiado' ? 'Fiado' : 'Abono',
        tx.observacion,
        reciboDe(tx.tipo, tx.id),
        tx.montoCop,
        tasas.usdCop > 0 ? (tx.montoCop / tasas.usdCop).toFixed(2) : '0.00',
        tasas.usdVes > 0 ? (tx.montoCop / tasas.usdVes).toFixed(2) : '0.00',
      ]),
    )
    avisar(`Exportados ${plural(lista.length, 'movimiento', 'movimientos')}`)
  }

  const tarjetas = [
    {
      etiqueta: 'Fiado en el período',
      valor: formatMoney(resumen.fiado, moneda, tasas),
      sufijo: moneda,
      pie:
        resumen.movimientos === 0
          ? 'Sin movimientos en el período'
          : `${plural(conteos.fiado, 'fiado', 'fiados')} de ${plural(
              resumen.movimientos,
              'movimiento',
              'movimientos',
            )}`,
      icono: TrendingDown,
      texto: 'text-coral',
      acento: 'border-l-coral',
      chip: 'bg-coral-soft text-coral',
    },
    {
      etiqueta: 'Abonado en el período',
      valor: formatMoney(resumen.abono, moneda, tasas),
      sufijo: moneda,
      pie: plural(conteos.abono, 'abono recibido', 'abonos recibidos'),
      icono: TrendingUp,
      texto: 'text-apple-green-dark',
      acento: 'border-l-apple-green',
      chip: 'bg-apple-green-soft text-apple-green-dark',
    },
    {
      etiqueta: 'Diferencia neta',
      valor: formatMoney(resumen.diferencia, moneda, tasas),
      sufijo: moneda,
      pie:
        resumen.diferencia >= 0
          ? 'Entran más abonos que fiados'
          : 'Se fió más de lo que se cobró',
      icono: Wallet,
      texto: resumen.diferencia >= 0 ? 'text-apple-green-dark' : 'text-gray-800',
      acento: resumen.diferencia >= 0 ? 'border-l-apple-green' : 'border-l-gray-800',
      chip:
        resumen.diferencia >= 0 ? 'bg-apple-green-soft text-apple-green-dark' : 'bg-gray-100 text-gray-700',
    },
  ]

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Libro de Fiados</h1>
          <p className="text-sm text-gray-500">
            Historial completo de fiados y abonos de toda la tienda.
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={exportar}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-apple-green hover:text-apple-green-dark sm:w-auto"
          >
            <Download size={16} aria-hidden />
            Exportar CSV
          </button>
          {aviso && (
            <span className="absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg">
              {aviso}
            </span>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tarjetas.map(({ etiqueta, valor, sufijo, pie, icono: Icono, texto, acento, chip }) => (
          <article
            key={etiqueta}
            className={`rounded-xl border border-l-4 border-gray-200 bg-white p-4 shadow-sm ${acento}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500">{etiqueta}</span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${chip}`}>
                <Icono size={15} aria-hidden />
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${texto}`}>
              {valor} <span className="text-xs font-semibold opacity-70">{sufijo}</span>
            </p>
            <p className="mt-1 text-[11px] text-gray-500">{pie}</p>
          </article>
        ))}
      </section>

      <section ref={seccion} className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => {
                setBusqueda(evento.target.value)
                setPagina(1)
              }}
              placeholder="Buscar por cliente, detalle o recibo…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TIPOS.map(({ id, etiqueta }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTipo(id)
                  setPagina(1)
                }}
                aria-pressed={tipo === id}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tipo === id
                    ? 'border-apple-green bg-apple-green-soft text-apple-green-dark'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {etiqueta}
                <span className="ml-1.5 font-normal opacity-70">{conteos[id]}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            {RANGOS.map(({ id, etiqueta }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRango(id)
                  setPagina(1)
                }}
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
        </div>

        {lista.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-gray-800">Sin movimientos con estos filtros</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
              Ajusta el periodo, el tipo de movimiento o borra la búsqueda para ver el libro
              completo.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda('')
                setTipo('todos')
                setRango('todo')
                setPagina(1)
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-apple-green hover:text-apple-green-dark"
            >
              <X size={14} aria-hidden />
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="scrollbar-slim overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="hidden px-3 py-3 sm:table-cell sm:px-5">Fecha</th>
                  <th className="px-3 py-3 sm:px-5">Cliente</th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:px-5">Detalle</th>
                  <th className="px-3 py-3 sm:px-5">Tipo</th>
                  <th className="px-3 py-3 text-right sm:px-5">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {visibles.map((tx) => {
                  const esFiado = tx.tipo === 'fiado'
                  return (
                    <tr key={tx.id} className="transition-colors hover:bg-gray-50">
                      <td className="hidden whitespace-nowrap px-3 py-3.5 align-top sm:table-cell sm:px-5">
                        <div className="font-medium text-gray-800">{formatFecha(tx.fecha)}</div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock size={11} aria-hidden />
                          {formatHora(tx.fecha)}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 sm:px-5">
                        <div className="flex items-start gap-2.5">
                          <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500 sm:flex">
                            {inicialesDe(nombreDe(tx.clienteId))}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-gray-800">
                              {nombreDe(tx.clienteId)}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-gray-400 sm:hidden">
                              {formatFecha(tx.fecha)} · {formatHora(tx.fecha)}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-gray-500 lg:hidden">
                              {tx.observacion}
                              {tx.referencia ? ` · Ref. ${tx.referencia}` : ''}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="hidden max-w-xs px-3 py-3.5 lg:table-cell lg:px-5">
                        <span className="block truncate text-[13px] text-gray-600">
                          {tx.observacion}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {reciboDe(tx.tipo, tx.id)}
                          {tx.referencia ? ` · Ref. ${tx.referencia}` : ''}
                        </span>
                      </td>
                      <td className="px-2 py-3.5 sm:px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            esFiado
                              ? 'bg-coral-soft text-coral-dark'
                              : 'bg-apple-green-soft text-apple-green-dark'
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
                        className={`whitespace-nowrap px-3 py-3.5 text-right font-semibold tabular-nums sm:px-5 ${
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
          </div>
        )}

        <footer className="flex flex-col gap-3 border-t border-gray-100 px-5 py-3.5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Mostrando{' '}
            <strong className="text-gray-800">{lista.length === 0 ? 0 : inicio + 1}</strong>–
            <strong className="text-gray-800">{inicio + visibles.length}</strong> de{' '}
            <strong className="text-gray-800">{lista.length}</strong>{' '}
            {lista.length === 1 ? 'movimiento' : 'movimientos'} · total fiado{' '}
            <strong className="text-coral">{formatMoney(resumen.fiado, moneda, tasas)}</strong> ·
            total abonado{' '}
            <strong className="text-apple-green-dark">
              {formatMoney(resumen.abono, moneda, tasas)}
            </strong>
          </span>
          {lista.length > 0 && totalPaginas > 1 && (
            <nav
              aria-label="Paginación del libro"
              className="flex flex-wrap items-center gap-1 self-start sm:self-auto"
            >
              <button
                type="button"
                onClick={() => irA(paginaReal - 1)}
                disabled={paginaReal <= 1}
                aria-label="Página anterior"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-apple-green hover:text-apple-green-dark disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft size={14} aria-hidden />
              </button>
              {paginas.map((valor, indice) =>
                valor === '…' ? (
                  <span key={`gap-${indice}`} aria-hidden className="px-0.5 text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => irA(valor)}
                    aria-current={valor === paginaReal ? 'page' : undefined}
                    aria-label={`Página ${valor}`}
                    className={`h-7 min-w-7 rounded-lg border px-2 text-xs font-semibold transition-colors ${
                      valor === paginaReal
                        ? 'border-gray-800 bg-gray-800 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-apple-green hover:text-apple-green-dark'
                    }`}
                  >
                    {valor}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => irA(paginaReal + 1)}
                disabled={paginaReal >= totalPaginas}
                aria-label="Página siguiente"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-apple-green hover:text-apple-green-dark disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight size={14} aria-hidden />
              </button>
            </nav>
          )}
        </footer>
      </section>
    </div>
  )
}
