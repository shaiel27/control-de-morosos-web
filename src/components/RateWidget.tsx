import { useEffect, useState } from 'react'
import { ArrowLeftRight, Check, RefreshCw } from 'lucide-react'
import { MONEDAS } from '../lib/money'
import type { Moneda, Tasas } from '../lib/types'
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

  const [usdCop, setUsdCop] = useState(String(tasas.usdCop))
  const [usdVes, setUsdVes] = useState(String(tasas.usdVes))
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    setUsdCop(String(tasas.usdCop))
    setUsdVes(String(tasas.usdVes))
  }, [tasas])

  const sucio = Number(usdCop) !== tasas.usdCop || Number(usdVes) !== tasas.usdVes

  const guardar = () => {
    const siguiente: Tasas = {
      usdCop: Number(usdCop) > 0 ? Number(usdCop) : tasas.usdCop,
      usdVes: Number(usdVes) > 0 ? Number(usdVes) : tasas.usdVes,
    }
    definirTasas(siguiente)
    setGuardado(true)
    window.setTimeout(() => setGuardado(false), 1800)
  }

  const campo =
    'w-24 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-right text-sm font-semibold tabular-nums text-gray-800 outline-none transition-colors focus:border-apple-green focus:bg-white'

  return (
    <div className="sticky top-16 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-500">
            <ArrowLeftRight size={15} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-xs font-semibold text-gray-800">Tasas del Día</span>
            <span className="block text-[11px] text-gray-500 capitalize">{hoy}</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-gray-500">
            USD/COP
            <input
              type="number"
              min={1}
              step={10}
              value={usdCop}
              onChange={(evento) => setUsdCop(evento.target.value)}
              className={campo}
              aria-label="Tasa dólar a peso colombiano"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-500">
            VED/COP
            <input
              type="number"
              min={1}
              step={1}
              value={usdVes}
              onChange={(evento) => setUsdVes(evento.target.value)}
              className={campo}
              aria-label="Tasa dólar a bolívar"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
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
            onClick={guardar}
            disabled={!sucio}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              guardado
                ? 'bg-apple-green-soft text-apple-green-dark'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {guardado ? <Check size={14} aria-hidden /> : <RefreshCw size={14} aria-hidden />}
            {guardado ? 'Guardado' : 'Actualizar'}
          </button>
        </div>
      </div>
    </div>
  )
}
