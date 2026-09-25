import type { Moneda, Tasas } from './types'

const agrupado = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const decimalesUsd = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const MONEDAS: Moneda[] = ['COP', 'USD', 'VED']

export const PREFIJO: Record<Moneda, string> = {
  COP: '$',
  USD: '$',
  VED: 'Bs. ',
}

export function aUsd(cop: number, tasas: Tasas): number {
  return tasas.usdCop > 0 ? cop / tasas.usdCop : 0
}

export function aVes(cop: number, tasas: Tasas): number {
  return tasas.usdVes > 0 && tasas.usdCop > 0 ? (cop / tasas.usdCop) * tasas.usdVes : 0
}

export function formatMoney(cop: number, moneda: Moneda, tasas: Tasas): string {
  const signo = cop < 0 ? '-' : ''
  const valor = Math.abs(cop)

  if (moneda === 'USD') return `${signo}$${decimalesUsd.format(aUsd(valor, tasas))}`
  if (moneda === 'VED') return `${signo}Bs. ${agrupado.format(Math.round(aVes(valor, tasas)))}`
  return `${signo}$${agrupado.format(Math.round(valor))}`
}

export function aCop(monto: number, moneda: Moneda, tasas: Tasas): number {
  if (moneda === 'USD') return monto * tasas.usdCop
  if (moneda === 'VED') return tasas.usdVes > 0 ? (monto / tasas.usdVes) * tasas.usdCop : 0
  return monto
}

export function parseMonto(texto: string, moneda: Moneda, tasas: Tasas): number {
  const limpio = texto.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')
  const numero = Number(limpio)
  if (!Number.isFinite(numero)) return 0
  return Math.round(aCop(numero, moneda, tasas))
}

const fechaFmt = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const horaFmt = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

export function formatFecha(iso: string): string {
  return fechaFmt.format(new Date(iso)).replace('.', '')
}

export function formatHora(iso: string): string {
  return horaFmt.format(new Date(iso)).toUpperCase()
}

export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.trim().charAt(0)}${apellido.trim().charAt(0)}`.toUpperCase()
}
