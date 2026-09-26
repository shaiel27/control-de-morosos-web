import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ClientList from './pages/ClientList'
import ClientProfile from './pages/ClientProfile'
import Dashboard from './pages/Dashboard'
import LibroFiados from './pages/LibroFiados'
import Login from './pages/Login'
import ReportesCierre from './pages/ReportesCierre'
import Soon from './pages/Soon'
import TasasCambio from './pages/TasasCambio'
import { useApp } from './store'

export default function App() {
  const iniciar = useApp((estado) => estado.iniciar)
  const cargando = useApp((estado) => estado.cargando)
  const autenticado = useApp((estado) => estado.autenticado)

  useEffect(() => iniciar(), [iniciar])

  if (cargando && !autenticado) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-apple-green" />
        <p className="text-sm text-gray-500">Conectando con la base de datos…</p>
      </main>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<ClientList />} />
          <Route path="clientes/:clienteId" element={<ClientProfile />} />
          <Route path="libro" element={<LibroFiados />} />
          <Route path="tasas" element={<TasasCambio />} />
          <Route path="reportes" element={<ReportesCierre />} />
          <Route
            path="configuracion"
            element={
              <Soon
                titulo="Configuración"
                detalle="Datos de la tienda, monedas habilitadas y usuarios de caja."
              />
            }
          />
          <Route
            path="ayuda"
            element={
              <Soon titulo="Ayuda y Soporte" detalle="Guías de uso del mostrador y contacto." />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
