import { create } from 'zustand'
import { CLIENTES, TASAS_INICIALES, TRANSACCIONES } from './lib/mock'
import type { Cliente, Moneda, Tasas, Transaccion } from './lib/types'

export interface ModalTransaccion {
  tipo: 'fiado' | 'abono'
  clienteId: string | null
}

interface EstadoApp {
  autenticado: boolean
  clientes: Cliente[]
  transacciones: Transaccion[]
  tasas: Tasas
  moneda: Moneda
  modal: ModalTransaccion | null
  ingresar: () => void
  salir: () => void
  definirTasas: (tasas: Tasas) => void
  definirMoneda: (moneda: Moneda) => void
  abrirModal: (modal: ModalTransaccion) => void
  cerrarModal: () => void
  registrar: (transaccion: Omit<Transaccion, 'id'>) => void
  crearCliente: (cliente: Omit<Cliente, 'id'>) => void
}

let contador = 100

const nuevoId = () => `x${Date.now().toString(36)}${(contador++).toString(36)}`

export const useApp = create<EstadoApp>((set) => ({
  autenticado: false,
  clientes: CLIENTES,
  transacciones: TRANSACCIONES,
  tasas: TASAS_INICIALES,
  moneda: 'COP',
  modal: null,

  ingresar: () => set({ autenticado: true }),
  salir: () => set({ autenticado: false }),
  definirTasas: (tasas) => set({ tasas }),
  definirMoneda: (moneda) => set({ moneda }),
  abrirModal: (modal) => set({ modal }),
  cerrarModal: () => set({ modal: null }),

  registrar: (transaccion) =>
    set((estado) => ({
      transacciones: [{ ...transaccion, id: nuevoId() }, ...estado.transacciones],
      modal: null,
    })),

  crearCliente: (cliente) =>
    set((estado) => ({ clientes: [...estado.clientes, { ...cliente, id: nuevoId() }] })),
}))
