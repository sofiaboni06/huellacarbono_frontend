import { api } from './api'

export type EstadoCatalogo = 'activo' | 'inactivo'

export interface CatalogoSimple {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  estado: EstadoCatalogo
}

export interface CatalogoFormulario {
  codigo: string
  nombre: string
  descripcion: string
  estado: EstadoCatalogo
}

interface CatalogoApi {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  active: boolean
}

export interface Metodologia {
  id: string
  codigo: string
  nombre: string
  tipo: 'HIDRICA' | 'CARBONO'
  descripcion: string
  entidadFuente: string
  estado: EstadoCatalogo
  versionesActivas: number
}

export interface MetodologiaFormulario {
  codigo: string
  nombre: string
  tipo: 'HIDRICA' | 'CARBONO'
  descripcion: string
  entidadFuente: string
  estado: EstadoCatalogo
}

interface MetodologiaApi {
  id: number
  codigo: string
  nombre: string
  tipo: 'HIDRICA' | 'CARBONO'
  descripcion: string | null
  entidadFuente: string | null
  active: boolean
  versionesActivas: number
}

export type RequisitoCalculoProducto =
  | 'PENDIENTE_DEFINICION'
  | 'SIN_INTENSIDAD'
  | 'INTENSIDAD_OPCIONAL'
  | 'UNIDAD_FUNCIONAL_REQUERIDA'
  | 'UNIDADES_PRODUCIDAS_REQUERIDAS'
  | 'AMBOS_REQUERIDOS'

export interface VersionMetodologia {
  id: string
  metodologiaId: string
  numeroVersion: string
  descripcion: string
  fechaInicioVigencia: string
  fechaFinVigencia: string
  estado: EstadoCatalogo
  /** Cita del documento oficial de la versión (backend: referencia_documental). */
  referenciaDocumental: string
  requisitosCalculoProducto: RequisitoCalculoProducto
}

export interface VersionFormulario {
  numeroVersion: string
  descripcion: string
  fechaInicioVigencia: string
  fechaFinVigencia: string
  estado: EstadoCatalogo
  /** Opcional: si se omite, el backend conserva el valor guardado. */
  referenciaDocumental?: string
  requisitosCalculoProducto: RequisitoCalculoProducto
}

interface VersionApi {
  id: number
  metodologiaId: number
  numeroVersion: string
  descripcion: string | null
  fechaInicioVigencia: string
  fechaFinVigencia: string | null
  active: boolean
  referenciaDocumental?: string | null
  requisitosCalculoProducto?: RequisitoCalculoProducto
}

/** `undefined` deja el campo fuera del cuerpo; texto vacío lo borra (null). */
function referenciaCuerpo(valor: string | undefined) {
  if (valor === undefined) return undefined
  return valor.trim() || null
}

export interface OpcionReferencia {
  id: string
  codigo: string
  nombre: string
  simbolo?: string
  magnitud?: string
  categoria?: string | null
}

export interface FactorEmision {
  id: string
  versionId: string
  metodologiaId: string
  metodologiaNombre: string
  numeroVersion: string
  fuenteEmisionId: string
  fuenteEmisionNombre: string
  unidadEntradaId: string
  unidadEntradaSimbolo: string
  unidadSalidaId: string
  unidadSalidaSimbolo: string
  codigo: string
  nombre: string
  valor: string
  fuente: string
  region: string
  fechaInicioVigencia: string
  fechaFinVigencia: string
  estado: EstadoCatalogo
}

export interface FactorFormulario {
  versionId: string
  fuenteEmisionId: string
  unidadEntradaId: string
  unidadSalidaId: string
  codigo: string
  nombre: string
  valor: string
  fuente: string
  region: string
  fechaInicioVigencia: string
  fechaFinVigencia: string
  estado: EstadoCatalogo
}

interface FactorApi {
  id: number
  versionId: number
  metodologiaId: number | null
  metodologiaNombre: string | null
  numeroVersion: string | null
  fuenteEmisionId: number
  fuenteEmisionNombre: string | null
  unidadEntradaId: number
  unidadEntradaSimbolo: string | null
  unidadSalidaId: number
  unidadSalidaSimbolo: string | null
  codigo: string
  nombre: string
  valor: string
  fuente: string | null
  region: string | null
  fechaInicioVigencia: string
  fechaFinVigencia: string | null
  active: boolean
}

export interface ParametroHidrico {
  id: string
  versionId: string
  metodologiaId: string
  metodologiaNombre: string
  numeroVersion: string
  unidadId: string
  unidadSimbolo: string
  codigo: string
  nombre: string
  valor: string
  fuente: string
  fechaInicioVigencia: string
  fechaFinVigencia: string
  estado: EstadoCatalogo
}

export interface ParametroFormulario {
  versionId: string
  unidadId: string
  codigo: string
  nombre: string
  valor: string
  fuente: string
  fechaInicioVigencia: string
  fechaFinVigencia: string
  estado: EstadoCatalogo
}

interface ParametroApi {
  id: number
  versionId: number
  metodologiaId: number | null
  metodologiaNombre: string | null
  numeroVersion: string | null
  unidadId: number | null
  unidadSimbolo: string | null
  codigo: string
  nombre: string
  valor: string
  fuente: string | null
  fechaInicioVigencia: string
  fechaFinVigencia: string | null
  active: boolean
}

function estadoDe(activo: boolean): EstadoCatalogo {
  return activo ? 'activo' : 'inactivo'
}

function aCatalogo(item: CatalogoApi): CatalogoSimple {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
    descripcion: item.descripcion?.trim() ?? '',
    estado: estadoDe(item.active),
  }
}

function cuerpoSimple(datos: CatalogoFormulario, incluirEstado: boolean) {
  const cuerpo: Record<string, unknown> = {
    codigo: datos.codigo.trim(),
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim() || null,
  }
  if (incluirEstado) cuerpo.active = datos.estado === 'activo'
  return cuerpo
}

export async function listarCatalogo(ruta: string): Promise<CatalogoSimple[]> {
  const respuesta = await api<{ data: CatalogoApi[] }>(`/${ruta}?includeInactive=true`)
  return respuesta.data.map(aCatalogo)
}

export async function crearCatalogo(ruta: string, datos: CatalogoFormulario): Promise<CatalogoSimple> {
  const respuesta = await api<{ data: CatalogoApi }>(`/${ruta}`, {
    method: 'POST',
    body: JSON.stringify(cuerpoSimple(datos, false)),
  })
  return aCatalogo(respuesta.data)
}

export async function actualizarCatalogo(
  ruta: string,
  id: string,
  datos: CatalogoFormulario,
): Promise<CatalogoSimple> {
  const respuesta = await api<{ data: CatalogoApi }>(`/${ruta}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpoSimple(datos, true)),
  })
  return aCatalogo(respuesta.data)
}

function aMetodologia(item: MetodologiaApi): Metodologia {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
    tipo: item.tipo,
    descripcion: item.descripcion?.trim() ?? '',
    entidadFuente: item.entidadFuente?.trim() ?? '',
    estado: estadoDe(item.active),
    versionesActivas: item.versionesActivas ?? 0,
  }
}

export async function listarMetodologias(): Promise<Metodologia[]> {
  const respuesta = await api<{ data: MetodologiaApi[] }>('/metodologias?includeInactive=true')
  return respuesta.data.map(aMetodologia)
}

export async function crearMetodologia(datos: MetodologiaFormulario): Promise<Metodologia> {
  const respuesta = await api<{ data: MetodologiaApi }>('/metodologias', {
    method: 'POST',
    body: JSON.stringify({
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      descripcion: datos.descripcion.trim() || null,
      entidadFuente: datos.entidadFuente.trim() || null,
    }),
  })
  return aMetodologia(respuesta.data)
}

export async function actualizarMetodologia(id: string, datos: MetodologiaFormulario): Promise<Metodologia> {
  const respuesta = await api<{ data: MetodologiaApi }>(`/metodologias/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
      tipo: datos.tipo,
      descripcion: datos.descripcion.trim() || null,
      entidadFuente: datos.entidadFuente.trim() || null,
      active: datos.estado === 'activo',
    }),
  })
  return aMetodologia(respuesta.data)
}

function aVersion(item: VersionApi): VersionMetodologia {
  return {
    id: String(item.id),
    metodologiaId: String(item.metodologiaId),
    numeroVersion: item.numeroVersion,
    descripcion: item.descripcion?.trim() ?? '',
    fechaInicioVigencia: item.fechaInicioVigencia,
    fechaFinVigencia: item.fechaFinVigencia ?? '',
    estado: estadoDe(item.active),
    referenciaDocumental: item.referenciaDocumental?.trim() ?? '',
    requisitosCalculoProducto: item.requisitosCalculoProducto ?? 'PENDIENTE_DEFINICION',
  }
}

export async function listarVersiones(metodologiaId: string): Promise<VersionMetodologia[]> {
  const respuesta = await api<{ data: VersionApi[] }>(
    `/metodologias/${metodologiaId}/versiones?includeInactive=true`,
  )
  return respuesta.data.map(aVersion)
}

export async function crearVersion(metodologiaId: string, datos: VersionFormulario): Promise<VersionMetodologia> {
  const respuesta = await api<{ data: VersionApi }>(`/metodologias/${metodologiaId}/versiones`, {
    method: 'POST',
    body: JSON.stringify({
      numeroVersion: datos.numeroVersion.trim(),
      descripcion: datos.descripcion.trim() || null,
      fechaInicioVigencia: datos.fechaInicioVigencia,
      fechaFinVigencia: datos.fechaFinVigencia || null,
      referenciaDocumental: referenciaCuerpo(datos.referenciaDocumental),
      requisitosCalculoProducto: datos.requisitosCalculoProducto,
    }),
  })
  return aVersion(respuesta.data)
}

export async function actualizarVersion(
  metodologiaId: string,
  id: string,
  datos: VersionFormulario,
): Promise<VersionMetodologia> {
  const respuesta = await api<{ data: VersionApi }>(`/metodologias/${metodologiaId}/versiones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      numeroVersion: datos.numeroVersion.trim(),
      descripcion: datos.descripcion.trim() || null,
      fechaInicioVigencia: datos.fechaInicioVigencia,
      fechaFinVigencia: datos.fechaFinVigencia || null,
      active: datos.estado === 'activo',
      referenciaDocumental: referenciaCuerpo(datos.referenciaDocumental),
      requisitosCalculoProducto: datos.requisitosCalculoProducto,
    }),
  })
  return aVersion(respuesta.data)
}

function aOpcion(item: {
  id: number
  codigo: string
  nombre: string
  simbolo?: string
  magnitud?: string
  categoria?: string | null
}): OpcionReferencia {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
    simbolo: item.simbolo,
    magnitud: item.magnitud,
    categoria: item.categoria,
  }
}

export async function listarOpcionesFactor(): Promise<{ fuentes: OpcionReferencia[]; unidades: OpcionReferencia[] }> {
  const respuesta = await api<{
    data: {
      fuentes: { id: number; codigo: string; nombre: string; categoria: string | null }[]
      unidades: { id: number; codigo: string; nombre: string; simbolo: string; magnitud: string }[]
    }
  }>('/factores-emision/opciones')
  return {
    fuentes: respuesta.data.fuentes.map(aOpcion),
    unidades: respuesta.data.unidades.map(aOpcion),
  }
}

export async function listarOpcionesParametro(): Promise<OpcionReferencia[]> {
  const respuesta = await api<{
    data: { unidades: { id: number; codigo: string; nombre: string; simbolo: string; magnitud: string }[] }
  }>('/parametros-hidricos/opciones')
  return respuesta.data.unidades.map(aOpcion)
}

function aFactor(item: FactorApi): FactorEmision {
  return {
    id: String(item.id),
    versionId: String(item.versionId),
    metodologiaId: item.metodologiaId ? String(item.metodologiaId) : '',
    metodologiaNombre: item.metodologiaNombre ?? '',
    numeroVersion: item.numeroVersion ?? '',
    fuenteEmisionId: String(item.fuenteEmisionId),
    fuenteEmisionNombre: item.fuenteEmisionNombre ?? '',
    unidadEntradaId: String(item.unidadEntradaId),
    unidadEntradaSimbolo: item.unidadEntradaSimbolo ?? '',
    unidadSalidaId: String(item.unidadSalidaId),
    unidadSalidaSimbolo: item.unidadSalidaSimbolo ?? '',
    codigo: item.codigo,
    nombre: item.nombre,
    valor: item.valor,
    fuente: item.fuente?.trim() ?? '',
    region: item.region?.trim() ?? '',
    fechaInicioVigencia: item.fechaInicioVigencia,
    fechaFinVigencia: item.fechaFinVigencia ?? '',
    estado: estadoDe(item.active),
  }
}

function cuerpoFactor(datos: FactorFormulario, incluirEstado: boolean) {
  const cuerpo: Record<string, unknown> = {
    versionId: Number(datos.versionId),
    fuenteEmisionId: Number(datos.fuenteEmisionId),
    unidadEntradaId: Number(datos.unidadEntradaId),
    unidadSalidaId: Number(datos.unidadSalidaId),
    codigo: datos.codigo.trim(),
    nombre: datos.nombre.trim(),
    valor: datos.valor.trim(),
    fuente: datos.fuente.trim() || null,
    region: datos.region.trim() || null,
    fechaInicioVigencia: datos.fechaInicioVigencia,
    fechaFinVigencia: datos.fechaFinVigencia || null,
  }
  if (incluirEstado) cuerpo.active = datos.estado === 'activo'
  return cuerpo
}

export async function listarFactores(): Promise<FactorEmision[]> {
  const respuesta = await api<{ data: FactorApi[] }>('/factores-emision?includeInactive=true')
  return respuesta.data.map(aFactor)
}

export async function crearFactor(datos: FactorFormulario): Promise<FactorEmision> {
  const respuesta = await api<{ data: FactorApi }>('/factores-emision', {
    method: 'POST',
    body: JSON.stringify(cuerpoFactor(datos, false)),
  })
  return aFactor(respuesta.data)
}

export async function actualizarFactor(id: string, datos: FactorFormulario): Promise<FactorEmision> {
  const respuesta = await api<{ data: FactorApi }>(`/factores-emision/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpoFactor(datos, true)),
  })
  return aFactor(respuesta.data)
}

function aParametro(item: ParametroApi): ParametroHidrico {
  return {
    id: String(item.id),
    versionId: String(item.versionId),
    metodologiaId: item.metodologiaId ? String(item.metodologiaId) : '',
    metodologiaNombre: item.metodologiaNombre ?? '',
    numeroVersion: item.numeroVersion ?? '',
    unidadId: item.unidadId ? String(item.unidadId) : '',
    unidadSimbolo: item.unidadSimbolo ?? '',
    codigo: item.codigo,
    nombre: item.nombre,
    valor: item.valor,
    fuente: item.fuente?.trim() ?? '',
    fechaInicioVigencia: item.fechaInicioVigencia,
    fechaFinVigencia: item.fechaFinVigencia ?? '',
    estado: estadoDe(item.active),
  }
}

function cuerpoParametro(datos: ParametroFormulario, incluirEstado: boolean) {
  const cuerpo: Record<string, unknown> = {
    versionId: Number(datos.versionId),
    unidadId: datos.unidadId ? Number(datos.unidadId) : null,
    codigo: datos.codigo.trim(),
    nombre: datos.nombre.trim(),
    valor: datos.valor.trim(),
    fuente: datos.fuente.trim() || null,
    fechaInicioVigencia: datos.fechaInicioVigencia,
    fechaFinVigencia: datos.fechaFinVigencia || null,
  }
  if (incluirEstado) cuerpo.active = datos.estado === 'activo'
  return cuerpo
}

export async function listarParametros(): Promise<ParametroHidrico[]> {
  const respuesta = await api<{ data: ParametroApi[] }>('/parametros-hidricos?includeInactive=true')
  return respuesta.data.map(aParametro)
}

export async function crearParametro(datos: ParametroFormulario): Promise<ParametroHidrico> {
  const respuesta = await api<{ data: ParametroApi }>('/parametros-hidricos', {
    method: 'POST',
    body: JSON.stringify(cuerpoParametro(datos, false)),
  })
  return aParametro(respuesta.data)
}

export async function actualizarParametro(id: string, datos: ParametroFormulario): Promise<ParametroHidrico> {
  const respuesta = await api<{ data: ParametroApi }>(`/parametros-hidricos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpoParametro(datos, true)),
  })
  return aParametro(respuesta.data)
}
