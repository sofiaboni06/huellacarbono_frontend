import { api } from './api'
import type { CalculoCarbono } from './calculosService'

/**
 * Datos de actividad de carbono («papeles»).
 *
 * Contrato verificado contra el backend (rama feature/cierre-funcional-huella-carbono):
 *   GET   /datos-actividad-carbono/opciones?organizacionId=
 *   GET   /datos-actividad-carbono?organizacionId=&periodoId=
 *   POST  /datos-actividad-carbono
 *   PATCH /datos-actividad-carbono/:id
 */

export interface OpcionPapel {
  id: string
  nombre: string
  detalle: string
}

/** Estado metodológico de una fuente (ficha `requisitosCalculo` del backend). */
export type EstadoMetodologico =
  | 'EJECUTABLE'
  | 'PENDIENTE_DATOS'
  | 'PENDIENTE_METODOLOGIA'
  | 'PENDIENTE_DECISION'
  | 'NO_APLICA'
  | 'BLOQUEADA'

export interface RequisitosFuente {
  estado: EstadoMetodologico
  metodologia: string
  datos: string
  unidades: string
  factor: string
  pendiente: string
}

/** Combustible o energía que la fuente pide declarar para elegir su factor oficial. */
export interface OpcionCombustible {
  codigo: string
  nombre: string
  requiereFraccionBio: boolean
}

export interface SeleccionCombustible {
  aplicacion: string
  sugerido: string | null
  opciones: OpcionCombustible[]
}

/** Parámetro que la fuente pide al usuario (definido por el backend). */
export interface CampoParametro {
  campo: string
  etiqueta: string
  tipo: 'decimal' | 'fraccion' | 'seleccion' | 'booleano' | 'unidad'
  requerido: boolean
  magnitudes?: string[]
  ayuda?: string
  opciones?: { valor: string; texto: string }[]
}

export interface FuentePapel {
  id: string
  codigo: string
  nombre: string
  /** `null` cuando el backend no envía la ficha (contrato aún no publicado). */
  requisitos: RequisitosFuente | null
  seleccionCombustible: SeleccionCombustible | null
  camposParametros: CampoParametro[]
}

export interface ActividadEmisionPapel {
  id: string
  codigo: string
  nombre: string
  alcanceId: string
  alcanceCodigo: string
}

export interface SubcategoriaPapel {
  id: string
  codigo: string
  nombre: string
  actividadEmisionId: string
}

export interface VinculoFuente {
  actividadEmisionId: string
  fuenteEmisionId: string
  /** Cadena vacía cuando el vínculo no tiene subcategoría. */
  subcategoriaEmisionId: string
}

export interface OpcionesPapel {
  actividades: OpcionPapel[]
  fuentes: FuentePapel[]
  alcances: OpcionPapel[]
  unidades: OpcionPapel[]
  actividadesEmision: ActividadEmisionPapel[]
  subcategorias: SubcategoriaPapel[]
  vinculos: VinculoFuente[]
}

/** Parámetros adicionales que el backend admite según la fuente/metodología. */
export interface ParametrosCalculo {
  consumoEspecifico?: string
  unidadConsumoId?: number
  unidadDistanciaId?: number
  densidad?: string
  unidadDensidadId?: number
  poderCalorifico?: string
  unidadPoderCalorificoId?: number
  tipoProceso?: 'NATURAL_TRONA'
  purezaProducto?: string
  tipoCarbonato?: 'CALIZA' | 'DOLOMITA'
  tipoPlantaNitrica?: 'L_L' | 'L_M' | 'M_M' | 'M_H' | 'H_H'
  abatimientoN2OActivo?: boolean
  purezaAcido?: string
  purezaCarbonato?: string
  tipoProcesoAcero?: 'BOF' | 'EAF_CHATARRA' | 'OHF'
  combustible?: string
  fraccionBiocombustible?: string
  [campo: string]: string | number | boolean | undefined
  procesoAmoniaco?: string
  ureaProducida?: string
  co2Recuperado?: string
}

export interface PapelCarbono {
  id: string
  actividadNombre: string
  procesoNombre: string
  fuenteEmisionId: string
  fuenteNombre: string
  alcanceCodigo: string
  alcanceNombre: string
  actividadEmisionCodigo: string
  actividadEmisionNombre: string
  subcategoriaEmisionCodigo: string
  subcategoriaEmisionNombre: string
  cantidad: string
  unidadId: string
  unidadSimbolo: string
  fechaDato: string
  fuenteDato: string
  observacion: string
  estadoRegistro: string
}

export function conversionPersistida(
  papel: PapelCarbono,
  calculo: CalculoCarbono | null,
  unidades: OpcionPapel[],
) {
  if (!calculo) return null
  const lineas = calculo.lineas.filter((linea) => linea.datoActividadId === papel.id)
  if (!lineas.length || lineas.some((linea) =>
    linea.cantidadOriginal !== papel.cantidad ||
    linea.unidadOriginalId !== papel.unidadId ||
    linea.fechaDato !== papel.fechaDato,
  )) return null
  const primera = lineas[0]
  if (lineas.some((linea) =>
    linea.cantidadConvertida !== primera.cantidadConvertida || linea.unidadFactorId !== primera.unidadFactorId,
  )) return null
  if (!primera.cantidadConvertida || !primera.unidadFactorId) return null
  const unidadDestino = unidades.find((unidad) => unidad.id === primera.unidadFactorId)?.nombre
  if (!unidadDestino) return null
  return {
    cantidadOriginal: papel.cantidad,
    unidadOriginal: papel.unidadSimbolo,
    cantidadConvertida: primera.cantidadConvertida,
    unidadDestino,
    requerida: primera.unidadOriginalId !== primera.unidadFactorId,
    factorCodigo: primera.factorCodigo,
  }
}

interface OpcionApi {
  id: number
  nombre?: string
  codigo?: string
  simbolo?: string
  procesoNombre?: string
}

interface FuenteApi {
  id: number
  codigo: string
  nombre: string
  requisitosCalculo?: RequisitosFuente | null
  seleccionCombustible?: SeleccionCombustible | null
  camposParametros?: CampoParametro[]
}

interface OpcionesApi {
  actividades: OpcionApi[]
  fuentes: FuenteApi[]
  alcances: OpcionApi[]
  unidades: OpcionApi[]
  actividadesEmision?: {
    id: number
    codigo: string
    nombre: string
    alcanceId: number
    alcanceCodigo: string
  }[]
  subcategoriasEmision?: {
    id: number
    codigo: string
    nombre: string
    actividadEmisionId: number
  }[]
  fuentesPorActividadEmision?: {
    actividadEmisionId: number
    fuenteEmisionId: number
    subcategoriaEmisionId: number | null
  }[]
}

interface PapelApi {
  id: number
  actividadNombre: string | null
  procesoNombre: string | null
  fuenteEmisionId?: number
  fuenteNombre: string | null
  alcanceCodigo: string | null
  alcanceNombre: string | null
  actividadEmisionCodigo?: string | null
  actividadEmisionNombre?: string | null
  subcategoriaEmisionCodigo?: string | null
  subcategoriaEmisionNombre?: string | null
  cantidad: string
  unidadId?: number
  unidadSimbolo: string | null
  fechaDato?: string | null
  fuenteDato: string | null
  observacion?: string | null
  estadoRegistro: string
}

function aOpcion(item: OpcionApi, detalle: string): OpcionPapel {
  return { id: String(item.id), nombre: item.nombre ?? item.codigo ?? '', detalle }
}

function aPapel(item: PapelApi): PapelCarbono {
  return {
    id: String(item.id),
    actividadNombre: item.actividadNombre ?? '',
    procesoNombre: item.procesoNombre ?? '',
    fuenteEmisionId: item.fuenteEmisionId ? String(item.fuenteEmisionId) : '',
    fuenteNombre: item.fuenteNombre ?? '',
    alcanceCodigo: item.alcanceCodigo ?? '',
    alcanceNombre: item.alcanceNombre ?? '',
    actividadEmisionCodigo: item.actividadEmisionCodigo ?? '',
    actividadEmisionNombre: item.actividadEmisionNombre ?? '',
    subcategoriaEmisionCodigo: item.subcategoriaEmisionCodigo ?? '',
    subcategoriaEmisionNombre: item.subcategoriaEmisionNombre ?? '',
    cantidad: item.cantidad,
    unidadId: item.unidadId == null ? '' : String(item.unidadId),
    unidadSimbolo: item.unidadSimbolo ?? '',
    fechaDato: item.fechaDato ?? '',
    fuenteDato: item.fuenteDato ?? '',
    observacion: item.observacion ?? '',
    estadoRegistro: item.estadoRegistro,
  }
}

export async function opcionesPapel(organizacionId: string): Promise<OpcionesPapel> {
  const respuesta = await api<{ data: OpcionesApi }>(
    `/datos-actividad-carbono/opciones?organizacionId=${organizacionId}`,
  )
  const datos = respuesta.data
  return {
    actividades: datos.actividades.map((item) => aOpcion(item, item.procesoNombre ?? '')),
    fuentes: datos.fuentes.map((item) => ({
      id: String(item.id),
      codigo: item.codigo,
      nombre: item.nombre,
      requisitos: item.requisitosCalculo ?? null,
      seleccionCombustible: item.seleccionCombustible ?? null,
      camposParametros: item.camposParametros ?? [],
    })),
    alcances: datos.alcances.map((item) => aOpcion(item, item.codigo ?? '')),
    unidades: datos.unidades.map((item) => ({
      id: String(item.id),
      nombre: item.simbolo ?? item.nombre ?? '',
      detalle: item.nombre ?? '',
    })),
    actividadesEmision: (datos.actividadesEmision ?? []).map((item) => ({
      id: String(item.id),
      codigo: item.codigo,
      nombre: item.nombre,
      alcanceId: String(item.alcanceId),
      alcanceCodigo: item.alcanceCodigo,
    })),
    subcategorias: (datos.subcategoriasEmision ?? []).map((item) => ({
      id: String(item.id),
      codigo: item.codigo,
      nombre: item.nombre,
      actividadEmisionId: String(item.actividadEmisionId),
    })),
    vinculos: (datos.fuentesPorActividadEmision ?? []).map((item) => ({
      actividadEmisionId: String(item.actividadEmisionId),
      fuenteEmisionId: String(item.fuenteEmisionId),
      subcategoriaEmisionId: item.subcategoriaEmisionId ? String(item.subcategoriaEmisionId) : '',
    })),
  }
}

export async function listarPapeles(organizacionId: string, periodoId: string) {
  const respuesta = await api<{ data: PapelApi[] }>(
    `/datos-actividad-carbono?organizacionId=${organizacionId}&periodoId=${periodoId}`,
  )
  return respuesta.data.map(aPapel)
}

export async function crearPapel(datos: {
  actividadId: string
  periodoId: string
  fuenteEmisionId: string
  alcanceId: string
  actividadEmisionId: string
  subcategoriaEmisionId?: string
  unidadId: string
  cantidad: string
  fechaDato?: string
  fuenteDato: string
  observacion?: string
  parametrosCalculo?: ParametrosCalculo
}) {
  const parametros = datos.parametrosCalculo
  const respuesta = await api<{ data: PapelApi }>('/datos-actividad-carbono', {
    method: 'POST',
    body: JSON.stringify({
      actividadId: Number(datos.actividadId),
      periodoId: Number(datos.periodoId),
      fuenteEmisionId: Number(datos.fuenteEmisionId),
      alcanceId: Number(datos.alcanceId),
      actividadEmisionId: Number(datos.actividadEmisionId),
      subcategoriaEmisionId: datos.subcategoriaEmisionId ? Number(datos.subcategoriaEmisionId) : null,
      unidadId: Number(datos.unidadId),
      cantidad: datos.cantidad.trim(),
      fechaDato: datos.fechaDato?.trim() || null,
      fuenteDato: datos.fuenteDato.trim() || null,
      observacion: datos.observacion?.trim() || null,
      ...(parametros && Object.keys(parametros).length ? { parametrosCalculo: parametros } : {}),
    }),
  })
  return aPapel(respuesta.data)
}

export async function rechazarPapel(id: string) {
  const respuesta = await api<{ data: PapelApi }>(`/datos-actividad-carbono/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estadoRegistro: 'RECHAZADO' }),
  })
  return aPapel(respuesta.data)
}

/** Resultado de `POST /datos-actividad-carbono/equivalencia` (misma conversión que el motor). */
export interface EquivalenciaUnidad {
  cantidad: string
  valor: string
  unidadOrigen: { id: string; simbolo: string }
  unidadDestino: { id: string; simbolo: string }
}

/**
 * Pide al backend la equivalencia entre la unidad del dato y la del factor.
 * La matemática vive solo en el backend; si no es posible convertir (unidades
 * incompatibles o falta densidad/poder calorífico) lanza ErrorApi con el motivo.
 */
export async function equivalenciaUnidad(datos: {
  cantidad: string
  unidadOrigenId: string
  unidadDestinoId: string
  densidad?: string
  unidadDensidadId?: string
  poderCalorifico?: string
  unidadPoderCalorificoId?: string
}): Promise<EquivalenciaUnidad> {
  const respuesta = await api<{
    data: {
      cantidad: string
      valor: string
      unidadOrigen: { id: number; simbolo: string }
      unidadDestino: { id: number; simbolo: string }
    }
  }>('/datos-actividad-carbono/equivalencia', {
    method: 'POST',
    body: JSON.stringify({
      cantidad: datos.cantidad,
      unidadOrigenId: Number(datos.unidadOrigenId),
      unidadDestinoId: Number(datos.unidadDestinoId),
      ...(datos.densidad && datos.unidadDensidadId
        ? { densidad: datos.densidad, unidadDensidadId: Number(datos.unidadDensidadId) }
        : {}),
      ...(datos.poderCalorifico && datos.unidadPoderCalorificoId
        ? {
            poderCalorifico: datos.poderCalorifico,
            unidadPoderCalorificoId: Number(datos.unidadPoderCalorificoId),
          }
        : {}),
    }),
  })
  return {
    cantidad: respuesta.data.cantidad,
    valor: respuesta.data.valor,
    unidadOrigen: { id: String(respuesta.data.unidadOrigen.id), simbolo: respuesta.data.unidadOrigen.simbolo },
    unidadDestino: { id: String(respuesta.data.unidadDestino.id), simbolo: respuesta.data.unidadDestino.simbolo },
  }
}
