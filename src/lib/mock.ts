import type { Cliente, Tasas, Transaccion } from './types'

const hace = (dias: number, hora = 10, minuto = 0): string => {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  fecha.setHours(hora, minuto, 0, 0)
  return fecha.toISOString()
}

export const TASAS_INICIALES: Tasas = {
  usdCop: 4150,
  usdVes: 39.4,
}

export const CLIENTES: Cliente[] = [
  {
    id: 'c1',
    nombre: 'Marta',
    apellido: 'Rodríguez',
    telefono: '+57 320 555 0198',
    cedula: '43.882.110',
    estado: true,
    desde: '2023-02-14',
  },
  {
    id: 'c2',
    nombre: 'Carlos',
    apellido: 'Méndez',
    telefono: '+57 312 849 2011',
    cedula: '1.090.482.912',
    estado: true,
    desde: '2023-06-02',
  },
  {
    id: 'c3',
    nombre: 'Víctor',
    apellido: 'Gómez',
    telefono: '+57 301 552 1169',
    cedula: '71.220.544',
    estado: true,
    desde: '2022-11-08',
  },
  {
    id: 'c4',
    nombre: 'Lucía',
    apellido: 'Fernández',
    telefono: '+58 412 555 7788',
    cedula: '20.114.887',
    estado: true,
    desde: '2024-01-23',
  },
  {
    id: 'c5',
    nombre: 'Pedro',
    apellido: 'Alcántara',
    telefono: '+57 318 442 9077',
    cedula: '98.441.020',
    estado: true,
    desde: '2023-09-30',
  },
  {
    id: 'c6',
    nombre: 'Rosa',
    apellido: 'Jiménez',
    telefono: '+57 300 123 4567',
    cedula: '36.559.871',
    estado: true,
    desde: '2021-05-17',
  },
  {
    id: 'c7',
    nombre: 'Yolanda',
    apellido: 'Peña',
    telefono: '+57 315 778 2210',
    cedula: '52.108.664',
    estado: true,
    desde: '2024-04-11',
  },
  {
    id: 'c8',
    nombre: 'Hernán',
    apellido: 'Castro',
    telefono: '+58 414 990 1122',
    cedula: '27.665.301',
    estado: true,
    desde: '2022-08-05',
  },
  {
    id: 'c9',
    nombre: 'Manuel',
    apellido: 'Isaza',
    telefono: '+57 317 665 4433',
    cedula: '19.774.552',
    estado: true,
    desde: '2023-12-19',
  },
  {
    id: 'c10',
    nombre: 'Doria',
    apellido: 'Salcedo',
    telefono: '+57 313 908 4471',
    cedula: '64.201.937',
    estado: true,
    desde: '2024-07-28',
  },
]

export const TRANSACCIONES: Transaccion[] = [
  { id: 't1', clienteId: 'c2', tipo: 'fiado', montoCop: 240000, observacion: 'Mercado quincenal: arroz Diana x10, aceite Premier x2', fecha: hace(1, 17, 40) },
  { id: 't2', clienteId: 'c1', tipo: 'abono', montoCop: 75000, observacion: 'Abono en efectivo', fecha: hace(1, 11, 15) },
  { id: 't3', clienteId: 'c9', tipo: 'fiado', montoCop: 310000, observacion: '3 bultos de harina PAN, café Sello Rojo', fecha: hace(2, 9, 20) },
  { id: 't4', clienteId: 'c5', tipo: 'abono', montoCop: 60000, observacion: 'Pago móvil Bs.', fecha: hace(3, 16, 5) },
  { id: 't5', clienteId: 'c7', tipo: 'fiado', montoCop: 890000, observacion: 'Feria de fin de mes: víveres y enlatados', fecha: hace(4, 14, 30) },
  { id: 't6', clienteId: 'c2', tipo: 'abono', montoCop: 150000, observacion: 'Transferencia Bancolombia ref #BANC-84920492', fecha: hace(6, 11, 15) },
  { id: 't7', clienteId: 'c4', tipo: 'fiado', montoCop: 89500, observacion: '2 Harina PAN, 1 litro de aceite', fecha: hace(7, 10, 0) },
  { id: 't8', clienteId: 'c10', tipo: 'fiado', montoCop: 640000, observacion: 'Abasto para kiosco', fecha: hace(8, 15, 45) },
  { id: 't9', clienteId: 'c3', tipo: 'abono', montoCop: 180000, observacion: 'Cuenta saldada en efectivo', fecha: hace(9, 9, 5) },
  { id: 't10', clienteId: 'c3', tipo: 'fiado', montoCop: 180000, observacion: '2 galones de aceite, 1 azúcar', fecha: hace(12, 17, 10) },
  { id: 't11', clienteId: 'c1', tipo: 'fiado', montoCop: 200000, observacion: 'Mercado semanal', fecha: hace(13, 12, 40) },
  { id: 't12', clienteId: 'c2', tipo: 'fiado', montoCop: 395000, observacion: 'Harina, aceite y café', fecha: hace(14, 8, 20) },
  { id: 't13', clienteId: 'c5', tipo: 'fiado', montoCop: 300000, observacion: 'Reposición de almacén', fecha: hace(16, 13, 25) },
  { id: 't14', clienteId: 'c6', tipo: 'abono', montoCop: 150000, observacion: 'Abono completo', fecha: hace(17, 10, 50) },
  { id: 't15', clienteId: 'c6', tipo: 'fiado', montoCop: 150000, observacion: '20 lbs de arroz, 5 lbs de azúcar', fecha: hace(21, 16, 0) },
  { id: 't16', clienteId: 'c8', tipo: 'abono', montoCop: 200000, observacion: 'Abono en dólares', fecha: hace(23, 15, 30) },
  { id: 't17', clienteId: 'c8', tipo: 'fiado', montoCop: 200000, observacion: 'Compra de provisiones', fecha: hace(26, 11, 45) },
  { id: 't18', clienteId: 'c9', tipo: 'abono', montoCop: 150000, observacion: 'Abono parcial', fecha: hace(28, 9, 30) },
]
