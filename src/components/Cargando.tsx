export default function Cargando({ texto = 'Cargando datos de la tienda…' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16">
      <span
        className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-apple-green"
        aria-hidden
      />
      <p className="text-sm text-gray-500">{texto}</p>
    </div>
  )
}
