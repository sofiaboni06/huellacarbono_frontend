/**
 * Servicio de datos de actividad — integración real con el backend.
 *
 * Endpoints consumidos (AdonisJS, todos exigen Bearer token):
 *
 *   GET    /api/v1/projects?…                     proyectos activos («proyecto» = organizacion)
 *   GET    /api/v1/activities?projectId=          actividades del proyecto
 *   GET    /api/v1/periods?projectId=             periodos del proyecto
 *   GET    /api/v1/emission-sources               fuentes de emisión activas
 *   GET    /api/v1/emission-scopes                alcances de emisión activos
 *   GET    /api/v1/measurement-units              unidades activas (catálogo existente)
 *   GET    /api/v1/activity-data?projectId=       listado filtrado por proyecto
 *   GET    /api/v1/activity-data/:id              detalle
 *   POST   /api/v1/activity-data                  alta
 *   PATCH  /api/v1/activity-data/:id              edición parcial
 *   DELETE /api/v1/activity-data/:id              eliminación (409 si está referenciado)
 *
 * `quantity` viaja siempre como cadena: convertirla a `Number` perdería
 * precisión de DECIMAL(24, 8) y el backend la rechaza con 422.
 */
import { pedir } from './apiCliente'
import type {
  ActividadCatalogo,
  AlcanceEmisionCatalogo,
  DatoActividad,
  DatoActividadFormulario,
  FuenteEmisionCatalogo,
  PeriodoCatalogo,
  Proyecto,
  UnidadMedida,
} from './tipos'

/** Filtros del listado. Todos opcionales salvo `projectId` (obligatorio). */
export interface FiltrosDatosActividad {
  projectId: number
  periodId?: number
  activityId?: number
  emissionSourceId?: number
  scopeId?: number
}

/* ------------------------------- Catálogos ------------------------------- */

/** Proyectos activos («proyecto» = `organizacion` en el esquema). */
export async function listarProyectos(): Promise<Proyecto[]> {
  const datos = await pedir<Proyecto[]>('projects')
  return Array.isArray(datos) ? datos : []
}

/**
 * Etiqueta legible de un proyecto para selectores y cápsulas.
 *
 * Varias organizaciones pueden compartir nombre y NIT (sedes del mismo
 * instituto), así que se usa el nombre corto —o el nombre completo si no
 * tiene— con la dirección como sufijo. Del dirección se toma solo la última
 * parte (la ciudad en la práctica): «SENA — Popayán». Sin dirección la
 * etiqueta queda en el nombre.
 */
export function etiquetaProyecto(proyecto: Proyecto): string {
  const base = proyecto.shortName?.trim() || proyecto.name
  const partes = (proyecto.address ?? '')
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean)
  const sufijo = partes[partes.length - 1]
  return sufijo && sufijo !== base ? `${base} — ${sufijo}` : base
}

/** Actividades activas del proyecto, con su proceso y sede para identificarlas. */
export async function listarActividades(projectId: number): Promise<ActividadCatalogo[]> {
  const datos = await pedir<ActividadCatalogo[]>('activities', { query: { projectId } })
  return Array.isArray(datos) ? datos : []
}

/** Periodos de medición del proyecto (ABIERTO, CERRADO o BLOQUEADO). */
export async function listarPeriodos(projectId: number): Promise<PeriodoCatalogo[]> {
  const datos = await pedir<PeriodoCatalogo[]>('periods', { query: { projectId } })
  return Array.isArray(datos) ? datos : []
}

/** Fuentes de emisión activas. */
export async function listarFuentesEmision(): Promise<FuenteEmisionCatalogo[]> {
  const datos = await pedir<FuenteEmisionCatalogo[]>('emission-sources')
  return Array.isArray(datos) ? datos : []
}

/** Alcances de emisión activos. */
export async function listarAlcances(): Promise<AlcanceEmisionCatalogo[]> {
  const datos = await pedir<AlcanceEmisionCatalogo[]>('emission-scopes')
  return Array.isArray(datos) ? datos : []
}

/**
 * Unidades activas reutilizando `GET /measurement-units` (catálogo existente).
 * Sin `includeInactive` el backend devuelve solo las activas, que es lo que
 * necesita el selector del formulario.
 */
export async function listarUnidadesActivas(): Promise<UnidadMedida[]> {
  const datos = await pedir<UnidadMedida[]>('measurement-units')
  return Array.isArray(datos) ? datos : []
}

/* ----------------------------- Registros -------------------------------- */

/** Listado filtrado por proyecto (y opcionalmente por periodo, actividad, fuente o alcance). */
export async function listarDatosActividad(
  filtros: FiltrosDatosActividad,
): Promise<DatoActividad[]> {
  const datos = await pedir<DatoActividad[]>('activity-data', { query: { ...filtros } })
  return Array.isArray(datos) ? datos : []
}

/** Consulta puntual de un dato de actividad por identificador. */
export async function obtenerDatoActividad(id: number): Promise<DatoActividad> {
  return pedir<DatoActividad>(`activity-data/${id}`)
}

/**
 * Crea un dato de actividad en el proyecto indicado.
 * El proyecto llega aparte porque se deriva del selector, no del formulario.
 */
export async function crearDatoActividad(
  projectId: number,
  datos: DatoActividadFormulario,
): Promise<DatoActividad> {
  return pedir<DatoActividad>('activity-data', {
    metodo: 'POST',
    cuerpo: {
      projectId,
      activityId: Number(datos.activityId),
      periodId: Number(datos.periodId),
      emissionSourceId: Number(datos.emissionSourceId),
      scopeId: Number(datos.scopeId),
      unitId: Number(datos.unitId),
      quantity: datos.quantity.trim(),
      whatToCopy: datos.whatToCopy.trim(),
      document: datos.document.trim(),
    },
  })
}

/** Edición parcial: solo viajan los campos presentes en `cambios`. */
export async function actualizarDatoActividad(
  id: number,
  cambios: Partial<DatoActividadFormulario>,
): Promise<DatoActividad> {
  const cuerpo: Record<string, string | number> = {}
  if (cambios.activityId !== undefined) cuerpo.activityId = Number(cambios.activityId)
  if (cambios.periodId !== undefined) cuerpo.periodId = Number(cambios.periodId)
  if (cambios.emissionSourceId !== undefined) cuerpo.emissionSourceId = Number(cambios.emissionSourceId)
  if (cambios.scopeId !== undefined) cuerpo.scopeId = Number(cambios.scopeId)
  if (cambios.unitId !== undefined) cuerpo.unitId = Number(cambios.unitId)
  if (cambios.quantity !== undefined) cuerpo.quantity = cambios.quantity.trim()
  if (cambios.whatToCopy !== undefined) cuerpo.whatToCopy = cambios.whatToCopy.trim()
  if (cambios.document !== undefined) cuerpo.document = cambios.document.trim()

  return pedir<DatoActividad>(`activity-data/${id}`, { metodo: 'PATCH', cuerpo })
}

/** Elimina físicamente el registro (el backend responde 409 si está referenciado). */
export async function eliminarDatoActividad(id: number): Promise<DatoActividad> {
  return pedir<DatoActividad>(`activity-data/${id}`, { metodo: 'DELETE' })
}
