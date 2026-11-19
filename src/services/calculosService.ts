import { api } from './api'
import { listarOrganizaciones } from './organizacionesService'
import type { Organizacion } from './organizacionesService'

export interface PeriodoCalculo {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: string
}

export interface VersionCalculo {
  id: string
  numeroVersion: string
  metodologiaId: string
  metodologiaNombre: string
}

export interface LineaCalculo {
  id: string
  actividadNombre: string
  procesoNombre: string
  alcanceCodigo: string
  alcanceNombre: string
  fuenteNombre: string
  valorCo2e: string
  unidad: string
}

export interface FilaOmitida {
  datoId: string
  actividadNombre: string
  fuenteNombre: string
  cantidad: string
  unidadSimbolo: string
  motivo: string
}

export interface CalculoCarbono {
  id: string
  organizacionId: string
  organizacionNombre: string
  periodoId: string
  periodoNombre: string
  versionId: string
  numeroVersion: string
  metodologiaNombre: string
  estado: string
  totalCo2e: string
  toneladasCo2e: string
  unidadesProducidas: string
  unidadFuncional: string
  intensidadCo2e: string
  unidadResultado: string
  observacion: string
  fechaCalculo: string
  lineas: LineaCalculo[]
  omitidos: FilaOmitida[]
}

interface PeriodoApi {
  id: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: string
}

interface VersionApi {
  id: number
  numeroVersion: string
  metodologiaId: number
  metodologiaNombre: string
}

interface LineaApi {
  id: number
  actividadNombre: string | null
  procesoNombre: string | null
  alcanceCodigo: string | null
  alcanceNombre: string | null
  fuenteNombre: string | null
  valorCo2e: string
  unidad: string | null
}

interface OmitidaApi {
  datoId: number
  actividadNombre: string
  fuenteNombre: string
  cantidad: string
  unidadSimbolo: string
  motivo: string
}

interface CalculoApi {
  id: number
  organizacionId: number
  organizacionNombre: string | null
  periodoId: number
  periodoNombre: string | null
  versionId: number
  numeroVersion: string | null
  metodologiaNombre: string | null
  estado: string
  totalCo2e: string | null
  toneladasCo2e: string | null
  unidadesProducidas: string | null
  unidadFuncional: string | null
  intensidadCo2e: string | null
  unidadResultado: string | null
  observacion: string | null
  fechaCalculo: string | null
  lineas?: LineaApi[]
  omitidos?: OmitidaApi[]
}

function aCalculo(item: CalculoApi): CalculoCarbono {
  return {
    id: String(item.id),
    organizacionId: String(item.organizacionId),
    organizacionNombre: item.organizacionNombre ?? '',
    periodoId: String(item.periodoId),
    periodoNombre: item.periodoNombre ?? '',
    versionId: String(item.versionId),
    numeroVersion: item.numeroVersion ?? '',
    metodologiaNombre: item.metodologiaNombre ?? '',
    estado: item.estado,
    totalCo2e: item.totalCo2e ?? '',
    toneladasCo2e: item.toneladasCo2e ?? '',
    unidadesProducidas: item.unidadesProducidas ?? '',
    unidadFuncional: item.unidadFuncional ?? '',
    intensidadCo2e: item.intensidadCo2e ?? '',
    unidadResultado: item.unidadResultado ?? '',
    observacion: item.observacion ?? '',
    fechaCalculo: item.fechaCalculo ?? '',
    lineas: (item.lineas ?? []).map((linea) => ({
      id: String(linea.id),
      actividadNombre: linea.actividadNombre ?? '',
      procesoNombre: linea.procesoNombre ?? '',
      alcanceCodigo: linea.alcanceCodigo ?? '',
      alcanceNombre: linea.alcanceNombre ?? '',
      fuenteNombre: linea.fuenteNombre ?? '',
      valorCo2e: linea.valorCo2e,
      unidad: linea.unidad ?? '',
    })),
    omitidos: (item.omitidos ?? []).map((fila) => ({
      datoId: String(fila.datoId),
      actividadNombre: fila.actividadNombre,
      fuenteNombre: fila.fuenteNombre,
      cantidad: fila.cantidad,
      unidadSimbolo: fila.unidadSimbolo,
      motivo: fila.motivo,
    })),
  }
}

export async function listarOrganizacionesCalculo(): Promise<Organizacion[]> {
  const organizaciones = await listarOrganizaciones()
  return organizaciones.filter((item) => item.estado === 'activo')
}

export async function opcionesCalculo(organizacionId: string): Promise<{
  periodos: PeriodoCalculo[]
  versiones: VersionCalculo[]
}> {
  const respuesta = await api<{
    data: { periodos: PeriodoApi[]; versiones: VersionApi[] }
  }>(`/calculos-carbono/opciones?organizacionId=${organizacionId}`)
  return {
    periodos: respuesta.data.periodos.map((item) => ({
      id: String(item.id),
      nombre: item.nombre,
      fechaInicio: item.fechaInicio,
      fechaFin: item.fechaFin,
      estado: item.estado,
    })),
    versiones: respuesta.data.versiones.map((item) => ({
      id: String(item.id),
      numeroVersion: item.numeroVersion,
      metodologiaId: String(item.metodologiaId),
      metodologiaNombre: item.metodologiaNombre,
    })),
  }
}

export async function calcularCarbono(datos: {
  organizacionId: string
  periodoId: string
  versionId: string
  unidadesProducidas?: string
  unidadFuncional?: string
}): Promise<CalculoCarbono> {
  const respuesta = await api<{ data: CalculoApi }>('/calculos-carbono', {
    method: 'POST',
    body: JSON.stringify({
      organizacionId: Number(datos.organizacionId),
      periodoId: Number(datos.periodoId),
      versionId: Number(datos.versionId),
      unidadesProducidas: datos.unidadesProducidas?.trim() || null,
      unidadFuncional: datos.unidadFuncional?.trim() || null,
    }),
  })
  return aCalculo(respuesta.data)
}

export async function listarCalculosCarbono(organizacionId?: string): Promise<CalculoCarbono[]> {
  const consulta = organizacionId ? `?organizacionId=${organizacionId}` : ''
  const respuesta = await api<{ data: CalculoApi[] }>(`/calculos-carbono${consulta}`)
  return respuesta.data.map(aCalculo)
}

export async function obtenerCalculoCarbono(id: string): Promise<CalculoCarbono> {
  const respuesta = await api<{ data: CalculoApi }>(`/calculos-carbono/${id}`)
  return aCalculo(respuesta.data)
}

export interface GrupoEmision {
  nombre: string
  valorCo2e: string
  porcentaje: number
}

export interface ResumenPeriodo {
  id: string
  periodoId: string
  periodoNombre: string
  fechaInicio: string
  totalCo2e: string
  toneladasCo2e: string
  intensidadCo2e: string
  unidadesProducidas: string
  unidadFuncional: string
  unidadResultado: string
  porAlcance: GrupoEmision[]
  porFuente: GrupoEmision[]
}

export interface ResumenCarbono {
  organizacionId: string
  organizacionNombre: string
  ultimo: ResumenPeriodo | null
  periodos: ResumenPeriodo[]
}

export interface AccionReduccion {
  id: string
  fuenteEmisionId: string
  fuenteNombre: string
  estrategia: string
  indicador: string
  meta: string
}

export interface InformeCarbono {
  titulo: string
  organizacionNombre: string
  nit: string
  sector: string
  sedes: string[]
  periodoNombre: string
  fechaInicio: string
  fechaFin: string
  metodologiaNombre: string
  numeroVersion: string
  totalCo2e: string
  toneladasCo2e: string
  unidadResultado: string
  unidadesProducidas: string
  unidadFuncional: string
  intensidadCo2e: string
  observacion: string
  papeles: {
    actividad: string
    proceso: string
    cantidad: string
    unidad: string
    documento: string
    alcance: string
  }[]
  factores: { fuente: string; valor: string; unidad: string; documento: string }[]
  porAlcance: GrupoEmision[]
  porFuente: GrupoEmision[]
  lineas: {
    actividad: string
    proceso: string
    alcance: string
    fuente: string
    valorCo2e: string
    unidad: string
  }[]
  acciones: { fuente: string; estrategia: string; indicador: string; meta: string }[]
}

interface ResumenPeriodoApi extends Omit<ResumenPeriodo, 'id' | 'periodoId'> {
  id: number
  periodoId: number
}

function aResumenPeriodo(item: ResumenPeriodoApi): ResumenPeriodo {
  return {
    ...item,
    id: String(item.id),
    periodoId: String(item.periodoId),
    intensidadCo2e: item.intensidadCo2e ?? '',
    unidadesProducidas: item.unidadesProducidas ?? '',
    unidadFuncional: item.unidadFuncional ?? '',
    unidadResultado: item.unidadResultado ?? '',
    porAlcance: item.porAlcance ?? [],
    porFuente: item.porFuente ?? [],
  }
}

export async function resumenCarbono(organizacionId: string): Promise<ResumenCarbono> {
  const respuesta = await api<{
    data: {
      organizacionId: number
      organizacionNombre: string
      ultimo: ResumenPeriodoApi | null
      periodos: ResumenPeriodoApi[]
    }
  }>(`/calculos-carbono/resumen?organizacionId=${organizacionId}`)
  return {
    organizacionId: String(respuesta.data.organizacionId),
    organizacionNombre: respuesta.data.organizacionNombre,
    ultimo: respuesta.data.ultimo ? aResumenPeriodo(respuesta.data.ultimo) : null,
    periodos: respuesta.data.periodos.map(aResumenPeriodo),
  }
}

export async function obtenerInformeCarbono(id: string): Promise<InformeCarbono> {
  const respuesta = await api<{ data: InformeCarbono }>(`/calculos-carbono/${id}/informe`)
  return respuesta.data
}

export async function listarReduccion(id: string): Promise<AccionReduccion[]> {
  const respuesta = await api<{
    data: { acciones: (Omit<AccionReduccion, 'id' | 'fuenteEmisionId'> & { id: number; fuenteEmisionId: number | null })[] }
  }>(`/calculos-carbono/${id}/reduccion`)
  return respuesta.data.acciones.map((accion) => ({
    id: String(accion.id),
    fuenteEmisionId: accion.fuenteEmisionId ? String(accion.fuenteEmisionId) : '',
    fuenteNombre: accion.fuenteNombre ?? '',
    estrategia: accion.estrategia,
    indicador: accion.indicador,
    meta: accion.meta,
  }))
}

export async function guardarReduccion(
  id: string,
  acciones: { fuenteEmisionId?: string; estrategia: string; indicador: string; meta: string }[],
): Promise<AccionReduccion[]> {
  const respuesta = await api<{
    data: { acciones: (Omit<AccionReduccion, 'id' | 'fuenteEmisionId'> & { id: number; fuenteEmisionId: number | null })[] }
  }>(`/calculos-carbono/${id}/reduccion`, {
    method: 'PUT',
    body: JSON.stringify({
      acciones: acciones.map((accion) => ({
        fuenteEmisionId: accion.fuenteEmisionId ? Number(accion.fuenteEmisionId) : null,
        estrategia: accion.estrategia,
        indicador: accion.indicador,
        meta: accion.meta,
      })),
    }),
  })
  return respuesta.data.acciones.map((accion) => ({
    id: String(accion.id),
    fuenteEmisionId: accion.fuenteEmisionId ? String(accion.fuenteEmisionId) : '',
    fuenteNombre: accion.fuenteNombre ?? '',
    estrategia: accion.estrategia,
    indicador: accion.indicador,
    meta: accion.meta,
  }))
}
