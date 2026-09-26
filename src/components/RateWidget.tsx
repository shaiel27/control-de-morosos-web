import { useState } from 'react'
import { ArrowLeftRight, Check, RefreshCw } from 'lucide-react'
import { MONEDAS } from '../lib/money'
import type { Moneda } from '../lib/types'
import { useApp } from '../store'

const hoy = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

export default function RateWidget() {
  const tasas = useApp((estado) => estado.tasas)
  const definirTasas = useApp((estado) => estado.definirTasas)
  const moneda = useApp((estado) => estado.moneda)
  const definirMoneda = useApp((estado) => estado.definirMoneda)
  const historial = useApp((estado) => estado.historialTasas)

  const [usdCop, setUsdCop] = useState(String(tasas.usdCop))
  const [usdVes, setUsdVes] = useState(String(tasas.usdVes))
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')
  const [sincronia, setSincronia] = useState(tasas)

  if (sincronia.usdCop !== tasas.usdCop || sincronia.usdVes !== tasas.usdVes) {
    setSincronia(tasas)
    setUsdCop(String(tasas.usdCop))
    setUsdVes(String(tasas.usdVes))
  }

  const sucio = Number(usdCop) !== tasas.usdCop || Number(usdVes) !== tasas.usdVes
  const sinTasas = historial.length === 0

  const guardar = async () => {
    const cop = Number(usdCop)
    const ves = Number(usdVes)
    if (!Number.isFinite(cop) || cop <= 0 || !Number.isFinite(ves) || ves <= 0) {
      setError('Completa las dos tasas, mayores que cero.')
      return
    }
    setError('')
    const ok = await definirTasas({ usdCop: cop, usdVes: ves })
    if (!ok) {
      setError(useApp.getState().error ?? 'No se pudieron guardar las tasas.')
      return
    }
    setGuardado(true)
    window.setTimeout(() => setGuardado(false), 1800)
  }

  const campo =
    'min-w-0 flex-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-right text-sm font-semibold tabular-nums text-gray-800 outline-none transition-colors focus:border-apple-green focus:bg-white lg:w-24 lg:flex-none'

  return (
    <div className="sticky top-16 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:gap-x-5 sm:px-6">
        <div className="order-1 flex shrink-0 items-center gap-2 lg:order-none">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500">
            <ArrowLeftRight size={15} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-gray-800">Tasas del Día</span>
            <span className="hidden text-[11px] text-gray-500 sm:block">{hoy}</span>
          </span>
          {sinTasas && (
            <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[10px] font-semibold text-coral">
              Sin tasas del día
            </span>
          )}
        </div>

        <div className="order-3 grid w-full grid-cols-2 gap-x-3 gap-y-1 sm:gap-x-6 lg:order-none lg:flex lg:w-auto lg:items-center lg:gap-x-5">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            USD/COP
            <input
              type="number"
              min={1}
              step={10}
              value={usdCop}
              onChange={(evento) => {
                setUsdCop(evento.target.value)
                setError('')
              }}
              className={campo}
              aria-label="Tasa dólar a peso colombiano"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            VED/COP
            <input
              type="number"
              min={0.01}
              step={0.1}
              value={usdVes}
              onChange={(evento) => {
                setUsdVes(evento.target.value)
                setError('')
              }}
              className={campo}
              aria-label="Tasa VED/COP, pesos por bolívar"
            />
          </label>
          {error && (
            <span className="col-span-2 text-[11px] font-semibold text-coral" role="alert">
              {error}
            </span>
          )}
        </div>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-2 lg:order-none">
          <div
            className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5"
            role="group"
            aria-label="Moneda de visualización"
          >
            {MONEDAS.map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => definirMoneda(opcion as Moneda)}
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

          <button
            type="button"
            onClick={() => void guardar()}
            disabled={!sucio}
            aria-label="Actualizar tasas"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 ${
              guardado
                ? 'bg-apple-green-soft text-apple-green-dark'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {guardado ? <Check size={14} aria-hidden /> : <RefreshCw size={14} aria-hidden />}
            <span className="hidden sm:inline">{guardado ? 'Guardado' : 'Actualizar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
