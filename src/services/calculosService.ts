import { api, ErrorApi } from './api'
import { listarOrganizaciones } from './organizacionesService'
import type { Organizacion } from './organizacionesService'

export interface PeriodoCalculo {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: string
}

export type RequisitoCalculoProducto =
  | 'PENDIENTE_DEFINICION'
  | 'SIN_INTENSIDAD'
  | 'INTENSIDAD_OPCIONAL'
  | 'UNIDAD_FUNCIONAL_REQUERIDA'
  | 'UNIDADES_PRODUCIDAS_REQUERIDAS'
  | 'AMBOS_REQUERIDOS'

export interface VersionCalculo {
  id: string
  numeroVersion: string
  metodologiaId: string
  metodologiaNombre: string
  requisitosCalculoProducto: RequisitoCalculoProducto
  /** Periodos (id) que la versión cubre por completo; el backend rechaza los demás. */
  periodosCubiertos: string[]
}

export interface LineaCalculo {
  id: string
  /** Claves de la traza persistida; permiten volver a asociar conversión y dato. */
  datoActividadId: string
  fechaDato: string
  unidadOriginalId: string
  unidadFactorId: string
  actividadNombre: string
  procesoNombre: string
  alcanceCodigo: string
  alcanceNombre: string
  fuenteNombre: string
  valorCo2e: string
  unidad: string
  actividadEmisionCodigo: string
  actividadEmisionNombre: string
  subcategoriaEmisionCodigo: string
  subcategoriaEmisionNombre: string
  gasCalculado: string
  factorCodigo: string
  factorValor: string
  factorFuente: string
  cantidadOriginal: string
  fuenteCodigo: string
  gasEspecifico: string
  cantidadEmision: string
  cantidadConvertida: string
  valorGwp: string
  gwpVersion: string
  baseFactor: string
  gwpBaseFactor: string
  metodologia: string
  factorAnioAplicacion: string
  factorOrigen: string
}

/** Consolidación persistida por el backend en cada cálculo (motor 2.2.0+). */
export interface ResumenConsolidacion {
  version: number
  unidad: string
  conjuntoGwp: { codigo: string; estandarVersion: string; horizonteAnios: number } | null
  estadoResultado: 'COMPLETO' | 'PARCIAL'
  alcances: {
    codigo: string
    nombre: string
    totalCo2eKg: string
    fuentesCalculadas: number
    datosCalculados: number
    lineas: number
    porBaseGwp: { base: string; co2eKg: string }[]
    fuentes: { codigo: string; nombre: string; co2eKg: string }[]
    datosPendientes: number
  }[]
  totalCo2eKg: string
  porGas: {
    gas: string
    especie: string | null
    baseCalculo: 'MASA_GAS' | 'CO2E'
    masaKg: string
    co2eKg: string
    gwp: string | null
    fueraDelTotal: boolean
  }[]
  porBaseGwp: { base: string; baseCalculo: string; co2eKg: string; lineas: number }[]
  estrategiaGwp: string
  memorias: { co2BiogenicoKg: string; absorcionesKg: string; nota: string }
  datos: {
    recuperados: number
    calculados: number
    noCalculados: number
    porClasificacion: Record<string, number>
  }
  omitidos: {
    datoId: number
    fuenteCodigo: string | null
    fuenteNombre: string
    alcanceCodigo: string | null
    requisito: string
    motivo: string
    clasificacion: string
    estadoFicha: string | null
  }[]
  coberturaCatalogo: Record<string, number>
  verificacion: {
    sumaLineasKg: string
    sumaAlcancesKg: string
    totalKg: string
    lineasDuplicadas: number
    coincide: boolean
  }
}

export interface FilaOmitida {
  datoId: string
  actividadNombre: string
  fuenteNombre: string
  cantidad: string
  unidadSimbolo: string
  motivo: string
  /** Código del requisito que falta (FACTOR_NO_DISPONIBLE, DATOS_FALTANTES…). */
  requisito: string
}

/** Dato omitido tal como lo devuelve el motor en el diagnóstico de error. */
export interface OmitidoDiagnostico {
  datoId: number
  actividadNombre: string
  fuenteNombre: string
  fuenteCodigo: string | null
  alcanceCodigo: string | null
  alcanceNombre: string | null
  actividadEmisionCodigo: string | null
  cantidad: string
  unidadSimbolo: string
  requisito: string
  clasificacion: string | null
  motivo: string
}

/** 422 `E_SIN_DATOS_CALCULABLES`: ningún dato se calculó y no se creó cálculo. */
export interface DiagnosticoCalculo {
  datosRecuperados: number
  calculados: number
  omitidos: number
  causas: { requisito: string; clasificacion: string | null; datos: number; fuentes: string[]; ejemplo: string }[]
  detalle: OmitidoDiagnostico[]
}

export function diagnosticoDeError(error: unknown): DiagnosticoCalculo | null {
  if (!(error instanceof ErrorApi) || error.status !== 422) return null
  const cuerpo = error.cuerpo as { code?: string; diagnostico?: DiagnosticoCalculo } | null
  return cuerpo?.code === 'E_SIN_DATOS_CALCULABLES' && cuerpo.diagnostico ? cuerpo.diagnostico : null
}

/** Traducción segura del requisito del motor: nunca muestra códigos ni mensajes internos. */
export function mensajeUsuarioRequisito(requisito: string, motivo = ''): string {
  switch (requisito) {
    case 'FACTOR_NO_APROBADO':
      return 'El factor de emisión correspondiente está pendiente de aprobación.'
    case 'FACTOR_RECHAZADO':
      return 'El factor de emisión de esta fuente fue rechazado; debe registrarse y aprobarse uno nuevo.'
    case 'FACTOR_INACTIVO':
      return 'Los factores de emisión de esta fuente están inactivos.'
    case 'FACTOR_INEXISTENTE':
      return 'Esta fuente no tiene ningún factor de emisión registrado.'
    case 'FACTOR_OTRA_VERSION':
      return 'Los factores de esta fuente pertenecen a otra versión metodológica.'
    case 'FACTOR_FUERA_VIGENCIA':
      return 'No hay un factor aprobado vigente para las fechas de este dato; no se usa el de otro año.'
    case 'REGION_NO_COINCIDE':
    case 'REGION_NO_DETERMINADA':
      return 'El factor disponible no aplica a la ubicación de la organización.'
    case 'SECTOR_NO_COINCIDE':
      return 'El factor disponible no aplica al sector económico de la organización.'
    case 'VARIANTE_NO_COINCIDE':
      return 'No hay factor aprobado para la opción declarada (combustible, proceso u opción de factor).'
    case 'COMPONENTE_SIN_FACTOR':
      return 'Falta el factor de uno de los componentes declarados; no se calcula una parte de la fuente.'
    case 'FACTOR_NO_DISPONIBLE':
      return /vigencia|vigente|fecha de la actividad|intervalo/i.test(motivo)
        ? 'El factor de emisión disponible no tiene vigencia para las fechas de este periodo.'
        : 'No hay un factor de emisión aprobado y aplicable para este dato y periodo.'
    case 'DATOS_FALTANTES':
      return 'Faltan datos de actividad o parámetros requeridos. Revisa la información registrada.'
    case 'UNIDAD_INCOMPATIBLE':
      return 'No hay una conversión de unidades compatible con la actividad registrada.'
    case 'FACTOR_AMBIGUO':
      return 'Hay más de un factor que podría aplicarse. Se requiere revisar su vigencia y características.'
    case 'METODOLOGIA_NO_DISPONIBLE':
    case 'METODOLOGIA_ESPECIFICA_PENDIENTE':
      return 'La metodología necesaria para este dato aún no está disponible.'
    case 'GWP_NO_DEFINIDO':
      return 'Falta un valor de calentamiento global aprobado para convertir este gas a CO₂ equivalente.'
    default:
      return 'Revisa la actividad, el alcance y los datos registrados para este elemento.'
  }
}

/** Mensaje apto para la interfaz; el ErrorApi conserva el cuerpo técnico para soporte. */
export function mensajeUsuarioCalculo(error: unknown): string {
  if (!(error instanceof ErrorApi)) {
    return 'Ocurrió un problema inesperado al calcular. Inténtalo nuevamente; si continúa, contacta al equipo de soporte.'
  }
  if (error.status === 0) {
    return 'No fue posible comunicarse con el servicio de cálculo. Revisa tu conexión e inténtalo nuevamente.'
  }

  const diagnostico = diagnosticoDeError(error)
  if (diagnostico) {
    const mensajes = [...new Set(
      diagnostico.detalle.map((fila) => mensajeUsuarioRequisito(fila.requisito, fila.motivo)),
    )]
    if (mensajes.length === 1) return mensajes[0]
    if (mensajes.length > 1) return `No fue posible calcular los datos del periodo. ${mensajes.join(' ')}`
    return 'No fue posible calcular los datos del periodo. Revisa los datos de actividad registrados.'
  }

  const cuerpo = error.cuerpo as { code?: string } | null
  if (error.status === 422) {
    return cuerpo?.code === 'E_VALIDATION'
      ? 'Revisa que el periodo, la metodología y los datos requeridos estén completos y sean válidos.'
      : 'No fue posible calcular con los datos seleccionados. Revisa la información e inténtalo nuevamente.'
  }
  if (error.status === 409) {
    return 'El periodo no está disponible para calcular. Revisa su estado o selecciona otro periodo.'
  }
  if (error.status === 401 || error.status === 403) {
    return 'Tu sesión o tus permisos no permiten realizar este cálculo. Inicia sesión nuevamente o contacta al administrador.'
  }
  if (error.status >= 500) {
    return 'No fue posible completar el cálculo por un problema del servicio. Inténtalo nuevamente más tarde.'
  }
  return 'No fue posible iniciar el cálculo. Revisa la organización, el periodo y la metodología seleccionados.'
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
  porAlcance: GrupoEmision[]
  porFuente: GrupoEmision[]
  porActividad: GrupoEmision[]
  porSubcategoria: GrupoEmision[]
  porGas: GrupoEmision[]
  resumenConsolidacion: ResumenConsolidacion | null
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
  requisitosCalculoProducto?: RequisitoCalculoProducto
  periodosCubiertos?: number[]
}

interface LineaApi {
  id: number
  datoActividadId?: number | null
  fechaDato?: string | null
  unidadOriginalId?: number | null
  unidadFactorId?: number | null
  actividadNombre: string | null
  procesoNombre: string | null
  alcanceCodigo: string | null
  alcanceNombre: string | null
  fuenteNombre: string | null
  valorCo2e: string
  unidad: string | null
  actividadEmisionCodigo?: string | null
  actividadEmisionNombre?: string | null
  subcategoriaEmisionCodigo?: string | null
  subcategoriaEmisionNombre?: string | null
  gasCalculado?: string | null
  factorCodigo?: string | null
  factorValor?: string | null
  factorFuente?: string | null
  cantidadOriginal?: string | null
  fuenteCodigo?: string | null
  gasEspecifico?: string | null
  cantidadEmision?: string | null
  cantidadConvertida?: string | null
  valorGwp?: string | null
  gwpVersion?: string | null
  baseFactor?: string | null
  gwpBaseFactor?: string | null
  metodologia?: string | null
  factorAnioAplicacion?: number | string | null
  factorOrigen?: string | null
}

interface OmitidaApi {
  datoId: number
  actividadNombre: string
  fuenteNombre: string
  cantidad: string
  unidadSimbolo: string
  motivo: string
  requisito?: string | null
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
  omitidos?: OmitidaApi[] | null
  porAlcance?: GrupoEmision[]
  porFuente?: GrupoEmision[]
  porActividad?: GrupoEmision[]
  porSubcategoria?: GrupoEmision[]
  porGas?: GrupoEmision[]
  resumenConsolidacion?: ResumenConsolidacion | null
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
      datoActividadId: linea.datoActividadId == null ? '' : String(linea.datoActividadId),
      fechaDato: linea.fechaDato ?? '',
      unidadOriginalId: linea.unidadOriginalId == null ? '' : String(linea.unidadOriginalId),
      unidadFactorId: linea.unidadFactorId == null ? '' : String(linea.unidadFactorId),
      actividadNombre: linea.actividadNombre ?? '',
      procesoNombre: linea.procesoNombre ?? '',
      alcanceCodigo: linea.alcanceCodigo ?? '',
      alcanceNombre: linea.alcanceNombre ?? '',
      fuenteNombre: linea.fuenteNombre ?? '',
      valorCo2e: linea.valorCo2e,
      unidad: linea.unidad ?? '',
      actividadEmisionCodigo: linea.actividadEmisionCodigo ?? '',
      actividadEmisionNombre: linea.actividadEmisionNombre ?? '',
      subcategoriaEmisionCodigo: linea.subcategoriaEmisionCodigo ?? '',
      subcategoriaEmisionNombre: linea.subcategoriaEmisionNombre ?? '',
      gasCalculado: linea.gasCalculado ?? '',
      factorCodigo: linea.factorCodigo ?? '',
      factorValor: linea.factorValor ?? '',
      factorFuente: linea.factorFuente ?? '',
      cantidadOriginal: linea.cantidadOriginal ?? '',
      fuenteCodigo: linea.fuenteCodigo ?? '',
      gasEspecifico: linea.gasEspecifico ?? '',
      cantidadEmision: linea.cantidadEmision ?? '',
      cantidadConvertida: linea.cantidadConvertida ?? '',
      valorGwp: linea.valorGwp ?? '',
      gwpVersion: linea.gwpVersion ?? '',
      baseFactor: linea.baseFactor ?? '',
      gwpBaseFactor: linea.gwpBaseFactor ?? '',
      metodologia: linea.metodologia ?? '',
      factorAnioAplicacion:
        linea.factorAnioAplicacion === null || linea.factorAnioAplicacion === undefined
          ? ''
          : String(linea.factorAnioAplicacion),
      factorOrigen: linea.factorOrigen ?? '',
    })),
    omitidos: (item.omitidos ?? []).map((fila) => ({
      datoId: String(fila.datoId),
      actividadNombre: fila.actividadNombre,
      fuenteNombre: fila.fuenteNombre,
      cantidad: fila.cantidad,
      unidadSimbolo: fila.unidadSimbolo,
      motivo: fila.motivo,
      requisito: fila.requisito ?? '',
    })),
    porAlcance: item.porAlcance ?? [],
    porFuente: item.porFuente ?? [],
    porActividad: item.porActividad ?? [],
    porSubcategoria: item.porSubcategoria ?? [],
    porGas: item.porGas ?? [],
    resumenConsolidacion: item.resumenConsolidacion ?? null,
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
      requisitosCalculoProducto: item.requisitosCalculoProducto ?? 'PENDIENTE_DEFINICION',
      periodosCubiertos: (item.periodosCubiertos ?? []).map(String),
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

/** Factor de emisión mínimo para saber qué unidades admite una fuente en una versión. */
export interface FactorDisponible {
  id: string
  unidadEntradaId: string
  unidadEntradaSimbolo: string
  unidadSalidaSimbolo: string
  valor: string
  gas: string
  aprobado: boolean
  /** Combustible, material o proceso que distingue factores de una misma fuente. */
  variante: string
  fechaInicioVigencia: string
  fechaFinVigencia: string | null
  /** Sin fecha final, el año de aplicación acota la vigencia (misma regla que el backend). */
  anioAplicacion: number | null
  /** BORRADOR, PENDIENTE, APROBADO o RECHAZADO, tal como lo devuelve el backend. */
  estadoAprobacion: string
  /** Política temporal aprobada (ABIERTA_HASTA_REEMPLAZO habilita una vigencia sin fin). */
  tipoVigencia: string | null
}

/**
 * Factores activos de una fuente en una versión de metodología
 * (`GET /factores-emision?versionId=&fuenteEmisionId=`, permiso factor_emision.ver).
 * Solo sirve de orientación en el formulario: quien decide si un dato se
 * calcula es siempre el backend al ejecutar el cálculo.
 */
export async function factoresDisponibles(
  versionId: string,
  fuenteEmisionId: string,
): Promise<FactorDisponible[]> {
  const respuesta = await api<{
    data: {
      id: number
      unidadEntradaId: number
      unidadEntradaSimbolo: string | null
      unidadSalidaSimbolo?: string | null
      valor?: string | null
      gas?: string | null
      estadoAprobacion?: string | null
      active: boolean
      variante?: string | null
      fechaInicioVigencia: string
      fechaFinVigencia: string | null
      anioAplicacion?: number | null
      tipoVigencia?: string | null
    }[]
  }>(`/factores-emision?versionId=${versionId}&fuenteEmisionId=${fuenteEmisionId}`)
  return respuesta.data
    .filter((item) => item.active)
    .map((item) => ({
      id: String(item.id),
      unidadEntradaId: String(item.unidadEntradaId),
      unidadEntradaSimbolo: item.unidadEntradaSimbolo ?? '',
      unidadSalidaSimbolo: item.unidadSalidaSimbolo ?? '',
      valor: item.valor ?? '',
      gas: item.gas ?? '',
      aprobado: item.estadoAprobacion === 'APROBADO',
      variante: item.variante ?? '',
      fechaInicioVigencia: item.fechaInicioVigencia,
      fechaFinVigencia: item.fechaFinVigencia,
      anioAplicacion: item.anioAplicacion ?? null,
      estadoAprobacion: item.estadoAprobacion ?? '',
      tipoVigencia: item.tipoVigencia ?? null,
    }))
}

export interface CoberturaFuenteFecha {
  fuenteCodigo: string
  estado: 'CON_FACTOR_APROBADO' | 'SOLO_PENDIENTES' | 'SIN_FACTOR'
  factorDisponible: boolean
  aprobadosVigentes: number
  aprobadosNoVigentes: number
  pendientes: number
  /** Factores rechazados de la fuente en la versión (no se usan). */
  rechazados?: number
  unidadesCompatibles: boolean
  compatibilidadDato: string
}

/** Cobertura preliminar para el intervalo; las dimensiones específicas se confirman al calcular. */
export async function consultarCoberturaFactores(
  versionId: string,
  desde: string,
  hasta: string,
  /** Con organización, la cobertura evalúa también región y sector, como el motor. */
  organizacionId?: string,
): Promise<CoberturaFuenteFecha[]> {
  const organizacion = organizacionId ? `&organizacionId=${organizacionId}` : ''
  const respuesta = await api<{ data: { fuentes: CoberturaFuenteFecha[] } }>(
    `/calculos-carbono/cobertura-factores?versionId=${versionId}&desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}${organizacion}`,
  )
  return respuesta.data.fuentes
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
