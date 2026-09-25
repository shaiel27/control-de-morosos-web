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
}

export interface Transaccion {
  id: string
  clienteId: string
  tipo: TipoTransaccion
  montoCop: number
  observacion: string
  fecha: string
}

export interface Tasas {
  usdCop: number
  usdVes: number
}
