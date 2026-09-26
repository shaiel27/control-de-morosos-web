import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { MONEDAS, formatMoney, parseMonto } from '../lib/money'
import type { Moneda } from '../lib/types'
import { useApp } from '../store'

export default function ConversorRapido({ sinCabecera = false }: { sinCabecera?: boolean }) {
  const tasas = useApp((estado) => estado.tasas)
  const moneda = useApp((estado) => estado.moneda)
  const [monto, setMonto] = useState('100')
  const [origen, setOrigen] = useState<Moneda>('USD')

  const montoCop = parseMonto(monto || '0', origen, tasas)

  return (
    <>
      {!sinCabecera && (
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <ArrowLeftRight size={17} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Conversor rápido</h2>
            <p className="text-xs text-gray-500">
              Del monto capturado a pesos, bolívares y dólares
            </p>
          </div>
        </div>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-gray-600">Monto</span>
        <input
          inputMode="decimal"
          value={monto}
          onChange={(evento) => setMonto(evento.target.value)}
          placeholder="0"
          aria-label="Monto a convertir"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-lg font-semibold tabular-nums text-gray-800 outline-none transition-colors focus:border-apple-green focus:bg-white"
        />
      </label>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600">Moneda origen</span>
        <div className="ml-auto flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {MONEDAS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setOrigen(opcion)}
              aria-pressed={origen === opcion}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                origen === opcion
                  ? 'bg-white text-apple-green-dark shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {opcion}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {MONEDAS.map((opcion) => (
          <li
            key={opcion}
            className={`flex items-center justify-between px-3.5 py-2.5 ${
              opcion === moneda ? 'bg-apple-green-soft' : 'bg-white'
            }`}
          >
            <span className="text-xs font-semibold text-gray-600">{opcion}</span>
            <span
              className={`text-sm font-bold tabular-nums ${
                opcion === moneda ? 'text-apple-green-dark' : 'text-gray-800'
              }`}
            >
              {formatMoney(montoCop, opcion, tasas)}
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
