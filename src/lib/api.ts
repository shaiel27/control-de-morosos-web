import { supabase } from './supabase'
import type { Cliente, HistorialTasa, Tasas, Transaccion, TipoTransaccion } from './types'

interface ClienteFila {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  cedula: string | null
  estado: boolean | null
  created_at: string
  limite_credito_cop: number | null
}

interface TransaccionFila {
  id: string
  cliente_id: string
  tipo: string
  monto_cop: number
  observacion: string | null
  referencia: string | null
  created_at: string
}

interface TasaFila {
  id: string
  fecha: string
  usd_cop: number
  usd_ves: number
}

const aCliente = (fila: ClienteFila): Cliente => ({
  id: fila.id,
  nombre: fila.nombre,
  apellido: fila.apellido,
  telefono: fila.telefono ?? '',
  cedula: fila.cedula ?? '',
  estado: fila.estado ?? true,
  desde: fila.created_at.slice(0, 10),
  limiteCreditoCop: fila.limite_credito_cop == null ? null : Number(fila.limite_credito_cop),
})

const aTransaccion = (fila: TransaccionFila): Transaccion => ({
  id: fila.id,
  clienteId: fila.cliente_id,
  tipo: (fila.tipo === 'abono' ? 'abono' : 'fiado') as TipoTransaccion,
  montoCop: Number(fila.monto_cop),
  observacion: fila.observacion ?? '',
  referencia: fila.referencia ?? null,
  fecha: fila.created_at,
})

const aTasa = (fila: TasaFila): HistorialTasa => ({
  fecha: fila.fecha,
  usdCop: Number(fila.usd_cop),
  usdVes: Number(fila.usd_ves),
})

export function mensajeDeError(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error)
  if (/Invalid login credentials/i.test(texto)) return 'Correo o contraseña incorrectos.'
  if (/Email not confirmed/i.test(texto)) return 'Este correo aún no está confirmado.'
  if (/Failed to fetch|NetworkError|ECONNREFUSED/i.test(texto)) return 'Sin conexión con la base de datos.'
  if (/rate limit|too many requests/i.test(texto)) return 'Demasiados intentos. Espera un momento y vuelve a intentar.'
  return texto || 'No se pudo completar la operación.'
}

export async function obtenerClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(aCliente)
}

export async function crearClienteBD(
  datos: Omit<Cliente, 'id' | 'desde'>,
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
      cedula: datos.cedula || null,
      estado: datos.estado,
      limite_credito_cop: datos.limiteCreditoCop,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505')
      throw new Error(`Ya existe un cliente con la cédula ${datos.cedula}.`)
    throw new Error(error.message)
  }
  return aCliente(data as ClienteFila)
}

export async function actualizarCedulaBD(id: string, cedula: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update({ cedula: cedula || null })
    .eq('id', id)
    .select()
    .single()
  if (error) {
    if (error.code === '23505')
      throw new Error(`Ya existe un cliente con la cédula ${cedula}.`)
    throw new Error(error.message)
  }
  return aCliente(data as ClienteFila)
}

export async function actualizarLimiteBD(
  id: string,
  limiteCreditoCop: number | null,
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update({ limite_credito_cop: limiteCreditoCop })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return aCliente(data as ClienteFila)
}

export async function obtenerTransacciones(): Promise<Transaccion[]> {
  const { data, error } = await supabase
    .from('transacciones')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(aTransaccion)
}

export async function registrarTransaccionBD(
  datos: Omit<Transaccion, 'id' | 'fecha'>,
): Promise<Transaccion> {
  const { data, error } = await supabase
    .from('transacciones')
    .insert({
      cliente_id: datos.clienteId,
      tipo: datos.tipo,
      monto_cop: datos.montoCop,
      observacion: datos.observacion,
      referencia: datos.referencia ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return aTransaccion(data as TransaccionFila)
}

export async function obtenerTasas(): Promise<{ tasas: Tasas; historial: HistorialTasa[] }> {
  const { data, error } = await supabase
    .from('tasas')
    .select('*')
    .order('fecha', { ascending: false })
  if (error) throw new Error(error.message)

  const historial = (data ?? []).map(aTasa)
  const vigente = historial[0]
  return {
    tasas: vigente ? { usdCop: vigente.usdCop, usdVes: vigente.usdVes } : { usdCop: 0, usdVes: 0 },
    historial,
  }
}

export async function guardarTasasBD(tasas: Tasas): Promise<HistorialTasa> {
  const { data, error } = await supabase
    .from('tasas')
    .insert({ usd_cop: tasas.usdCop, usd_ves: tasas.usdVes })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return aTasa(data as TasaFila)
}
