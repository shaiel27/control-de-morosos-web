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
