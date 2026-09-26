import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  History,
  Loader2,
  Percent,
  RefreshCw,
} from 'lucide-react'
import Cargando from '../components/Cargando'
import ConversorRapido from '../components/ConversorRapido'
import { formatFecha, formatHora, formatMoney, plural } from '../lib/money'
import type { Tasas } from '../lib/types'
import { useApp } from '../store'

const num = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const num4 = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const MONTOS_USD = [1, 5, 10, 25, 50, 100, 500, 1000]

function EditorTasas({
  tasas,
  guardado,
  onGuardar,
}: {
  tasas: Tasas
  guardado: boolean
  onGuardar: (tasas: Tasas) => Promise<boolean>
}) {
  const [usdCop, setUsdCop] = useState(String(tasas.usdCop))
  const [usdVes, setUsdVes] = useState(String(tasas.usdVes))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const sucio = Number(usdCop) !== tasas.usdCop || Number(usdVes) !== tasas.usdVes

  const guardar = async () => {
    const cop = Number(usdCop)
    const ves = Number(usdVes)
    if (!Number.isFinite(cop) || cop <= 0 || !Number.isFinite(ves) || ves <= 0) {
      setError('Las dos tasas deben ser mayores que cero.')
      return
    }
    setError('')
    setEnviando(true)
    const ok = await onGuardar({ usdCop: cop, usdVes: ves })
    setEnviando(false)
    if (!ok) setError(useApp.getState().error ?? 'No se pudieron guardar las tasas.')
  }

  const campo =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-lg font-semibold tabular-nums text-gray-800 outline-none transition-colors focus:border-apple-green focus:bg-white'

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600">
          Dólar a peso colombiano
          <span className="text-[11px] font-normal text-gray-400">USD/COP</span>
        </span>
        <input
          inputMode="decimal"
          value={usdCop}
          onChange={(evento) => {
            setUsdCop(evento.target.value)
            setError('')
          }}
          aria-label="Tasa dólar a peso colombiano"
          className={campo}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-gray-600">
          Bolívar a peso colombiano
          <span className="text-[11px] font-normal text-gray-400">VED/COP</span>
        </span>
        <input
          inputMode="decimal"
          value={usdVes}
          onChange={(evento) => {
            setUsdVes(evento.target.value)
            setError('')
          }}
          aria-label="Tasa VED/COP, pesos por bolívar"
          className={campo}
        />
        <span className="mt-1 block text-[11px] text-gray-400">
          Pesos que vale 1 bolívar (pesos ÷ tasa = bolívares)
        </span>
      </label>

      <p className="min-h-4 text-xs font-semibold text-coral" role="alert">
        {error}
      </p>

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={!sucio || enviando}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          guardado
            ? 'bg-apple-green-soft text-apple-green-dark'
            : 'bg-apple-green text-white shadow-sm hover:bg-apple-green-dark'
        }`}
      >
        {enviando ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : guardado ? (
          <Check size={16} aria-hidden />
        ) : (
          <RefreshCw size={16} aria-hidden />
        )}
        {enviando ? 'Guardando…' : guardado ? 'Tasas guardadas' : 'Actualizar tasas'}
      </button>
    </div>
  )
}

export default function TasasCambio() {
  const tasas = useApp((estado) => estado.tasas)
  const historial = useApp((estado) => estado.historialTasas)
  const definirTasas = useApp((estado) => estado.definirTasas)
  const cargando = useApp((estado) => estado.cargando)

  const [guardado, setGuardado] = useState(false)

  const guardar = async (siguiente: Tasas) => {
    const ok = await definirTasas(siguiente)
    if (ok) {
      setGuardado(true)
      window.setTimeout(() => setGuardado(false), 1800)
    }
    return ok
  }

  if (cargando) {
    return (
      <div className="space-y-5">
        <section>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Tasas de Cambio</h1>
          <p className="text-sm text-gray-500">
            Cierre diario y configuración de USD/COP y VED/COP.
          </p>
        </section>
        <Cargando />
      </div>
    )
  }

  const ultima = historial[0]
  const copPorBolivar = tasas.usdVes > 0 ? 1 / tasas.usdVes : 0

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Tasas de Cambio</h1>
          <p className="text-sm text-gray-500">
            Cierre diario y configuración de USD/COP y VED/COP.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
          <History size={14} aria-hidden className="text-gray-400" />
          {plural(historial.length, 'actualización registrada', 'actualizaciones registradas')}
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <article className="rounded-xl border border-l-4 border-gray-200 border-l-apple-green bg-white p-5 shadow-sm lg:col-span-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-apple-green-soft text-apple-green-dark">
              <Percent size={17} aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Tasas vigentes</h2>
              <p className="text-xs text-gray-500">
                Último cierre:{' '}
                {ultima ? `${formatFecha(ultima.fecha)} · ${formatHora(ultima.fecha)}` : '—'}
              </p>
            </div>
          </div>

          {historial.length === 0 && (
            <div
              role="status"
              className="mb-4 flex gap-2 rounded-lg border border-apple-green bg-apple-green-soft px-3.5 py-3 text-xs leading-relaxed text-apple-green-dark"
            >
              <History size={15} aria-hidden className="mt-0.5 shrink-0" />
              <p>
                <strong>Primer cierre del día.</strong> Aún no hay tasas guardadas: completa las
                dos tasas y pulsa «Actualizar tasas» para que las conversiones funcionen en toda
                la app.
              </p>
            </div>
          )}

          <EditorTasas
            key={`${tasas.usdCop}-${tasas.usdVes}`}
            tasas={tasas}
            guardado={guardado}
            onGuardar={guardar}
          />

          <div className="mt-4 space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <span className="flex items-center justify-between gap-3">
              <span>1 USD en pesos</span>
              <strong className="tabular-nums text-gray-800">
                {formatMoney(tasas.usdCop, 'COP', tasas)}
              </strong>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span>1 VED en pesos</span>
              <strong className="tabular-nums text-gray-800">
                {num.format(tasas.usdVes)} COP
              </strong>
            </span>
            <span className="flex items-center justify-between gap-3">
              <span>1 peso en bolívares</span>
              <strong className="tabular-nums text-gray-800">
                {tasas.usdVes > 0 ? `Bs. ${num4.format(copPorBolivar)}` : '—'}
              </strong>
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-7">
          <header className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Historial de tasas</h2>
              <p className="text-xs text-gray-500">
                Variación frente al cierre anterior, más reciente primero
              </p>
            </div>
            <ArrowLeftRight size={18} aria-hidden className="text-gray-300" />
          </header>

          <ul className="divide-y divide-gray-100">
            {historial.slice(0, 6).map((entrada, indice) => {
              const anterior = historial[indice + 1]
              const delta = anterior ? entrada.usdCop - anterior.usdCop : 0
              const subio = delta > 0
              const igual = delta === 0
              return (
                <li
                  key={entrada.fecha}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800">
                      {formatFecha(entrada.fecha)}
                    </span>
                    <span className="block text-[11px] tabular-nums text-gray-400">
                      {formatHora(entrada.fecha)}
                    </span>
                  </span>

                  <span className="w-24 text-right text-sm font-semibold tabular-nums text-gray-800">
                    {num.format(entrada.usdCop)}
                    <span className="ml-1 text-[11px] font-normal text-gray-400">USD/COP</span>
                  </span>

                  <span className="w-24 text-right text-sm font-semibold tabular-nums text-gray-800">
                    {num.format(entrada.usdVes)}
                    <span className="ml-1 text-[11px] font-normal text-gray-400">VED/COP</span>
                  </span>

                  <span
                    className={`flex w-24 items-center justify-end gap-1 text-xs font-semibold tabular-nums ${
                      igual
                        ? 'text-gray-400'
                        : subio
                          ? 'text-apple-green-dark'
                          : 'text-coral'
                    }`}
                  >
                    {igual ? (
                      '—'
                    ) : (
                      <>
                        {subio ? (
                          <ArrowUpRight size={13} aria-hidden />
                        ) : (
                          <ArrowDownRight size={13} aria-hidden />
                        )}
                        {subio ? '+' : ''}
                        {delta}
                      </>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>

          <footer className="border-t border-gray-100 px-5 py-3 text-[11px] text-gray-500">
            Al guardar, la barra de tasas del encabezado y el cálculo de todas las pantallas
            se actualizan al instante.
          </footer>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-5">
          <ConversorRapido />
        </article>

        <article className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-7">
          <header className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Equivalencias rápidas</h2>
              <p className="text-xs text-gray-500">Dólares frente a peso y bolívar</p>
            </div>
            <ArrowUpRight size={18} aria-hidden className="text-gray-300" />
          </header>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 text-right">USD</th>
                  <th className="px-5 py-3 text-right">COP</th>
                  <th className="px-5 py-3 text-right">VED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {MONTOS_USD.map((montoUsd) => (
                  <tr key={montoUsd} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums text-gray-800">
                      ${num.format(montoUsd)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                      {formatMoney(montoUsd * tasas.usdCop, 'COP', tasas)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-gray-700">
                      {formatMoney(montoUsd * tasas.usdCop, 'VED', tasas)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="border-t border-gray-100 px-5 py-3 text-[11px] text-gray-500">
            Equivalencia usada:{' '}
            <strong className="text-gray-700">
              1 USD = {num.format(tasas.usdCop)} COP · 1 VED = {num.format(tasas.usdVes)} COP
            </strong>
          </footer>
        </article>
      </section>
    </div>
  )
}
