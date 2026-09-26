import type { Moneda, Tasas } from './types'

const agrupado = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })
const decimalesUsd = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const decimalesVed = new Intl.NumberFormat('es-CO', {
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

/** COP → VED: se divide el peso entre la tasa del bolívar (VED/COP). */
export function aVes(cop: number, tasas: Tasas): number {
  return tasas.usdVes > 0 ? cop / tasas.usdVes : 0
}

export function formatMoney(cop: number, moneda: Moneda, tasas: Tasas): string {
  const signo = cop < 0 ? '-' : ''
  const valor = Math.abs(cop)

  if (moneda === 'USD') return `${signo}$${decimalesUsd.format(aUsd(valor, tasas))}`
  if (moneda === 'VED') return `${signo}Bs. ${decimalesVed.format(aVes(valor, tasas))}`
  return `${signo}$${agrupado.format(Math.round(valor))}`
}

export function aCop(monto: number, moneda: Moneda, tasas: Tasas): number {
  if (moneda === 'USD') return monto * tasas.usdCop
  if (moneda === 'VED') return monto * tasas.usdVes
  return monto
}

export function valorEn(cop: number, moneda: Moneda, tasas: Tasas): number {
  if (moneda === 'USD') return Number(aUsd(cop, tasas).toFixed(2))
  if (moneda === 'VED') return Number(aVes(cop, tasas).toFixed(2))
  return Math.round(cop)
}

/** Formatea un monto como lo espera `parseMonto`: separador de miles «.» y decimal «,». */
export function textoMonto(valor: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(valor)
}

export function parseMonto(texto: string, moneda: Moneda, tasas: Tasas): number {
  let limpio = texto.replace(/[^\d.,]/g, '')
  if (limpio.includes(',')) {
    // formato es-CO: «.» son miles y «,» el decimal
    limpio = limpio.replace(/\./g, '').replace(',', '.')
  } else if (limpio.includes('.')) {
    // sin coma: «1.500» son miles, «10.5» es decimal
    const partes = limpio.split('.')
    const sonMiles = partes.length > 1 && partes.slice(1).every((parte) => parte.length === 3)
    if (sonMiles) limpio = limpio.replace(/\./g, '')
  }
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

export function inicialesDe(nombreCompleto: string): string {
  return nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase()
}

export function plural(n: number, uno: string, muchos: string): string {
  return `${n} ${n === 1 ? uno : muchos}`
}
