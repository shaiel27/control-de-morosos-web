import type { Cliente, Transaccion } from './types'

export function saldoDe(transacciones: Transaccion[], clienteId: string): number {
  return transacciones
    .filter((t) => t.clienteId === clienteId)
    .reduce((total, t) => (t.tipo === 'fiado' ? total + t.montoCop : total - t.montoCop), 0)
}

export function movimientosDe(transacciones: Transaccion[], clienteId: string): Transaccion[] {
  return transacciones
    .filter((t) => t.clienteId === clienteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export function clientesConDeuda(
  clientes: Cliente[],
  transacciones: Transaccion[],
): { cliente: Cliente; saldo: number }[] {
  return clientes
    .map((cliente) => ({ cliente, saldo: saldoDe(transacciones, cliente.id) }))
    .filter((fila) => fila.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo)
}

export function resumenCartera(clientes: Cliente[], transacciones: Transaccion[]) {
  const saldos = clientes.map((cliente) => saldoDe(transacciones, cliente.id))
  const porCobrar = saldos.reduce((total, saldo) => total + Math.max(saldo, 0), 0)
  const conDeuda = saldos.filter((saldo) => saldo > 0).length

  const ahora = new Date()
  const recuperadoMes = transacciones
    .filter((t) => {
      const fecha = new Date(t.fecha)
      return (
        t.tipo === 'abono' &&
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      )
    })
    .reduce((total, t) => total + t.montoCop, 0)

  const abonosMes = transacciones.filter((t) => {
    const fecha = new Date(t.fecha)
    return (
      t.tipo === 'abono' &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    )
  }).length

  return { porCobrar, conDeuda, recuperadoMes, abonosMes, clientesTotales: clientes.length }
}

export function ultimasTransacciones(transacciones: Transaccion[], limite: number): Transaccion[] {
  return [...transacciones].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, limite)
}

export function desdeDias(dias: number | null): Date | null {
  if (!dias) return null
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() - (dias - 1))
  return fecha
}

export function desdeHoy(): Date {
  const fecha = new Date()
  fecha.setHours(0, 0, 0, 0)
  return fecha
}

export function desdeMes(): Date {
  const fecha = new Date()
  fecha.setDate(1)
  fecha.setHours(0, 0, 0, 0)
  return fecha
}

export function enRango(transacciones: Transaccion[], desde: Date | null): Transaccion[] {
  if (!desde) return transacciones
  const tope = desde.getTime()
  return transacciones.filter((t) => new Date(t.fecha).getTime() >= tope)
}

export function ordenarDesc(transacciones: Transaccion[]): Transaccion[] {
  return [...transacciones].sort((a, b) => b.fecha.localeCompare(a.fecha))
}

export interface ResumenPeriodo {
  fiado: number
  abono: number
  diferencia: number
  movimientos: number
}

export function resumenPeriodo(lista: Transaccion[]): ResumenPeriodo {
  let fiado = 0
  let abono = 0

  for (const t of lista) {
    if (t.tipo === 'fiado') fiado += t.montoCop
    else abono += t.montoCop
  }

  return { fiado, abono, diferencia: abono - fiado, movimientos: lista.length }
}

export interface DiaMovimiento {
  clave: string
  fecha: Date
  fiado: number
  abono: number
}

function claveDeFecha(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function serieDiaria(transacciones: Transaccion[], dias: number): DiaMovimiento[] {
  const inicio = desdeDias(dias) ?? desdeHoy()
  const celdas = new Map<string, DiaMovimiento>()

  for (let i = 0; i < dias; i++) {
    const fecha = new Date(inicio)
    fecha.setDate(inicio.getDate() + i)
    const clave = claveDeFecha(fecha)
    celdas.set(clave, { clave, fecha, fiado: 0, abono: 0 })
  }

  for (const t of transacciones) {
    const celda = celdas.get(claveDeFecha(new Date(t.fecha)))
    if (!celda) continue
    if (t.tipo === 'fiado') celda.fiado += t.montoCop
    else celda.abono += t.montoCop
  }

  return [...celdas.values()]
}
