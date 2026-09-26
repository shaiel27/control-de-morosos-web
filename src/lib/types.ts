export type Moneda = 'COP' | 'USD' | 'VED'

export type TipoTransaccion = 'fiado' | 'abono'

export interface Cliente {
  id: string
  nombre: string
  apellido: string
  telefono: string
  cedula: string
  estado: boolean
  desde: string
  /** Límite de crédito en COP. `null` = sin límite. */
  limiteCreditoCop: number | null
}

export interface Transaccion {
  id: string
  clienteId: string
  tipo: TipoTransaccion
  montoCop: number
  observacion: string
  /** Número de referencia de la transferencia bancaria (abonos). `null` si no aplica. */
  referencia: string | null
  fecha: string
}

export interface Tasas {
  usdCop: number
  usdVes: number
}

export interface HistorialTasa extends Tasas {
  fecha: string
}
