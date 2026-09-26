export function descargarBlob(nombre: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

export function exportarCSV(
  nombre: string,
  encabezados: string[],
  filas: (string | number)[][],
): void {
  const escapar = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`
  const cuerpo = [encabezados, ...filas].map((fila) => fila.map(escapar).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${cuerpo}`], { type: 'text/csv;charset=utf-8;' })
  descargarBlob(nombre, blob)
}

export function nombreDeArchivo(base: string): string {
  return `${base}-${new Date().toISOString().slice(0, 10)}.csv`
}
