import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Soon({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">{titulo}</h1>
        <p className="text-sm text-gray-500">{detalle}</p>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-sm font-semibold text-gray-800">Sección en preparación</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-gray-500">
          Este módulo se conectará al proyecto de Supabase en cuanto el panel y el directorio de
          clientes estén listos.
        </p>
        <Link
          to="/app"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-apple-green hover:text-apple-green-dark"
        >
          <ArrowLeft size={14} aria-hidden />
          Volver al panel
        </Link>
      </div>
    </div>
  )
}
