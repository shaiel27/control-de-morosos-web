import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Gauge, Loader2, Phone, Search, UserPlus, X } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import Cargando from '../components/Cargando'
import { formatMoney, iniciales } from '../lib/money'
import { saldoDe } from '../lib/selectors'
import { useApp } from '../store'

type Filtro = 'deuda' | 'solvente' | 'todos'

const filtros: { id: Filtro; etiqueta: string }[] = [
  { id: 'deuda', etiqueta: 'Con Deuda' },
  { id: 'solvente', etiqueta: 'Solventes' },
  { id: 'todos', etiqueta: 'Todos' },
]

export default function ClientList() {
  const location = useLocation()
  const clientes = useApp((estado) => estado.clientes)
  const transacciones = useApp((estado) => estado.transacciones)
  const tasas = useApp((estado) => estado.tasas)
  const moneda = useApp((estado) => estado.moneda)
  const crearCliente = useApp((estado) => estado.crearCliente)
  const cargando = useApp((estado) => estado.cargando)

  const estadoInicial = location.state as { nuevo?: boolean } | null
  const [parametros, setParametros] = useSearchParams()
  const busqueda = parametros.get('q') ?? ''
  const setBusqueda = (valor: string) =>
    setParametros(valor ? { q: valor } : {}, { replace: true })
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [formAbierto, setFormAbierto] = useState(Boolean(estadoInicial?.nuevo))
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [cedula, setCedula] = useState('')
  const [telefono, setTelefono] = useState('')
  const [limite, setLimite] = useState('')
  const [errorForm, setErrorForm] = useState('')
  const [guardando, setGuardando] = useState(false)

  const filas = useMemo(
    () =>
      clientes.map((cliente) => ({
        cliente,
        saldo: saldoDe(transacciones, cliente.id),
      })),
    [clientes, transacciones],
  )

  const query = busqueda.trim().toLowerCase()
  const visibles = filas.filter(({ cliente, saldo }) => {
    const coincide =
      query === '' ||
      `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(query) ||
      cliente.telefono.toLowerCase().includes(query) ||
      cliente.cedula.toLowerCase().includes(query)

    const pasaFiltro =
      filtro === 'todos' || (filtro === 'deuda' ? saldo > 0 : saldo <= 0)

    return coincide && pasaFiltro
  })

  const cuentas = {
    deuda: filas.filter((fila) => fila.saldo > 0).length,
    solvente: filas.filter((fila) => fila.saldo <= 0).length,
    todos: filas.length,
  }

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!nombre.trim() || !apellido.trim()) {
      setErrorForm('Nombre y apellido son obligatorios.')
      return
    }
    const cedulaLimpia = cedula.replace(/\D/g, '')
    if (cedulaLimpia && cedulaLimpia.length < 4) {
      setErrorForm('La cédula debe tener al menos 4 dígitos.')
      return
    }

    const numeroLimite = Number(limite.replace(/[^\d]/g, ''))
    setErrorForm('')
    setGuardando(true)
    const ok = await crearCliente({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim() || 'Sin teléfono',
      cedula: cedulaLimpia,
      estado: true,
      limiteCreditoCop:
        limite.trim() && Number.isFinite(numeroLimite) && numeroLimite > 0 ? numeroLimite : null,
    })
    setGuardando(false)

    if (!ok) {
      setErrorForm(useApp.getState().error ?? 'No se pudo crear el cliente.')
      return
    }

    setNombre('')
    setApellido('')
    setCedula('')
    setTelefono('')
    setLimite('')
    setFormAbierto(false)
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-500">
            Directorio de la tienda con saldo al día de cada cuenta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormAbierto((valor) => !valor)}
          className="flex items-center justify-center gap-2 rounded-lg bg-apple-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98]"
        >
          {formAbierto ? <X size={16} aria-hidden /> : <UserPlus size={16} aria-hidden />}
          {formAbierto ? 'Cancelar' : 'Nuevo Cliente'}
        </button>
      </section>

      {formAbierto && (
        <form
          onSubmit={(evento) => void guardar(evento)}
          className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Nombre</span>
            <input
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Lucía"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-apple-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Apellido</span>
            <input
              value={apellido}
              onChange={(evento) => setApellido(evento.target.value)}
              placeholder="Fernández"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-apple-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Cédula</span>
            <input
              inputMode="numeric"
              maxLength={12}
              value={cedula}
              onChange={(evento) => {
                setCedula(evento.target.value.replace(/\D/g, ''))
                setErrorForm('')
              }}
              placeholder="1000000001"
              aria-label="Cédula del cliente"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm tabular-nums outline-none focus:border-apple-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Teléfono</span>
            <input
              value={telefono}
              onChange={(evento) => setTelefono(evento.target.value)}
              placeholder="+57 300 000 0000"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-apple-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">
              Límite de crédito (COP)
            </span>
            <input
              type="number"
              min={0}
              step={1000}
              value={limite}
              onChange={(evento) => setLimite(evento.target.value)}
              placeholder="Sin límite"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-apple-green"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={guardando}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-apple-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-apple-green-dark disabled:opacity-60 sm:w-auto"
            >
              {guardando && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
          <p
            className="text-xs font-medium text-coral sm:col-span-2 xl:col-span-5"
            role="alert"
          >
            {errorForm}
          </p>
        </form>
      )}

      <section className="space-y-3">
        <div className="relative">
          <Search
            size={17}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre, apellido, cédula o teléfono…"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filtros.map(({ id, etiqueta }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              aria-pressed={filtro === id}
              className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                filtro === id
                  ? 'border-apple-green bg-apple-green-soft text-apple-green-dark'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              {etiqueta}
              <span className="ml-1.5 text-xs font-normal opacity-70">{cuentas[id]}</span>
            </button>
          ))}
        </div>
      </section>

      {cargando ? (
        <Cargando />
      ) : visibles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-gray-800">No encontramos clientes</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
            Ajusta la búsqueda o registra una cuenta nueva para empezar a llevar el control de
            fiados.
          </p>
          <button
            type="button"
            onClick={() => {
              setBusqueda('')
              setFiltro('todos')
            }}
            className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map(({ cliente, saldo }) => {
            const debe = saldo > 0
            const limiteCredito = cliente.limiteCreditoCop
            const usado = Math.max(saldo, 0)
            const agotado = limiteCredito !== null && usado >= limiteCredito
            return (
              <li key={cliente.id}>
                <Link
                  to={`/app/clientes/${cliente.id}`}
                  className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-apple-green hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                      {iniciales(cliente.nombre, cliente.apellido)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {cliente.nombre} {cliente.apellido}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone size={12} aria-hidden />
                        {cliente.telefono}
                      </p>
                      {cliente.cedula && (
                        <p className="mt-0.5 truncate text-xs tabular-nums text-gray-500">
                          CC {cliente.cedula}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        debe ? 'bg-coral-soft text-coral-dark' : 'bg-apple-green-soft text-apple-green-dark'
                      }`}
                    >
                      {debe ? 'Debe' : 'Al día'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-500">Saldo actual</span>
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        debe ? 'text-coral' : 'text-apple-green-dark'
                      }`}
                    >
                      {debe ? formatMoney(saldo, moneda, tasas) : formatMoney(0, moneda, tasas)}
                    </span>
                  </div>

                  {!debe && (
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                      <Check size={12} aria-hidden />
                      Cuenta solvente
                    </p>
                  )}

                  {limiteCredito !== null && (
                    <p
                      className={`mt-2 flex items-center gap-1.5 text-[11px] font-semibold ${
                        agotado ? 'text-coral' : 'text-gray-400'
                      }`}
                    >
                      <Gauge size={12} aria-hidden />
                      {agotado
                        ? 'Crédito agotado'
                        : `Disponible ${formatMoney(limiteCredito - usado, moneda, tasas)} de ${formatMoney(
                            limiteCredito,
                            moneda,
                            tasas,
                          )}`}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
