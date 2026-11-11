/**
 * GENERADOR DE PDF SIN DEPENDENCIAS
 * ----------------------------------
 * Construye un archivo PDF 1.4 real y válido (A4, texto) en el navegador.
 * Se usa para que los reportes de la maqueta sean descargas auténticas y no
 * botones decorativos.
 *
 * Todo el contenido se codifica en WinAnsiEncoding (Latin-1), que es la
 * codificación de los tipos estándar de PDF y permite acentos en español.
 */

type EstiloLinea = 'titulo' | 'subtitulo' | 'texto' | 'fuerte' | 'nota'

export interface LineaPdf {
  texto: string
  estilo?: EstiloLinea
}

/** Caracteres fuera de Latin-1 con equivalente en WinAnsiEncoding. */
const ESPECIALES: Record<string, number> = {
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '…': 0x85,
}

/** Sustituciones para símbolos que no existen en WinAnsiEncoding. */
const TRANSLITERAR: Record<string, string> = {
  '₂': '2',
  '₃': '3',
  '₁': '1',
  '₀': '0',
  '→': '-',
  '←': '-',
  '✓': 'OK',
  '✔': 'OK',
  '×': 'x',
  '·': '-',
}

/** Convierte un texto a una cadena cuyos códigos caben en un byte (0-255). */
function aWinAnsi(texto: string): string {
  let salida = ''
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0) ?? 63
    if (codigo < 0x7f) {
      salida += caracter
      continue
    }
    if (codigo >= 0xa0 && codigo <= 0xff) {
      salida += caracter
      continue
    }
    const especial = ESPECIALES[caracter]
    if (especial !== undefined) {
      salida += String.fromCharCode(especial)
      continue
    }
    const sustituto = TRANSLITERAR[caracter]
    salida += sustituto ?? '?'
  }
  return salida
}

/** Escapa los caracteres reservados de las cadenas literales de PDF. */
function escapar(texto: string): string {
  return texto.replace(/[\\()]/g, (c) => `\\${c}`)
}

/** Parte un texto en líneas que caben en el ancho útil de la página. */
function ajustarLinea(texto: string, maximo: number): string[] {
  if (texto.length <= maximo) return [texto]
  const palabras = texto.split(' ')
  const lineas: string[] = []
  let actual = ''
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra
    if (candidata.length > maximo && actual) {
      lineas.push(actual)
      actual = palabra
    } else {
      actual = candidata
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}

interface FormatoLinea {
  fuente: 'F1' | 'F2'
  tamano: number
  color: string
  salto: number
}

const FORMATOS: Record<EstiloLinea, FormatoLinea> = {
  titulo: { fuente: 'F1', tamano: 19, color: '0.06 0.35 0.17 rg', salto: 32 },
  subtitulo: { fuente: 'F1', tamano: 13, color: '0.09 0.45 0.22 rg', salto: 25 },
  fuerte: { fuente: 'F1', tamano: 11.5, color: '0.1 0.22 0.14 rg', salto: 21 },
  texto: { fuente: 'F2', tamano: 11, color: '0.16 0.24 0.18 rg', salto: 18 },
  nota: { fuente: 'F2', tamano: 9.5, color: '0.42 0.5 0.44 rg', salto: 15 },
}

const ANCHO_PAGINA = 595
const ALTO_PAGINA = 842
const MARGEN = 46

/** Construye el contenido gráfico (stream) de la única página. */
function construirContenido(lineas: LineaPdf[], pie: string): string {
  let s = ''

  // Cabecera verde de la marca
  s += '0.06 0.35 0.17 rg\n'
  s += `0 ${ALTO_PAGINA - 62} ${ANCHO_PAGINA} 62 re f\n`

  // Título y subtítulo sobre la cabecera
  s += 'BT\n/F1 18 Tf\n1 1 1 rg\n'
  s += `1 0 0 1 ${MARGEN} ${ALTO_PAGINA - 38} Tm\n`
  s += `(${escapar(aWinAnsi('HuellaVerde'))}) Tj\nET\n`

  s += 'BT\n/F2 10 Tf\n0.84 0.94 0.86 rg\n'
  s += `1 0 0 1 ${MARGEN} ${ALTO_PAGINA - 54} Tm\n`
  s += `(${escapar(aWinAnsi('Reporte de sostenibilidad ambiental'))}) Tj\nET\n`

  let y = ALTO_PAGINA - 108

  for (const linea of lineas) {
    const estilo: EstiloLinea = linea.estilo ?? 'texto'
    const formato = FORMATOS[estilo]
    const piezas = ajustarLinea(linea.texto, estilo === 'texto' || estilo === 'nota' ? 88 : 70)

    for (const pieza of piezas) {
      if (y < 70) break
      s += 'BT\n'
      s += `/${formato.fuente} ${formato.tamano} Tf\n`
      s += `${formato.color}\n`
      s += `1 0 0 1 ${MARGEN} ${y} Tm\n`
      s += `(${escapar(aWinAnsi(pieza))}) Tj\n`
      s += 'ET\n'
      y -= formato.salto
    }
    if (estilo === 'subtitulo') {
      y -= 4
      s += '0.62 0.78 0.62 RG\n1 w\n'
      s += `${MARGEN} ${y} m ${ANCHO_PAGINA - MARGEN} ${y} l S\n`
      y -= 14
    }
    if (y < 70) break
  }

  // Pie de página
  s += '0.78 0.84 0.78 RG\n0.8 w\n'
  s += `${MARGEN} 56 m ${ANCHO_PAGINA - MARGEN} 56 l S\n`
  s += 'BT\n/F2 8.5 Tf\n0.45 0.53 0.47 rg\n'
  s += `1 0 0 1 ${MARGEN} 42 Tm\n`
  s += `(${escapar(aWinAnsi(pie))}) Tj\nET\n`

  return s
}

/**
 * Crea un PDF real en memoria con las líneas indicadas.
 * @param lineas contenido del documento (el primer elemento suele ser el título)
 * @param pie    texto del pie de página
 */
export function crearPdf(lineas: LineaPdf[], pie: string): Blob {
  const contenido = construirContenido(lineas, pie)

  // Se arma el archivo objeto por objeto registrando su desplazamiento exacto.
  let pdf = '%PDF-1.4\n'
  const desplazamientos: number[] = []

  const emitir = (objeto: string) => {
    desplazamientos.push(pdf.length)
    pdf += `${objeto}\n`
  }

  emitir('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj')
  emitir('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj')
  emitir(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>\nendobj',
  )
  emitir(`4 0 obj\n<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream\nendobj`)
  emitir(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj',
  )
  emitir(
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj',
  )

  const inicioXref = pdf.length
  pdf += 'xref\n'
  pdf += `0 ${desplazamientos.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const desplazamiento of desplazamientos) {
    pdf += `${String(desplazamiento).padStart(10, '0')} 00000 n \n`
  }
  pdf += 'trailer\n'
  pdf += `<< /Size ${desplazamientos.length + 1} /Root 1 0 R >>\n`
  pdf += 'startxref\n'
  pdf += `${inicioXref}\n`
  pdf += '%%EOF\n'

  // Todos los códigos son < 256: un carácter equivale a un byte.
  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i += 1) {
    bytes[i] = pdf.charCodeAt(i) & 0xff
  }

  return new Blob([bytes], { type: 'application/pdf' })
}

/** Descarga un blob con el nombre indicado. */
export function descargarArchivo(nombreArchivo: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 5000)
}
