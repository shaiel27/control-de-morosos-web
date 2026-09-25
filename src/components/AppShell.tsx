import { Plus, Search, Store, Wallet } from 'lucide-react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import MobileNav from './MobileNav'
import RateWidget from './RateWidget'
import Sidebar from './Sidebar'
import TransactionModals from './TransactionModals'
import { iniciales } from '../lib/money'
import { useApp } from '../store'

export default function AppShell() {
  const abrirModal = useApp((estado) => estado.abrirModal)
  const autenticado = useApp((estado) => estado.autenticado)
  const navigate = useNavigate()

  if (!autenticado) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
          <Link to="/app" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-apple-green-soft text-apple-green-dark">
              <Store size={16} aria-hidden />
            </span>
            <span className="text-sm font-bold text-apple-green-dark">Control de Saldo</span>
          </Link>

          <div className="relative hidden w-full max-w-sm lg:block">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              placeholder="Buscar por cliente, cédula o teléfono…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-12 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-apple-green focus:bg-white"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 sm:block">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => abrirModal({ tipo: 'abono', clienteId: null })}
              className="hidden items-center gap-1.5 rounded-lg border border-apple-green px-3.5 py-2 text-sm font-semibold text-apple-green-dark transition-colors hover:bg-apple-green-soft sm:flex"
            >
              <Wallet size={16} aria-hidden />
              Registrar Abono
            </button>
            <button
              type="button"
              onClick={() => abrirModal({ tipo: 'fiado', clienteId: null })}
              className="flex items-center gap-1.5 rounded-lg bg-apple-green px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-apple-green-dark active:scale-[0.98]"
            >
              <Plus size={16} aria-hidden />
              <span className="hidden sm:inline">Registrar Fiado</span>
            </button>
            <span className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-500">
              {iniciales('Ana', 'Duarte')}
            </span>
          </div>
        </header>

        <RateWidget />

        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <TransactionModals />
    </div>
  )
}
