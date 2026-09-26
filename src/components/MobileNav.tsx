import {
  ArrowLeftRight,
  BookOpen,
  ChartNoAxesColumn,
  CircleQuestionMark,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/app', etiqueta: 'Panel', icono: LayoutDashboard, fin: true },
  { to: '/app/clientes', etiqueta: 'Clientes', icono: Users, fin: false },
  { to: '/app/libro', etiqueta: 'Libro', icono: BookOpen, fin: false },
  { to: '/app/tasas', etiqueta: 'Tasas', icono: ArrowLeftRight, fin: false },
  { to: '/app/reportes', etiqueta: 'Corte', icono: ChartNoAxesColumn, fin: false },
  { to: '/app/configuracion', etiqueta: 'Ajustes', icono: Settings, fin: false },
  { to: '/app/ayuda', etiqueta: 'Ayuda', icono: CircleQuestionMark, fin: false },
]

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {items.map(({ to, etiqueta, icono: Icono, fin }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={fin}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-apple-green-dark' : 'text-gray-500',
                ].join(' ')
              }
            >
              <Icono size={18} aria-hidden />
              {etiqueta}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
