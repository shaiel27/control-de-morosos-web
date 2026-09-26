import {
  ArrowLeftRight,
  BookOpen,
  ChartNoAxesColumn,
  CircleQuestionMark,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Store,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { iniciales } from '../lib/money'
import { useApp } from '../store'

const navegacion = [
  { to: '/app', etiqueta: 'Panel', icono: LayoutDashboard, fin: true },
  { to: '/app/clientes', etiqueta: 'Clientes', icono: Users, fin: false },
  { to: '/app/libro', etiqueta: 'Libro de Fiados', icono: BookOpen, fin: false },
  { to: '/app/tasas', etiqueta: 'Tasas de Cambio', icono: ArrowLeftRight, fin: false },
  { to: '/app/reportes', etiqueta: 'Reportes y Cierre', icono: ChartNoAxesColumn, fin: false },
]

const utilidades = [
  { to: '/app/configuracion', etiqueta: 'Configuración', icono: Settings },
  { to: '/app/ayuda', etiqueta: 'Ayuda y Soporte', icono: CircleQuestionMark },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const salir = useApp((estado) => estado.salir)
  const abrirModal = useApp((estado) => estado.abrirModal)

  const claseEnlace = ({ isActive }: { isActive: boolean }) =>
    [
      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
      isActive
        ? 'bg-apple-green-soft font-semibold text-apple-green-dark'
        : 'font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800',
    ].join(' ')

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex h-full flex-col px-3 py-4">
        <div className="mb-4 flex items-center gap-3 px-3 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-apple-green-soft text-apple-green-dark">
            <Store size={20} aria-hidden />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight text-apple-green-dark">
              Control de Saldo
            </span>
            <span className="block text-xs text-gray-500">Gestión de Mostrador</span>
          </span>
        </div>

        <div className="mb-5 px-2">
          <button
            type="button"
            onClick={() => abrirModal({ tipo: 'fiado', clienteId: null })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-coral-dark active:scale-[0.98]"
          >
            <Plus size={18} aria-hidden />
            Registrar Fiado
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navegacion.map(({ to, etiqueta, icono: Icono, fin }) => (
            <NavLink key={to} to={to} end={fin} className={claseEnlace}>
              <Icono
                size={18}
                aria-hidden
                className={fin ? undefined : 'text-gray-400 group-hover:text-gray-600'}
              />
              {etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-gray-200 pt-4">
          {utilidades.map(({ to, etiqueta, icono: Icono }) => (
            <NavLink key={to} to={to} className={claseEnlace}>
              <Icono size={18} aria-hidden className="text-gray-400" />
              {etiqueta}
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => {
              void salir()
              navigate('/')
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <LogOut size={18} aria-hidden className="text-gray-400" />
            Cerrar sesión
          </button>

          <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-apple-green-soft text-xs font-bold text-apple-green-dark">
              {iniciales('Ana', 'Duarte')}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-gray-800">
                Bodega Los Malabares
              </span>
              <span className="block truncate text-[11px] text-gray-500">
                Peñón Michelena–Táchira
              </span>
            </span>
            <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-apple-green" aria-hidden />
          </div>
        </div>
      </div>
    </aside>
  )
}
