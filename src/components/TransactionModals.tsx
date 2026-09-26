import { useEffect, useState } from 'react'
import type { KeyboardEvent as KeyboardEventReact, ReactNode } from 'react'
import { Check, CircleCheck, Pencil, Plus, Search, TriangleAlert, Wallet, X } from 'lucide-react'
import { MONEDAS, formatMoney, iniciales, parseMonto, textoMonto, valorEn } from '../lib/money'
import type { Moneda } from '../lib/types'
import { saldoDe } from '../lib/selectors'
import { useApp } from '../store'

function Superposicion({ children, onCerrar }: { children: ReactNode; onCerrar: () => void }) {
  useEffect(() => {
    const manejar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', manejar)
    return () => window.removeEventListener('keydown', manejar)
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-gray-900/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      {children}
    </div>
  )
}

function Cabecera({
  titulo,
  detalle,
  icono,
  chip,
  onCerrar,
}: {
  titulo: string
  detalle: string
  icono: ReactNode
  chip: string
  onCerrar: () => void
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${chip}`}>{icono}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-800">{titulo}</h2>
          <p className="text-xs text-gray-500">{detalle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar ventana"
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
      >
        <X size={18} aria-hidden />
      </button>
    </header>
  )
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function SelectorCliente({
  valor,
  onChange,
}: {
  valor: string
  onChange: (id: string) => void
}) {
  const clientes = useApp((estado) => estado.clientes)
  const transacciones = useApp((estado) => estado.transacciones)
  const tasas = useApp((estado) => estado.tasas)

  const [busqueda, setBusqueda] = useState('')
  const seleccionado = clientes.find((cliente) => cliente.id === valor)

  const consulta = busqueda.trim()
  const resultados = consulta
    ? clientes.filter(
        (cliente) =>
          normalizar(`${cliente.nombre} ${cliente.apellido}`).includes(normalizar(consulta)) ||
          (cliente.cedula ?? '').includes(consulta),
      )
    : []

  const elegir = (id: string) => {
    onChange(id)
    setBusqueda('')
  }

  const alTeclear = (evento: KeyboardEventReact<HTMLInputElement>) => {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      if (resultados.length === 1) elegir(resultados[0].id)
    }
  }

  if (seleccionado) {
    const saldo = saldoDe(transacciones, seleccionado.id)
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-500">
            {iniciales(seleccionado.nombre, seleccionado.apellido)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-gray-800">
              {seleccionado.nombre} {seleccionado.apellido}
            </span>
            <span className="block text-[11px] text-gray-500">CC {seleccionado.cedula || '—'}</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`text-xs font-semibold tabular-nums ${
              saldo > 0 ? 'text-coral' : 'text-apple-green-dark'
            }`}
          >
            {saldo > 0 ? `Debe ${formatMoney(saldo, 'COP', tasas)}` : 'Sin deuda'}
          </span>
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Cambiar cliente"
            title="Cambiar cliente"
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-400 transition-colors hover:border-apple-green hover:text-apple-green-dark"
          >
            <Pencil size={14} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        type="text"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
        onKeyDown={alTeclear}
        aria-label="Buscar cliente por nombre o cédula"
        placeholder="Buscar por nombre o cédula…"
        autoFocus
        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green"
      />
      {consulta && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-gray-500">
              Ningún cliente coincide con “{consulta}”.
            </p>
          ) : (
            resultados.map((cliente) => {
              const saldo = saldoDe(transacciones, cliente.id)
              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => elegir(cliente.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-apple-green-soft"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-800">
                      {cliente.nombre} {cliente.apellido}
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      {cliente.cedula ? `CC ${cliente.cedula}` : 'Sin cédula'}
                      {cliente.telefono ? ` · ${cliente.telefono}` : ''}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[11px] font-semibold tabular-nums ${
                      saldo > 0 ? 'text-coral' : 'text-apple-green-dark'
                    }`}
                  >
                    {saldo > 0 ? `Debe ${formatMoney(saldo, 'COP', tasas)}` : 'Sin deuda'}
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function CampoMonto({
  etiqueta,
  valor,
  onChange,
  moneda,
  onMoneda,
  acento,
}: {
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  moneda: Moneda
  onMoneda: (moneda: Moneda) => void
  acento: string
}) {
  const tasas = useApp((estado) => estado.tasas)
  const cop = parseMonto(valor || '0', moneda, tasas)

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-xs font-semibold text-gray-700">{etiqueta}</label>
        <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
          {MONEDAS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => onMoneda(opcion)}
              aria-pressed={moneda === opcion}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                moneda === opcion ? 'bg-white text-apple-green-dark shadow-sm' : 'text-gray-500'
              }`}
            >
              {opcion}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <span
          className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold ${acento}`}
        >
          {moneda === 'VED' ? 'Bs.' : '$'}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={valor}
          onChange={(evento) => onChange(evento.target.value.replace(/[^\d.,]/g, ''))}
          placeholder="0"
          className={`w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-12 pr-3 text-xl font-bold tabular-nums outline-none transition-colors focus:border-apple-green ${acento}`}
        />
      </div>

      <p className="mt-1 text-[11px] text-gray-500">
        {cop > 0
          ? `Equivalente: ${formatMoney(cop, 'COP', tasas)} COP`
          : 'Ingresa el monto de la operación'}
      </p>
    </div>
  )
}

export default function TransactionModals() {
  const modal = useApp((estado) => estado.modal)
  const cerrarModal = useApp((estado) => estado.cerrarModal)

  if (!modal) return null

  return (
    <Superposicion onCerrar={cerrarModal}>
      {modal.tipo === 'fiado' ? (
        <FormularioFiado key={modal.clienteId ?? 'nuevo-fiado'} clienteId={modal.clienteId} />
      ) : (
        <FormularioAbono key={modal.clienteId ?? 'nuevo-abono'} clienteId={modal.clienteId} />
      )}
    </Superposicion>
  )
}

function FormularioFiado({ clienteId }: { clienteId: string | null }) {
  const cerrarModal = useApp((estado) => estado.cerrarModal)
  const registrar = useApp((estado) => estado.registrar)
  const monedaGlobal = useApp((estado) => estado.moneda)
  const clientes = useApp((estado) => estado.clientes)
  const transacciones = useApp((estado) => estado.transacciones)

  const [cliente, setCliente] = useState(clienteId ?? '')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<Moneda>(monedaGlobal)
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState('')
  const [forzado, setForzado] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const tasas = useApp((estado) => estado.tasas)
  const montoCop = parseMonto(monto || '0', moneda, tasas)
  const valido = Boolean(cliente) && montoCop > 0

  const clienteSel = clientes.find((item) => item.id === cliente)
  const saldoActual = clienteSel ? Math.max(saldoDe(transacciones, clienteSel.id), 0) : 0
  const limite = clienteSel?.limiteCreditoCop ?? null
  const nuevoSaldo = saldoActual + montoCop
  const excedido = limite !== null && montoCop > 0 && nuevoSaldo > limite
  const disponible = limite === null ? null : Math.max(limite - saldoActual, 0)

  const confirmar = async () => {
    if (!cliente) return setError('Selecciona el cliente deudor.')
    if (montoCop <= 0) return setError('El monto debe ser mayor a cero.')
    if (excedido && !forzado) {
      setForzado(true)
      return setError('Se pasa del límite de crédito. Confirma de nuevo para registrar igual.')
    }
    setGuardando(true)
    const ok = await registrar({
      clienteId: cliente,
      tipo: 'fiado',
      montoCop,
      observacion: observacion.trim() || 'Compra fiada en mostrador',
      referencia: null,
    })
    if (!ok) {
      setGuardando(false)
      setError(useApp.getState().error ?? 'No se pudo registrar el fiado.')
    }
  }

  return (
    <div className="animate-modal w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <Cabecera
        titulo="Registrar Nuevo Fiado"
        detalle="Añade una compra a la cuenta por cobrar"
        icono={<Plus size={18} aria-hidden />}
        chip="bg-coral-soft text-coral"
        onCerrar={cerrarModal}
      />

      <div className="space-y-4 p-5">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-gray-700">
            Cliente seleccionado
          </span>
          <SelectorCliente
            valor={cliente}
            onChange={(id) => {
              setCliente(id)
              setForzado(false)
              setError('')
            }}
          />
          {clienteSel && limite !== null && (
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
              <span className="font-semibold text-gray-700">Límite de crédito</span>
              <span className="tabular-nums">{formatMoney(limite, 'COP', tasas)}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                disponible {formatMoney(disponible ?? 0, 'COP', tasas)}
              </span>
            </p>
          )}
        </div>

        <CampoMonto
          etiqueta="Monto del fiado"
          valor={monto}
          onChange={(valor) => {
            setMonto(valor)
            setForzado(false)
            setError('')
          }}
          moneda={moneda}
          onMoneda={setMoneda}
          acento="text-coral"
        />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">
            Observación / artículos fiados
          </label>
          <textarea
            rows={3}
            value={observacion}
            onChange={(evento) => setObservacion(evento.target.value)}
            placeholder="Ej. 2 bultos de harina PAN, 1 caja de aceite"
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green"
          />
        </div>

        {excedido && (
          <div
            className="flex gap-2 rounded-lg border border-coral bg-coral-soft px-3.5 py-3 text-xs leading-relaxed text-coral-dark"
            role="alert"
          >
            <TriangleAlert size={15} aria-hidden className="mt-0.5 shrink-0" />
            <p>
              <strong>Se pasa del límite de crédito.</strong> Límite{' '}
              {formatMoney(limite ?? 0, 'COP', tasas)}, saldo actual{' '}
              {formatMoney(saldoActual, 'COP', tasas)} y con este fiado quedarías en{' '}
              {formatMoney(nuevoSaldo, 'COP', tasas)}.
            </p>
          </div>
        )}

        <p className="h-4 text-xs font-semibold text-coral" role="alert">
          {error}
        </p>
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <button
          type="button"
          onClick={cerrarModal}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void confirmar()}
          disabled={!valido || guardando}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            excedido && forzado ? 'bg-coral-dark hover:bg-coral' : 'bg-coral hover:bg-coral-dark'
          }`}
        >
          <Check size={16} aria-hidden />
          {guardando
            ? 'Registrando…'
            : excedido && forzado
              ? 'Registrar de todos modos'
              : 'Confirmar Fiado'}
        </button>
      </footer>
    </div>
  )
}

function FormularioAbono({ clienteId }: { clienteId: string | null }) {
  const cerrarModal = useApp((estado) => estado.cerrarModal)
  const registrar = useApp((estado) => estado.registrar)
  const monedaGlobal = useApp((estado) => estado.moneda)
  const transacciones = useApp((estado) => estado.transacciones)
  const tasas = useApp((estado) => estado.tasas)

  const [cliente, setCliente] = useState(clienteId ?? '')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<Moneda>(monedaGlobal)
  const [totalRapido, setTotalRapido] = useState(false)
  const [referencia, setReferencia] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const deuda = cliente ? Math.max(saldoDe(transacciones, cliente), 0) : 0
  const montoCop = parseMonto(monto || '0', moneda, tasas)
  const restante = totalRapido ? 0 : Math.max(deuda - montoCop, 0)
  const valido = Boolean(cliente) && montoCop > 0

  const saldar = () => {
    setMonto(textoMonto(valorEn(deuda, moneda, tasas)))
    setTotalRapido(true)
    setError('')
  }

  const cambiarMoneda = (valor: Moneda) => {
    setMoneda(valor)
    if (totalRapido) setMonto(textoMonto(valorEn(deuda, valor, tasas)))
  }

  const confirmar = async () => {
    if (!cliente) return setError('Selecciona el cliente que realiza el pago.')
    if (montoCop <= 0) return setError('Ingresa el monto del abono.')
    if (!totalRapido && montoCop > deuda) return setError('El abono supera la deuda actual.')
    const aplicado = totalRapido ? deuda : montoCop
    setGuardando(true)
    const ok = await registrar({
      clienteId: cliente,
      tipo: 'abono',
      montoCop: aplicado,
      observacion: deuda - aplicado <= 0 ? 'Cuenta saldada en mostrador' : 'Abono a la deuda',
      referencia: referencia.trim() || null,
    })
    if (!ok) {
      setGuardando(false)
      setError(useApp.getState().error ?? 'No se pudo registrar el abono.')
    }
  }

  return (
    <div className="animate-modal w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
      <Cabecera
        titulo="Registrar Nuevo Abono"
        detalle="Amortiza el saldo o liquida la cuenta completa"
        icono={<Wallet size={18} aria-hidden />}
        chip="bg-apple-green-soft text-apple-green-dark"
        onCerrar={cerrarModal}
      />

      <div className="space-y-4 p-5">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-gray-700">
            Cliente y estado de cuenta
          </span>
          <SelectorCliente
            valor={cliente}
            onChange={(id) => {
              setCliente(id)
              setMonto('')
              setTotalRapido(false)
              setReferencia('')
              setError('')
            }}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-gray-700">Monto a abonar</span>
            <button
              type="button"
              onClick={saldar}
              disabled={deuda <= 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-apple-green bg-apple-green-soft px-2 py-1 text-[11px] font-semibold text-apple-green-dark transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CircleCheck size={13} aria-hidden />
              Saldar cuenta completa ({formatMoney(deuda, moneda, tasas)})
            </button>
          </div>

          <CampoMonto
            etiqueta="Monto del pago"
            valor={monto}
            onChange={(valor) => {
              setMonto(valor)
              setTotalRapido(false)
              setError('')
            }}
            moneda={moneda}
            onMoneda={cambiarMoneda}
            acento="text-apple-green-dark"
          />
        </div>

        <div>
          <label
            htmlFor="referencia-abono"
            className="mb-1.5 block text-xs font-semibold text-gray-700"
          >
            Número de referencia (transferencia bancaria)
          </label>
          <input
            id="referencia-abono"
            type="text"
            value={referencia}
            onChange={(evento) => setReferencia(evento.target.value)}
            placeholder="Ej. 003456789"
            maxLength={60}
            className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Opcional: complétalo cuando el pago se realice por transferencia bancaria.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3">
          <span className="text-xs text-gray-500">Saldo restante tras el abono</span>
          <span
            className={`text-sm font-bold tabular-nums ${
              restante === 0 ? 'text-apple-green-dark' : 'text-coral'
            }`}
          >
            {restante === 0 ? 'Cuenta saldada' : formatMoney(restante, moneda, tasas)}
          </span>
        </div>

        <p className="h-4 text-xs font-semibold text-coral" role="alert">
          {error}
        </p>
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <button
          type="button"
          onClick={cerrarModal}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void confirmar()}
          disabled={!valido || guardando}
          className="flex items-center gap-2 rounded-lg bg-apple-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={16} aria-hidden />
          {guardando ? 'Registrando…' : 'Confirmar Abono'}
        </button>
      </footer>
    </div>
  )
}
