import fabricaLogo from '../assets/images/logo-fabrica.png'
import senaLogo from '../assets/images/sena-logo.png'
import geovaLogo from '../assets/images/logo-huella.png'
import type { InformeCarbono } from '../services/calculosService'

type EstiloLinea = 'titulo' | 'subtitulo' | 'texto' | 'fuerte' | 'nota'
export interface LineaPdf { texto: string; estilo?: EstiloLinea }

const W = 595.28
const H = 841.89
const M = 50
const AZUL = '#4b9fc0'
const AZUL_CLARO = '#eef8fb'
const AZUL_LINEA = '#c8e6f1'
const TINTA = '#263f50'

type Logo = { name: string; width: number; height: number; bytes: Uint8Array }

function color(hex: string): [number, number, number] {
  const valor = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(valor.slice(i, i + 2), 16) / 255) as [number, number, number]
}

function winAnsi(texto: string): Uint8Array {
  const especiales: Record<string, number> = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f, '₂': 50, '₃': 51, '₁': 49, '₀': 48, '₄': 52, '₅': 53, '₆': 54, '₇': 55, '₈': 56, '₉': 57, '·': 0xb7, 'ₑ': 101 }
  return Uint8Array.from(Array.from(texto, (ch) => {
    const cp = ch.codePointAt(0) ?? 63
    return cp <= 255 ? cp : (especiales[ch] ?? 63)
  }))
}

function pdfString(texto: string): string {
  return texto.replace(/[\\()]/g, (match) => `\\${match}`)
}

function bytes(texto: string): Uint8Array {
  return winAnsi(texto)
}

function concat(items: Uint8Array[]): Uint8Array {
  const salida = new Uint8Array(items.reduce((s, item) => s + item.length, 0))
  let offset = 0
  for (const item of items) { salida.set(item, offset); offset += item.length }
  return salida
}

async function cargarLogo(url: string, name: string, fondo = '#ffffff'): Promise<Logo> {
  const imagen = new Image()
  imagen.src = url
  await new Promise<void>((resolve, reject) => {
    imagen.onload = () => resolve()
    imagen.onerror = () => reject(new Error(`No se pudo cargar el logo ${name}.`))
  })
  const canvas = document.createElement('canvas')
  canvas.width = imagen.naturalWidth
  canvas.height = imagen.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo preparar la imagen del informe.')
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(imagen, 0, 0)
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('No se pudo convertir un logo.')), 'image/jpeg', 0.92))
  return { name, width: canvas.width, height: canvas.height, bytes: new Uint8Array(await blob.arrayBuffer()) }
}

class Paginas {
  actual: string[] = []
  paginas: string[] = []
  y = 0
  constructor() { this.nueva(true) }
  private op(value: string) { this.actual.push(value) }
  nueva(cabecera = true) {
    if (this.actual.length) this.paginas.push(this.actual.join('\n'))
    this.actual = []
    this.y = cabecera ? 111 : 0
    if (cabecera) {
      this.rect(0, 0, W, 82, AZUL)
      this.imagen('Fabrica', M, 15, 166, 48)
      this.text('REPORTE DE SOSTENIBILIDAD AMBIENTAL', 350, 49, 7.5, '#ffffff', false)
    }
  }
  finish() {
    this.paginas.push(this.actual.join('\n'))
    this.paginas = this.paginas.map((page, index) => `${page}\n${this.pie(index + 1)}`)
  }
  private pie(numero: number) {
    const [r, g, b] = color(AZUL_LINEA)
    return `q ${r} ${g} ${b} RG 0.6 w ${M} 62 m ${W - M} 62 l S Q\n${this.imageOp('Sena', M + 8, 19, 40, 35)}\n${this.textOp('GEOVA · Plataforma de gestión ambiental', 229, 37, 7, '#5e91a8', false)}\n${this.imageOp('Geova', W - M - 73, 15, 68, 39)}\n${this.textOp(`Página ${numero}`, W - M - 58, 10, 6.4, '#688b9a', false)}`
  }
  textOp(texto: string, x: number, top: number, size: number, hex: string, bold: boolean) {
    const [r, g, b] = color(hex)
    return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${(H - top - size).toFixed(2)} Tm (${pdfString(texto)}) Tj ET`
  }
  text(texto: string, x: number, top: number, size: number, hex = TINTA, bold = false) { this.op(this.textOp(texto, x, top, size, hex, bold)) }
  rect(x: number, top: number, width: number, height: number, fill: string, stroke?: string) {
    const [r, g, b] = color(fill)
    const y = H - top - height
    this.op(`q ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x} ${y} ${width} ${height} re f Q`)
    if (stroke) {
      const [sr, sg, sb] = color(stroke)
      this.op(`q ${sr.toFixed(3)} ${sg.toFixed(3)} ${sb.toFixed(3)} RG 0.55 w ${x} ${y} ${width} ${height} re S Q`)
    }
  }
  line(x1: number, top1: number, x2: number, top2: number, hex = AZUL_LINEA, width = 0.6) {
    const [r, g, b] = color(hex)
    this.op(`q ${r} ${g} ${b} RG ${width} w ${x1} ${H - top1} m ${x2} ${H - top2} l S Q`)
  }
  private imageOp(name: string, x: number, top: number, width: number, height: number) {
    return `q ${width} 0 0 ${height} ${x} ${H - top - height} cm /${name} Do Q`
  }
  imagen(name: string, x: number, top: number, width: number, height: number) { this.op(this.imageOp(name, x, top, width, height)) }
  ensure(height: number, cabecera = true) { if (this.y + height > H - 82) this.nueva(cabecera) }
  paragraph(texto: string, x: number, width: number, size = 9, lineHeight = 13, hex = TINTA, bold = false) {
    const max = Math.max(12, Math.floor(width / (size * 0.51)))
    const lines: string[] = []
    for (const chunk of texto.split(/\r?\n/)) {
      let current = ''
      for (const word of chunk.split(/\s+/)) {
        const next = current ? `${current} ${word}` : word
        if (next.length > max && current) { lines.push(current); current = word } else current = next
      }
      if (current) lines.push(current)
    }
    for (const line of lines) {
      this.ensure(lineHeight)
      this.text(line, x, this.y, size, hex, bold)
      this.y += lineHeight
    }
  }
  heading(index: string, title: string, subtitle: string) {
    this.ensure(80)
    this.text(index, M, this.y, 9, AZUL, true); this.y += 22
    this.text(title, M, this.y, 25, AZUL, true); this.y += 34
    this.paragraph(subtitle, M, W - 2 * M, 9, 13, '#547889')
    this.y += 23
  }
  table(title: string, headers: string[], rows: string[][], widths: number[]) {
    this.ensure(51)
    this.text(title, M, this.y, 15, AZUL, true); this.y += 23
    const drawHeader = () => {
      let x = M
      headers.forEach((value, i) => { this.rect(x, this.y, widths[i], 28, AZUL); this.paragraphInCell(value, x + 7, this.y + 8, widths[i] - 12, true, '#ffffff'); x += widths[i] })
      this.y += 28
    }
    drawHeader()
    for (const row of rows) {
      const remaining = row.map((value, i) => this.wrap(value, widths[i] - 14, 7.5))
      while (remaining.some((lines) => lines.length)) {
        const cellLines = remaining.map((lines) => lines.splice(0, 52))
        const rowHeight = Math.max(30, ...cellLines.map((lines) => lines.length * 9 + 13))
        if (this.y + rowHeight > H - 82) { this.nueva(); drawHeader() }
        let x = M
        cellLines.forEach((lines, i) => {
          this.rect(x, this.y, widths[i], rowHeight, this.y % 2 < 1 ? '#ffffff' : '#f6fbfd', AZUL_LINEA)
          lines.forEach((line, j) => this.text(line, x + 7, this.y + 7 + j * 9, 7.5))
          x += widths[i]
        })
        this.y += rowHeight
      }
    }
    this.y += 25
  }
  private wrap(value: string, width: number, size: number) {
    const max = Math.max(8, Math.floor(width / (size * 0.5)))
    const lines: string[] = []; let current = ''
    for (const word of String(value || '—').split(/\s+/)) {
      const next = current ? `${current} ${word}` : word
      if (next.length > max && current) { lines.push(current); current = word } else current = next
    }
    if (current) lines.push(current)
    return lines
  }
  private paragraphInCell(value: string, x: number, top: number, width: number, bold: boolean, hex: string) {
    const lines = this.wrap(value, width, 7.3)
    lines.slice(0, 2).forEach((line, i) => this.text(line, x, top + i * 9, 7.3, hex, bold))
  }
  circle(cx: number, cyTop: number, radius: number, fill: string) {
    const [r, g, b] = color(fill); const cy = H - cyTop; const k = radius * 0.55228475
    this.op(`q ${r} ${g} ${b} rg ${cx + radius} ${cy} m ${cx + radius} ${cy + k} ${cx + k} ${cy + radius} ${cx} ${cy + radius} c ${cx - k} ${cy + radius} ${cx - radius} ${cy + k} ${cx - radius} ${cy} c ${cx - radius} ${cy - k} ${cx - k} ${cy - radius} ${cx} ${cy - radius} c ${cx + k} ${cy - radius} ${cx + radius} ${cy - k} ${cx + radius} ${cy} c f Q`)
  }
  bar(x: number, top: number, width: number, height: number, fill: string) { this.rect(x, top, width, height, fill) }
}

function fecha(value: string) {
  if (!value) return 'No disponible'
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}
function fechaPeriodo(nombre: string, inicio: string, fin: string) {
  return inicio && fin ? `${fecha(inicio)} – ${fecha(fin)}` : (nombre || 'No disponible')
}
function fmt(value: string | number) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString('es-CO', { maximumFractionDigits: 2 }) : String(value || '0')
}
function safe(text: string | undefined) { return text?.trim() || 'No disponible' }

function dibujarGraficaFuente(doc: Paginas, informe: InformeCarbono) {
  const fuentes = informe.porFuente ?? []
  const total = fuentes.reduce((sum, f) => sum + (Number(f.valorCo2e) || 0), 0)
  const paleta = ['#69b6d2', '#a9dfeb', '#80c9dd', '#93d6e5', '#4b9fc0', '#c7eaf2']
  doc.rect(M, doc.y, W - 2 * M, 154, '#f5fbfd')
  const cx = M + 102, cy = doc.y + 77, radius = 52
  let angle = -Math.PI / 2
  fuentes.forEach((f, i) => {
    const share = total > 0 ? (Number(f.valorCo2e) || 0) / total : 0
    const next = angle + share * Math.PI * 2
    const steps = Math.max(3, Math.ceil((next - angle) * 20))
    const points = Array.from({ length: steps + 1 }, (_, j) => {
      const a = angle + (next - angle) * j / steps
      return [cx + radius * Math.cos(a), H - (cy + radius * Math.sin(a))]
    })
    const [r, g, b] = color(paleta[i % paleta.length])
    doc.actual.push(`q ${r} ${g} ${b} rg ${cx} ${H - cy} m ${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)} l`).join(' ')} h f Q`)
    angle = next
  })
  doc.circle(cx, cy, 29, '#ffffff')
  doc.text(fmt(informe.totalCo2e), cx - 26, cy - 4, 9, TINTA, true)
  doc.text('kg CO₂e', cx - 20, cy + 10, 6.5, '#5e8291')
  const visible = fuentes.slice(0, 7)
  visible.forEach((f, i) => {
    const y = doc.y + 30 + i * 16
    doc.rect(M + 208, y, 10, 10, paleta[i % paleta.length])
    doc.text(f.nombre, M + 228, y, 8, TINTA, true)
    const percentage = f.porcentaje ?? (total ? (Number(f.valorCo2e) || 0) / total * 100 : 0)
    doc.text(`${fmt(f.valorCo2e)} kg CO₂e · ${fmt(percentage)}%`, W - M - 104, y, 7, '#5e8291')
  })
  if (fuentes.length > 7) doc.text(`Y ${fuentes.length - 7} fuentes adicionales en el detalle`, M + 208, doc.y + 30 + 7 * 16, 7, '#5e8291')
  doc.y += 174
}

function dibujarAlcances(doc: Paginas, informe: InformeCarbono) {
  const grupos = informe.porAlcance ?? []
  const top = doc.y + 16, left = M + 34, width = W - 2 * M - 54, chartHeight = 124
  const max = Math.max(1, ...grupos.map((g) => Number(g.valorCo2e) || 0))
  for (let i = 0; i <= 4; i++) {
    const y = top + chartHeight - chartHeight * i / 4
    doc.line(left, y, left + width, y)
    doc.text(fmt(max * i / 4), M + 4, y - 4, 6.5, '#5e8291')
  }
  const slot = width / Math.max(1, grupos.length)
  grupos.forEach((g, i) => {
    const value = Number(g.valorCo2e) || 0
    const height = value / max * chartHeight
    const x = left + i * slot + slot * 0.25
    doc.bar(x, top + chartHeight - height, slot * 0.5, height, ['#71bdd6', '#9bd5e5', '#b5e3ee'][i % 3])
    doc.text(fmt(g.valorCo2e), x, top + chartHeight - height - 13, 7, TINTA, true)
    doc.text(g.nombre, x - 8, top + chartHeight + 13, 6.7, '#547889')
  })
  doc.y = top + chartHeight + 42
  const resumen = grupos.map((g) => `${g.nombre}: ${fmt(g.valorCo2e)} kg CO₂e (${fmt(g.porcentaje)}%)`).join(' · ')
  doc.paragraph(resumen || 'El cálculo no incluye emisiones desglosadas por alcance.', M, W - 2 * M, 7.5, 10, '#547889')
}

function construirPaginas(informe: InformeCarbono) {
  const doc = new Paginas()
  const periodo = fechaPeriodo(informe.periodoNombre, informe.fechaInicio, informe.fechaFin)
  const sede = informe.sedes?.length ? informe.sedes.join(', ') : 'Sin sede registrada'

  // Portada institucional
  doc.text('INFORME DE HUELLA DE CARBONO', M, 119, 9, AZUL, true)
  doc.text('Desempeño ambiental', M, 139, 25, AZUL, true)
  doc.text('de la organización', M, 168, 25, AZUL, true)
  doc.paragraph(`${safe(informe.organizacionNombre)} · Periodo evaluado: ${safe(informe.periodoNombre)} · Sede: ${sede}`, M, W - 2 * M, 8.5, 12, '#547889')
  doc.y = 247
  doc.rect(M, doc.y, W - 2 * M, 119, AZUL)
  doc.text(`${fmt(informe.totalCo2e)}`, M + 20, doc.y + 23, 24, '#ffffff', true)
  doc.text(`kg CO₂e · HUELLA DE CARBONO TOTAL`, M + 21, doc.y + 56, 8, '#ffffff', true)
  doc.text(`Equivalente a ${fmt(informe.toneladasCo2e)} t CO₂e`, M + 21, doc.y + 81, 8.5, '#ffffff')
  doc.text('ORGANIZACIÓN', M + 245, doc.y + 23, 7.5, '#ffffff', true)
  doc.paragraph(safe(informe.organizacionNombre), M + 245, 230, 8, 10, '#ffffff')
  doc.text('ACTIVIDAD / SECTOR', M + 245, doc.y + 51, 7.5, '#ffffff', true)
  doc.paragraph(safe(informe.sector), M + 245, 230, 8, 10, '#ffffff')
  doc.text('METODOLOGÍA', M + 245, doc.y + 78, 7.5, '#ffffff', true)
  doc.paragraph(`${safe(informe.metodologiaNombre)} · ${safe(informe.numeroVersion)}`, M + 245, 230, 8, 10, '#ffffff')
  doc.y += 146
  doc.table('Identificación de la organización', ['Campo', 'Información', 'Campo', 'Información'], [
    ['Razón social', safe(informe.organizacionNombre), 'NIT', safe(informe.nit)],
    ['Sector / actividad', safe(informe.sector), 'Sede(s)', sede],
    ['Periodo', periodo, 'Unidad', safe(informe.unidadResultado)],
  ], [98, 175, 62, 160])
  doc.rect(M, doc.y, W - 2 * M, 67, AZUL_CLARO)
  doc.paragraph('Este informe presenta las emisiones estimadas para la organización y el periodo indicados. La identificación, las actividades y los resultados corresponden a los registros asociados al cálculo seleccionado.', M + 14, W - 2 * M - 28, 8.5, 12)

  // Resumen y gráficas de resultados
  doc.nueva()
  doc.heading('01 · RESUMEN DE RESULTADOS', 'Distribución de emisiones', `Contribución de cada fuente al total calculado para ${safe(informe.periodoNombre)}.`)
  dibujarGraficaFuente(doc, informe)
  doc.text('Indicadores principales', M, doc.y, 15, AZUL, true); doc.y += 22
  const topFuentes = (informe.porFuente ?? []).slice(0, 3)
  const cardWidth = (W - 2 * M - 16) / 3
  topFuentes.forEach((f, i) => {
    const x = M + i * (cardWidth + 8)
    doc.rect(x, doc.y, cardWidth, 68, AZUL_CLARO)
    doc.text(fmt(f.valorCo2e), x + 12, doc.y + 15, 17, AZUL, true)
    doc.paragraph(`kg CO₂e · ${f.nombre}`, x + 12, cardWidth - 24, 7, 9, '#547889')
  })
  if (!topFuentes.length) { doc.rect(M, doc.y, W - 2 * M, 48, AZUL_CLARO); doc.text('Sin desglose de fuentes disponible', M + 12, doc.y + 17, 8, '#547889') }
  doc.y += 87
  doc.text('Emisiones por alcance', M, doc.y, 15, AZUL, true); doc.y += 16
  dibujarAlcances(doc, informe)

  // Detalle de datos y metodología; las tablas continúan con encabezado repetido.
  doc.nueva()
  doc.heading('02 · DATOS Y METODOLOGÍA', 'Detalle del cálculo', 'Datos de actividad y factores de emisión utilizados en el cálculo seleccionado.')
  const papeles = informe.papeles ?? []
  doc.table('Datos de actividad', ['Actividad', 'Proceso', 'Consumo', 'Alcance', 'Soporte'], papeles.map((p) => [p.actividad || 'No disponible', p.proceso || 'No disponible', `${p.cantidad} ${p.unidad}`.trim(), p.alcance, p.documento || 'No especificado']), [130, 125, 92, 56, 92])
  doc.table('Emisiones por fuente', ['Fuente', 'Emisiones', 'Participación'], (informe.porFuente ?? []).map((f) => [f.nombre, `${fmt(f.valorCo2e)} kg CO₂e`, `${fmt(f.porcentaje)}%`]), [220, 145, 130])
  doc.table('Factores de emisión aplicados', ['Fuente', 'Factor aplicado', 'Referencia'], (informe.factores ?? []).map((f) => [f.fuente, `${fmt(f.valor)} kg CO₂e/${f.unidad}`, f.documento || 'No especificada']), [165, 150, 180])
  const lineas = informe.lineas ?? []
  if (lineas.length) doc.table('Resultados por actividad', ['Actividad / proceso', 'Fuente', 'Alcance', 'Emisiones'], lineas.map((l) => [`${l.actividad} · ${l.proceso}`, l.fuente, l.alcance, `${fmt(l.valorCo2e)} ${l.unidad}`]), [180, 130, 75, 110])
  if ((informe.acciones ?? []).length) doc.table('Acciones de reducción registradas', ['Fuente', 'Estrategia', 'Indicador y meta'], informe.acciones.map((a) => [a.fuente || 'General', a.estrategia, `${a.indicador} · ${a.meta}`]), [105, 190, 200])
  doc.ensure(74)
  doc.rect(M, doc.y, W - 2 * M, 67, AZUL_CLARO)
  doc.paragraph(`Nota metodológica: ${safe(informe.metodologiaNombre)} ${safe(informe.numeroVersion)}. Los factores, referencias y acciones reflejan la información disponible en el informe del cálculo seleccionado.`, M + 14, W - 2 * M - 28, 8, 11)
  doc.y += 82
  doc.text('Lectura del resultado', M, doc.y, 14, AZUL, true); doc.y += 21
  const mayor = [...(informe.porFuente ?? [])].sort((a, b) => (Number(b.valorCo2e) || 0) - (Number(a.valorCo2e) || 0))[0]
  doc.paragraph(mayor ? `${mayor.nombre} representa la mayor contribución reportada (${fmt(mayor.porcentaje)}%). El desglose presentado permite revisar las fuentes y los alcances registrados para orientar el análisis ambiental.` : 'El cálculo no contiene datos desglosados suficientes para identificar una fuente de mayor contribución.', M, W - 2 * M, 8.5, 12)
  if (informe.observacion) { doc.y += 9; doc.paragraph(`Observación: ${informe.observacion}`, M, W - 2 * M, 8, 11) }
  doc.finish()
  return doc.paginas
}

/** Genera el informe multipágina con datos del cálculo indicado. */
export async function crearInformePdf(informe: InformeCarbono): Promise<Blob> {
  const logos = await Promise.all([
    cargarLogo(fabricaLogo, 'Fabrica', AZUL), cargarLogo(senaLogo, 'Sena'), cargarLogo(geovaLogo, 'Geova'),
  ])
  const paginas = construirPaginas(informe)
  const objectBodies: Uint8Array[] = []
  const addObject = (body: Uint8Array) => { objectBodies.push(body); return objectBodies.length + 2 }
  const fontRegular = addObject(bytes('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'))
  const fontBold = addObject(bytes('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'))
  const imageIds = new Map<string, number>()
  logos.forEach((logo) => imageIds.set(logo.name, addObject(concat([
    bytes(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>\nstream\n`), logo.bytes, bytes('\nendstream'),
  ]))))
  let nextId = objectBodies.length + 3
  const pageIds: number[] = []
  for (const contenido of paginas) {
    const stream = bytes(contenido)
    const contentId = nextId++
    objectBodies.push(concat([bytes(`<< /Length ${stream.length} >>\nstream\n`), stream, bytes('\nendstream')]))
    const xobjects = logos.map((logo) => `/${logo.name} ${imageIds.get(logo.name)} 0 R`).join(' ')
    const pageId = nextId++
    objectBodies.push(bytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> /XObject << ${xobjects} >> >> /Contents ${contentId} 0 R >>`))
    pageIds.push(pageId)
  }
  const kids = pageIds.map((id) => `${id} 0 R`).join(' ')
  // Reserve catalog/pages at the beginning in final ordering via explicit object numbers.
  const allObjects = [
    bytes('<< /Type /Catalog /Pages 2 0 R >>'),
    bytes(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`),
    ...objectBodies,
  ]
  // Object references above are numbered after the two root objects.
  const shifted = allObjects.map((obj, i) => ({ obj, id: i + 1 }))
  // Page/resource object IDs in bodies are already based on objectBodies; roots add two slots.
  const output = [bytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')]
  const offsets: number[] = [0]
  let length = output[0].length
  shifted.forEach(({ obj, id }) => {
    offsets[id] = length
    const wrapped = concat([bytes(`${id} 0 obj\n`), obj, bytes('\nendobj\n')])
    output.push(wrapped); length += wrapped.length
  })
  const xrefOffset = length
  let xref = `xref\n0 ${shifted.length + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= shifted.length; i++) xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  xref += `trailer\n<< /Size ${shifted.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  output.push(bytes(xref))
  void kids
  const finalBytes = concat(output)
  return new Blob([finalBytes.buffer.slice(finalBytes.byteOffset, finalBytes.byteOffset + finalBytes.byteLength) as ArrayBuffer], { type: 'application/pdf' })
}

/** Generador de texto legado usado en las descargas del módulo Cálculos. */
export function crearPdf(lineas: LineaPdf[], pie: string): Blob {
  const paginas: string[] = []
  let contenido = ''
  const win = (value: string) => Array.from(value, (ch) => { const cp = ch.codePointAt(0) ?? 63; return String.fromCharCode(cp <= 255 ? cp : ({ '₂': 50, '₃': 51, '₁': 49, '·': 45, '—': 45 } as Record<string, number>)[ch] ?? 63) }).join('')
  const esc = (value: string) => win(value).replace(/[\\()]/g, (ch) => `\\${ch}`)
  const formats: Record<EstiloLinea, [string, number, string, number]> = {
    titulo: ['F1', 19, '0.06 0.35 0.17 rg', 32], subtitulo: ['F1', 13, '0.09 0.45 0.22 rg', 25],
    fuerte: ['F1', 11.5, '0.1 0.22 0.14 rg', 21], texto: ['F2', 11, '0.16 0.24 0.18 rg', 18], nota: ['F2', 9.5, '0.42 0.5 0.44 rg', 15],
  }
  const start = () => { contenido = '0.06 0.35 0.17 rg\n0 780 595 62 re f\nBT /F1 18 Tf 1 1 1 rg 1 0 0 1 46 804 Tm (HuellaVerde) Tj ET\nBT /F2 10 Tf 0.84 0.94 0.86 rg 1 0 0 1 46 788 Tm (Reporte de sostenibilidad ambiental) Tj ET\n'; return 734 }
  let y = start()
  for (const linea of lineas) {
    const [font, size, shade, advance] = formats[linea.estilo ?? 'texto']
    const width = linea.estilo === 'texto' || linea.estilo === 'nota' ? 88 : 70
    const words = esc(linea.texto).split(' '); const wrapped: string[] = []; let row = ''
    for (const word of words) { const next = row ? `${row} ${word}` : word; if (next.length > width && row) { wrapped.push(row); row = word } else row = next }
    if (row) wrapped.push(row)
    for (const rowText of wrapped) {
      if (y < 70) { contenido += `0.78 0.84 0.78 RG 0.8 w 46 56 m 549 56 l S BT /F2 8.5 Tf 0.45 0.53 0.47 rg 1 0 0 1 46 42 Tm (${esc(pie)}) Tj ET`; paginas.push(contenido); y = start() }
      contenido += `BT /${font} ${size} Tf ${shade} 1 0 0 1 46 ${y} Tm (${rowText}) Tj ET\n`; y -= advance
    }
  }
  contenido += `0.78 0.84 0.78 RG 0.8 w 46 56 m 549 56 l S BT /F2 8.5 Tf 0.45 0.53 0.47 rg 1 0 0 1 46 42 Tm (${esc(pie)}) Tj ET`
  paginas.push(contenido)
  const enc = new TextEncoder()
  const objects: Uint8Array[] = [enc.encode('<< /Type /Catalog /Pages 2 0 R >>')]
  const pageIds = paginas.map((_, i) => 5 + i * 2)
  objects.push(enc.encode(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`))
  objects.push(enc.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'))
  objects.push(enc.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'))
  paginas.forEach((page, i) => {
    const stream = win(page); const bytesStream = Uint8Array.from(Array.from(stream, (ch) => ch.charCodeAt(0) & 255))
    objects.push(enc.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`))
    objects.push(concat([enc.encode(`<< /Length ${bytesStream.length} >>\nstream\n`), bytesStream, enc.encode('\nendstream')]))
  })
  const parts: Uint8Array[] = [enc.encode('%PDF-1.4\n')]; const offsets = [0]; let length = parts[0].length
  objects.forEach((object, index) => { offsets.push(length); const wrapped = concat([enc.encode(`${index + 1} 0 obj\n`), object, enc.encode('\nendobj\n')]); parts.push(wrapped); length += wrapped.length })
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`
  parts.push(enc.encode(xref)); return new Blob([concat(parts).buffer as ArrayBuffer], { type: 'application/pdf' })
}

/** Descarga el blob generado sin cambiar el flujo del botón existente. */
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
