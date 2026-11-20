import type { LineaPdf } from './generarPdf'
import type { InformeCarbono } from '../services/calculosService'

export function lineasInforme(informe: InformeCarbono): LineaPdf[] {
  const sedes = informe.sedes.length ? informe.sedes.join(', ') : 'Sin sede'
  const lineas: LineaPdf[] = [
    { texto: informe.titulo, estilo: 'titulo' },
    { texto: informe.organizacionNombre, estilo: 'subtitulo' },
    { texto: `NIT ${informe.nit}${informe.sector ? ` · ${informe.sector}` : ''}`, estilo: 'texto' },
    { texto: `Sede: ${sedes}`, estilo: 'texto' },
    {
      texto: `Periodo: ${informe.periodoNombre} (${informe.fechaInicio} a ${informe.fechaFin})`,
      estilo: 'texto',
    },
    { texto: `Metodología: ${informe.metodologiaNombre} ${informe.numeroVersion}`, estilo: 'texto' },
    { texto: 'Resultado', estilo: 'subtitulo' },
    {
      texto: `${informe.totalCo2e || 'sin total'} ${informe.unidadResultado} · ${informe.toneladasCo2e || 'sin toneladas'} t CO2e`,
      estilo: 'fuerte',
    },
  ]

  if (informe.intensidadCo2e) {
    lineas.push({
      texto: `Intensidad: ${informe.intensidadCo2e} kg CO2e por ${informe.unidadFuncional || 'unidad'} (${informe.unidadesProducidas} ${informe.unidadFuncional || 'unidades'})`,
      estilo: 'fuerte',
    })
  }

  lineas.push({ texto: 'Datos de actividad', estilo: 'subtitulo' })
  for (const papel of informe.papeles) {
    lineas.push({
      texto: `${papel.actividad} · ${papel.proceso} · ${papel.cantidad} ${papel.unidad} · ${papel.alcance}${papel.documento ? ` · ${papel.documento}` : ''}`,
      estilo: 'texto',
    })
  }

  lineas.push({ texto: 'Factores aplicados', estilo: 'subtitulo' })
  for (const factor of informe.factores) {
    lineas.push({
      texto: `${factor.fuente}: ${factor.valor} kg CO2e/${factor.unidad}${factor.documento ? ` · ${factor.documento}` : ''}`,
      estilo: 'texto',
    })
  }

  lineas.push({ texto: 'Emisiones por fuente', estilo: 'subtitulo' })
  for (const grupo of informe.porFuente) {
    lineas.push({
      texto: `${grupo.nombre}: ${grupo.valorCo2e} kg CO2e (${grupo.porcentaje}%)`,
      estilo: 'texto',
    })
  }

  lineas.push({ texto: 'Emisiones por alcance', estilo: 'subtitulo' })
  for (const grupo of informe.porAlcance) {
    lineas.push({
      texto: `${grupo.nombre}: ${grupo.valorCo2e} kg CO2e (${grupo.porcentaje}%)`,
      estilo: 'texto',
    })
  }

  lineas.push({ texto: 'Detalle', estilo: 'subtitulo' })
  for (const linea of informe.lineas) {
    lineas.push({
      texto: `${linea.actividad} · ${linea.proceso} · ${linea.alcance} · ${linea.fuente}: ${linea.valorCo2e} ${linea.unidad}`,
      estilo: 'texto',
    })
  }

  lineas.push({ texto: 'Plan de reducción', estilo: 'subtitulo' })
  if (!informe.acciones.length) {
    lineas.push({ texto: 'Este cálculo todavía no tiene acciones de reducción.', estilo: 'nota' })
  }
  for (const accion of informe.acciones) {
    lineas.push({
      texto: `${accion.fuente ? `${accion.fuente}: ` : ''}${accion.estrategia}. Indicador: ${accion.indicador}. Meta: ${accion.meta}`,
      estilo: 'texto',
    })
  }

  if (informe.observacion) {
    lineas.push({ texto: 'Nota', estilo: 'subtitulo' })
    lineas.push({ texto: informe.observacion, estilo: 'nota' })
  }

  return lineas
}
