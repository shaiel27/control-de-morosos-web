import { create } from 'zustand'
import {
  crearClienteBD,
  actualizarCedulaBD,
  actualizarLimiteBD,
  guardarTasasBD,
  mensajeDeError,
  obtenerClientes,
  obtenerTasas,
  obtenerTransacciones,
  registrarTransaccionBD,
} from './lib/api'
import { supabase } from './lib/supabase'
import type { Cliente, HistorialTasa, Moneda, Tasas, Transaccion } from './lib/types'

export interface ModalTransaccion {
  tipo: 'fiado' | 'abono'
  clienteId: string | null
}

const TASAS_VACIAS: Tasas = { usdCop: 0, usdVes: 0 }

const MONEDAS_VALIDAS: string[] = ['COP', 'USD', 'VED']

/** Preferencia de moneda persistida en el navegador (sobrevive a recargas). */
function monedaGuardada(): Moneda {
  try {
    const valor = localStorage.getItem('moneda')
    if (valor && MONEDAS_VALIDAS.includes(valor)) return valor as Moneda
  } catch {
    // almacenamiento no disponible
  }
  return 'COP'
}

interface EstadoApp {
  autenticado: boolean
  /** true mientras se resuelve la sesión o se descargan los datos */
  cargando: boolean
  /** true mientras una escritura está en curso */
  ocupado: boolean
  error: string | null
  clientes: Cliente[]
  transacciones: Transaccion[]
  tasas: Tasas
  historialTasas: HistorialTasa[]
  moneda: Moneda
  modal: ModalTransaccion | null
  iniciar: () => () => void
  refrescar: () => Promise<void>
  ingresar: (correo: string, clave: string) => Promise<boolean>
  salir: () => Promise<void>
  definirTasas: (tasas: Tasas) => Promise<boolean>
  definirMoneda: (moneda: Moneda) => void
  limpiarError: () => void
  abrirModal: (modal: ModalTransaccion) => void
  cerrarModal: () => void
  registrar: (transaccion: Omit<Transaccion, 'id' | 'fecha'>) => Promise<boolean>
  crearCliente: (cliente: Omit<Cliente, 'id' | 'desde'>) => Promise<boolean>
  actualizarLimite: (id: string, limiteCreditoCop: number | null) => Promise<boolean>
  actualizarCedula: (id: string, cedula: string) => Promise<boolean>
}

export const useApp = create<EstadoApp>((set, get) => ({
  autenticado: false,
  cargando: true,
  ocupado: false,
  error: null,
  clientes: [],
  transacciones: [],
  tasas: TASAS_VACIAS,
  historialTasas: [],
  moneda: monedaGuardada(),
  modal: null,

  iniciar: () => {
    let desuscrito = false

    const { data: suscripcion } = supabase.auth.onAuthStateChange((evento) => {
      if (desuscrito) return
      if (evento === 'SIGNED_OUT') {
        set({
          autenticado: false,
          cargando: false,
          error: null,
          clientes: [],
          transacciones: [],
          tasas: TASAS_VACIAS,
          historialTasas: [],
          modal: null,
        })
      } else if (evento === 'SIGNED_IN' && !get().autenticado) {
        set({ autenticado: true })
        void get().refrescar()
      }
    })

    void supabase.auth.getSession().then(({ data }) => {
      if (desuscrito) return
      if (data.session) {
        set({ autenticado: true })
        void get().refrescar()
      } else {
        set({ cargando: false })
      }
    })

    return () => {
      desuscrito = true
      suscripcion.subscription.unsubscribe()
    }
  },

  refrescar: async () => {
    set({ cargando: true })
    try {
      const [clientes, transacciones, { tasas, historial }] = await Promise.all([
        obtenerClientes(),
        obtenerTransacciones(),
        obtenerTasas(),
      ])
      set({
        clientes,
        transacciones,
        tasas,
        historialTasas: historial,
        cargando: false,
        error: null,
      })
    } catch (error) {
      set({ cargando: false, error: mensajeDeError(error) })
    }
  },

  ingresar: async (correo, clave) => {
    set({ ocupado: true, error: null })
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave })
    if (error) {
      set({ ocupado: false, error: mensajeDeError(error) })
      return false
    }
    set({ autenticado: true, ocupado: false })
    await get().refrescar()
    return true
  },

  salir: async () => {
    await supabase.auth.signOut()
    set({ autenticado: false })
  },

  definirTasas: async (tasas) => {
    set({ ocupado: true, error: null })
    try {
      const nueva = await guardarTasasBD(tasas)
      set((estado) => ({
        tasas,
        historialTasas: [nueva, ...estado.historialTasas],
        ocupado: false,
      }))
      return true
    } catch (error) {
      set({ ocupado: false, error: mensajeDeError(error) })
      return false
    }
  },

  definirMoneda: (moneda) => {
    try {
      localStorage.setItem('moneda', moneda)
    } catch {
      // almacenamiento no disponible
    }
    set({ moneda })
  },
  limpiarError: () => set({ error: null }),
  abrirModal: (modal) => set({ modal }),
  cerrarModal: () => set({ modal: null }),

  registrar: async (transaccion) => {
    set({ ocupado: true, error: null })
    try {
      const nueva = await registrarTransaccionBD(transaccion)
      set((estado) => ({
        transacciones: [nueva, ...estado.transacciones],
        ocupado: false,
        modal: null,
      }))
      return true
    } catch (error) {
      set({ ocupado: false, error: mensajeDeError(error) })
      return false
    }
  },

  crearCliente: async (cliente) => {
    set({ ocupado: true, error: null })
    try {
      const nuevo = await crearClienteBD(cliente)
      set((estado) => ({
        clientes: [...estado.clientes, nuevo],
        ocupado: false,
      }))
      return true
    } catch (error) {
      set({ ocupado: false, error: mensajeDeError(error) })
      return false
    }
  },

  actualizarLimite: async (id, limiteCreditoCop) => {
    set({ ocupado: true, error: null })
    try {
      const actualizado = await actualizarLimiteBD(id, limiteCreditoCop)
      set((estado) => ({
        clientes: estado.clientes.map((cliente) => (cliente.id === id ? actualizado : cliente)),
        ocupado: false,
      }))
      return true
    } catch (error) {
      set({ ocupado: false, error: mensajeDeError(error) })
      return false
    }
  },

  actualizarCedula: async (id, cedula) => {
    set({ ocupado: true, error: null })
    try {
      const actualizado = await actualizarCedulaBD(id, cedula)
      set((estado) => ({
        clientes: estado.clientes.map((cliente) => (cliente.id === id ? actualizado : cliente)),
        ocupado: false,
      }))
      return true
    } catch (error) {
      set({ ocupado: false, error: mensajeDeError(error) })
      return false
    }
  },
}))
