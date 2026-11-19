/**
 * Servicio de unidades de medida — integración real con el backend.
 *
 * Endpoints consumidos (AdonisJS, todos exigen Bearer token):
 *
 *   GET    /api/v1/measurement-units                  listado (solo activas por defecto)
 *   GET    /api/v1/measurement-units/:id              detalle
 *   POST   /api/v1/measurement-units                  alta
 *   PATCH  /api/v1/measurement-units/:id              edición y cambio de estado (`active`)
 *
 * `factorBase` viaja siempre como cadena para conservar la precisión de
 * DECIMAL(24, 12): el backend rechaza los números JSON con 422.
 */
import { api } from './api'
import type { UnidadMedida, UnidadMedidaFormulario } from './tipos'

interface Envoltura<T> {
  data: T
}

/**
 * Devuelve todas las unidades, incluidas las inactivas, para que la vista
 * pueda mostrar el estado real y permitir reactivar registros.
 */
export async function listarUnidades(): Promise<UnidadMedida[]> {
  const respuesta = await api<Envoltura<UnidadMedida[]>>(
    '/measurement-units?includeInactive=true',
  )
  return Array.isArray(respuesta.data) ? respuesta.data : []
}

/** Consulta puntual de una unidad por identificador. */
export async function obtenerUnidad(id: number): Promise<UnidadMedida> {
  const respuesta = await api<Envoltura<UnidadMedida>>(`/measurement-units/${id}`)
  return respuesta.data
}

/** Crea una unidad. `factorBase` debe ser cadena. */
export async function crearUnidad(datos: UnidadMedidaFormulario): Promise<UnidadMedida> {
  const respuesta = await api<Envoltura<UnidadMedida>>('/measurement-units', {
    method: 'POST',
    body: JSON.stringify({
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
      simbolo: datos.simbolo.trim(),
      magnitud: datos.magnitud.trim(),
      factorBase: datos.factorBase.trim(),
    }),
  })
  return respuesta.data
}

/**
 * Actualiza una unidad con `PATCH`. Solo envía los campos enviados en
 * `cambios`, de modo que nunca se pisan valores existentes con vacíos.
 */
export async function actualizarUnidad(
  id: number,
  cambios: Partial<UnidadMedidaFormulario>,
): Promise<UnidadMedida> {
  const cuerpo: Record<string, string> = {}
  if (cambios.codigo !== undefined) cuerpo.codigo = cambios.codigo.trim()
  if (cambios.nombre !== undefined) cuerpo.nombre = cambios.nombre.trim()
  if (cambios.simbolo !== undefined) cuerpo.simbolo = cambios.simbolo.trim()
  if (cambios.magnitud !== undefined) cuerpo.magnitud = cambios.magnitud.trim()
  if (cambios.factorBase !== undefined) cuerpo.factorBase = cambios.factorBase.trim()

  const respuesta = await api<Envoltura<UnidadMedida>>(`/measurement-units/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpo),
  })
  return respuesta.data
}

/**
 * Activa o desactiva una unidad mediante `PATCH { active }`, que es el
 * comportamiento que implementa el backend.
 */
export async function cambiarEstadoUnidad(id: number, activo: boolean): Promise<UnidadMedida> {
  const respuesta = await api<Envoltura<UnidadMedida>>(`/measurement-units/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: activo }),
  })
  return respuesta.data
}
