import { descargarBlob } from './exportar'
import { formatFecha, formatHora, formatMoney, textoMonto } from './money'
import { NOMBRE_TIENDA } from './tienda'
import type { Cliente, Tasas, Transaccion } from './types'

export interface ReciboCliente {
  cliente: Cliente
  transacciones: Transaccion[]
  tasas: Tasas
}

const VERDE = '#8db600'
const VERDE_OSCURO = '#759600'
const VERDE_SUAVE = '#f2f7e0'
const CORAL_OSCURO = '#d24e3b'
const TINTA = '#1f2937'
const GRIS = '#6b7280'
const GRIS_CLARO = '#9ca3af'
const BORDE = '#e5e7eb'
const FONDO_CLARO = '#f3f4f6'

function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

/** Formato DD/MM/YYYY para las fechas de la tabla de movimientos. */
function fechaCorta(iso: string): string {
  const fecha = new Date(iso)
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${fecha.getFullYear()}`
}

/** Genera y descarga el estado de cuenta (PDF) de un cliente. */
export async function generarReciboCliente(datos: ReciboCliente): Promise<void> {
  const { Document, Page, Text, View, StyleSheet, pdf } = await import('@react-pdf/renderer')

  const { cliente, tasas } = datos
  const movimientos = datos.transacciones
    .filter((tx) => tx.clienteId === cliente.id)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Saldo corrido real de la cuenta, en orden cronológico.
  let acumulado = 0
  const acumulados = movimientos.map((tx) => {
    acumulado += tx.tipo === 'fiado' ? tx.montoCop : -tx.montoCop
    return acumulado
  })
  const saldo = acumulado

  // Movimientos activos: solo los posteriores al último punto en que la cuenta
  // quedó saldada (saldo <= 0). Si nunca se saldó, se muestra todo el historial.
  let corte = -1
  acumulados.forEach((saldoParcial, indice) => {
    if (saldoParcial <= 0) corte = indice
  })
  const filas = movimientos
    .map((tx, indice) => ({ tx, saldo: acumulados[indice], indice }))
    .filter((fila) => fila.indice > corte)
  const activos = filas.map((fila) => fila.tx)

  const debe = saldo > 0
  const totalFiado = activos
    .filter((tx) => tx.tipo === 'fiado')
    .reduce((total, tx) => total + tx.montoCop, 0)
  const totalAbonos = activos
    .filter((tx) => tx.tipo === 'abono')
    .reduce((total, tx) => total + tx.montoCop, 0)

  const limite = cliente.limiteCreditoCop
  const usado = Math.max(saldo, 0)
  const porcentaje = limite ? Math.round((usado / limite) * 100) : 0

  const ahora = new Date()
  const fechaEmision = formatFecha(ahora.toISOString())
  const horaEmision = formatHora(ahora.toISOString())
  const dia = ahora.toISOString().slice(0, 10).replace(/-/g, '')
  const numeroDocumento = `EC-${cliente.id.slice(-4).toUpperCase()}-${dia}`

  const equivalencias = [
    tasas.usdCop > 0 ? `${formatMoney(saldo, 'USD', tasas)} USD` : '',
    tasas.usdVes > 0 ? `${formatMoney(saldo, 'VED', tasas)} VED` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const tasaLinea = [
    tasas.usdCop > 0 ? `1 USD = ${textoMonto(tasas.usdCop)} COP` : '',
    tasas.usdVes > 0 ? `1 VED = ${textoMonto(tasas.usdVes)} COP` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const s = StyleSheet.create({
    pagina: {
      paddingHorizontal: 40,
      paddingVertical: 36,
      paddingBottom: 58,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: TINTA,
    },
    cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    tienda: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: TINTA, letterSpacing: -0.3 },
    lema: { fontSize: 8.5, color: GRIS, marginTop: 3 },
    docNumero: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: VERDE_OSCURO,
      textAlign: 'right',
    },
    docFecha: { fontSize: 8, color: GRIS, textAlign: 'right', marginTop: 3 },
    lineaVerde: { height: 2, backgroundColor: VERDE, marginTop: 12 },
    seccion: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: GRIS_CLARO,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 16,
      marginBottom: 6,
    },
    caja: { borderWidth: 1, borderColor: BORDE, borderRadius: 6, paddingHorizontal: 12 },
    cajaVerde: {
      borderWidth: 1,
      borderColor: '#dce8b8',
      backgroundColor: VERDE_SUAVE,
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    filaDato: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 7,
      borderBottomWidth: 1,
      borderBottomColor: FONDO_CLARO,
    },
    filaDatoUltima: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
    par: { flexDirection: 'row', gap: 6, width: '48%' },
    etiqueta: { color: GRIS },
    valor: { fontFamily: 'Helvetica-Bold', color: TINTA },
    valorFino: { fontFamily: 'Helvetica-Bold', color: TINTA, textAlign: 'right' },
    etiquetaFina: { color: GRIS, textAlign: 'right' },
    saldoTitulo: { fontSize: 8, color: GRIS },
    saldoValor: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: debe ? CORAL_OSCURO : VERDE_OSCURO,
      marginTop: 2,
    },
    saldoEquivalente: { fontSize: 8.5, color: GRIS, marginTop: 3 },
    limiteFila: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    limiteTexto: { fontSize: 8.5, color: TINTA },
    tabla: { marginTop: 4 },
    filaTabla: {
      flexDirection: 'row',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: FONDO_CLARO,
    },
    cabeceraTabla: {
      flexDirection: 'row',
      paddingVertical: 6,
      backgroundColor: FONDO_CLARO,
      borderRadius: 4,
      paddingHorizontal: 6,
    },
    celdaCabecera: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      color: GRIS,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    cFecha: { width: 74 },
    cTipo: { width: 46 },
    cRecibo: { width: 54 },
    cDetalle: { flex: 1, paddingHorizontal: 4 },
    cMonto: { width: 76, textAlign: 'right' },
    cSaldo: { width: 74, textAlign: 'right' },
    fechaCelda: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: TINTA },
    horaCelda: { fontSize: 7, color: GRIS_CLARO, marginTop: 1 },
    tipoFiado: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: CORAL_OSCURO },
    tipoAbono: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: VERDE_OSCURO },
    reciboCelda: { fontSize: 8, color: GRIS },
    detalleCelda: { fontSize: 8.5, color: TINTA },
    montoFiado: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: CORAL_OSCURO },
    montoAbono: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: VERDE_OSCURO },
    saldoCelda: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: GRIS },
    celdaDerecha: { textAlign: 'right' },
    filaCelda: { flexDirection: 'row' },
    vacio: {
      fontSize: 9,
      color: GRIS,
      textAlign: 'center',
      paddingVertical: 24,
      backgroundColor: FONDO_CLARO,
      borderRadius: 6,
      marginTop: 4,
    },
    totales: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: FONDO_CLARO,
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 14,
    },
    totalCaja: { alignItems: 'center', gap: 2 },
    totalEtiqueta: { fontSize: 7.5, color: GRIS, textTransform: 'uppercase', letterSpacing: 0.4 },
    totalValor: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: TINTA },
    nota: { fontSize: 7.5, color: GRIS_CLARO, marginTop: 10, lineHeight: 1.4 },
    pieCaja: {
      position: 'absolute',
      left: 40,
      right: 40,
      bottom: 18,
      borderTopWidth: 1,
      borderTopColor: BORDE,
      paddingTop: 6,
    },
    pie: { fontSize: 7, color: GRIS_CLARO, textAlign: 'center' },
  })

  const documento = (
    <Document
      title={`Estado de cuenta - ${cliente.nombre} ${cliente.apellido}`}
      author={NOMBRE_TIENDA}
      subject="Estado de cuenta de cliente"
    >
      <Page size="A4" style={s.pagina}>
        <View style={s.cabecera}>
          <View>
            <Text style={s.tienda}>{NOMBRE_TIENDA}</Text>
            <Text style={s.lema}>Control de fiados · Estado de cuenta del cliente</Text>
          </View>
          <View>
            <Text style={s.docNumero}>{numeroDocumento}</Text>
            <Text style={s.docFecha}>
              Emitido {fechaEmision} · {horaEmision}
            </Text>
          </View>
        </View>
        <View style={s.lineaVerde} />

        <Text style={s.seccion}>Cliente</Text>
        <View style={s.caja}>
          <View style={s.filaDato}>
            <View style={s.par}>
              <Text style={s.etiqueta}>Nombre</Text>
              <Text style={s.valor}>
                {cliente.nombre} {cliente.apellido}
              </Text>
            </View>
            <View style={s.par}>
              <Text style={s.etiquetaFina}>Cédula</Text>
              <Text style={s.valorFino}>{cliente.cedula || 'Sin registrar'}</Text>
            </View>
          </View>
          <View style={s.filaDato}>
            <View style={s.par}>
              <Text style={s.etiqueta}>Teléfono</Text>
              <Text style={s.valor}>{cliente.telefono}</Text>
            </View>
            <View style={s.par}>
              <Text style={s.etiquetaFina}>Cliente desde</Text>
              <Text style={s.valorFino}>{formatFecha(cliente.desde)}</Text>
            </View>
          </View>
          <View style={s.filaDatoUltima}>
            <View style={s.par}>
              <Text style={s.etiqueta}>Estado</Text>
              <Text style={[s.valor, { color: debe ? CORAL_OSCURO : VERDE_OSCURO }]}>
                {debe ? 'Con fiado vigente' : 'Cuenta solvente'}
              </Text>
            </View>
            <View style={s.par}>
              <Text style={s.etiquetaFina}>Movimientos activos</Text>
              <Text style={s.valorFino}>{filas.length}</Text>
            </View>
          </View>
        </View>

        <Text style={s.seccion}>Saldo</Text>
        <View style={s.cajaVerde}>
          <Text style={s.saldoTitulo}>Saldo actual en pesos colombianos</Text>
          <Text style={s.saldoValor}>{formatMoney(saldo, 'COP', tasas)}</Text>
          {equivalencias && <Text style={s.saldoEquivalente}>Equivalente: {equivalencias}</Text>}
          {limite !== null && (
            <View style={s.limiteFila}>
              <Text style={s.limiteTexto}>{`Límite ${formatMoney(limite, 'COP', tasas)}`}</Text>
              <Text style={s.limiteTexto}>
                {usado >= limite
                  ? 'Crédito agotado'
                  : `Disponible ${formatMoney(limite - usado, 'COP', tasas)} · usado ${porcentaje}%`}
              </Text>
            </View>
          )}
        </View>

        <Text style={s.seccion}>Movimientos</Text>
        {filas.length === 0 ? (
          <Text style={s.vacio}>
            {movimientos.length === 0
              ? 'Sin movimientos registrados en esta cuenta todavía.'
              : 'Cuenta saldada. No hay movimientos activos.'}
          </Text>
        ) : (
          <View style={s.tabla}>
            <View style={s.cabeceraTabla}>
              <Text style={[s.celdaCabecera, s.cFecha]}>Fecha</Text>
              <Text style={[s.celdaCabecera, s.cTipo]}>Tipo</Text>
              <Text style={[s.celdaCabecera, s.cRecibo]}>Recibo</Text>
              <Text style={[s.celdaCabecera, s.cDetalle]}>Detalle</Text>
              <Text style={[s.celdaCabecera, s.cMonto]}>Monto</Text>
              <Text style={[s.celdaCabecera, s.cSaldo]}>Saldo</Text>
            </View>
            {filas.map(({ tx, saldo: saldoFila }) => {
              const esFiado = tx.tipo === 'fiado'
              return (
                <View key={tx.id} style={s.filaTabla} wrap={false}>
                  <View style={[s.filaCelda, s.cFecha]}>
                    <View>
                      <Text style={s.fechaCelda}>{fechaCorta(tx.fecha)}</Text>
                      <Text style={s.horaCelda}>{formatHora(tx.fecha)}</Text>
                    </View>
                  </View>
                  <Text style={[esFiado ? s.tipoFiado : s.tipoAbono, s.cTipo]}>
                    {esFiado ? 'Fiado' : 'Abono'}
                  </Text>
                  <Text style={[s.reciboCelda, s.cRecibo]}>
                    {esFiado ? 'F' : 'A'}-{tx.id.slice(-4).toUpperCase()}
                  </Text>
                  <Text style={[s.detalleCelda, s.cDetalle]}>{tx.observacion}</Text>
                  <Text style={[esFiado ? s.montoFiado : s.montoAbono, s.cMonto]}>
                    {esFiado ? '+' : '-'}
                    {formatMoney(tx.montoCop, 'COP', tasas)}
                  </Text>
                  <Text style={[s.saldoCelda, s.cSaldo]}>{formatMoney(saldoFila, 'COP', tasas)}</Text>
                </View>
              )
            })}
          </View>
        )}

        <View style={s.totales}>
          <View style={s.totalCaja}>
            <Text style={s.totalEtiqueta}>Total fiado</Text>
            <Text style={s.totalValor}>{formatMoney(totalFiado, 'COP', tasas)}</Text>
          </View>
          <View style={s.totalCaja}>
            <Text style={s.totalEtiqueta}>Total abonos</Text>
            <Text style={s.totalValor}>{formatMoney(totalAbonos, 'COP', tasas)}</Text>
          </View>
          <View style={s.totalCaja}>
            <Text style={s.totalEtiqueta}>Saldo actual</Text>
            <Text style={[s.totalValor, { color: debe ? CORAL_OSCURO : VERDE_OSCURO }]}>
              {formatMoney(saldo, 'COP', tasas)}
            </Text>
          </View>
        </View>

        {tasaLinea && <Text style={s.nota}>Tasas al emitir: {tasaLinea}.</Text>}
        <Text style={s.nota}>
          Documento generado por Control de Saldo. Refleja el saldo registrado en {NOMBRE_TIENDA} al
          momento de su emisión.
        </Text>

        <View fixed style={s.pieCaja}>
          <Text
            style={s.pie}
            render={({ pageNumber, totalPages }) =>
              `${NOMBRE_TIENDA} · Estado de cuenta de ${cliente.nombre} ${cliente.apellido} · Emitido ${fechaEmision} · Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )

  const blob = await pdf(documento).toBlob()
  const archivo = `estado-cuenta-${slug(`${cliente.nombre} ${cliente.apellido}`)}-${
    ahora.toISOString().slice(0, 10)
  }.pdf`
  descargarBlob(archivo, blob)
}
