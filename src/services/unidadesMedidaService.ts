/**
 * Servicio de unidades de medida — integración real con el backend.
 *
 * Endpoints consumidos (AdonisJS, todos exigen Bearer token):
 *
 *   GET    /api/v1/measurement-units                  listado (solo activas por defecto)
 *   GET    /api/v1/measurement-units/:id              detalle
 *   POST   /api/v1/measurement-units                  alta
 *   PATCH  /api/v1/measurement-units/:id              edición y cambio de estado (`active`)
 *   DELETE /api/v1/measurement-units/:id              desactivación lógica (nunca borra la fila)
 *
 * `factorBase` viaja siempre como cadena para conservar la precisión de
 * DECIMAL(24, 12): el backend rechaza los números JSON con 422.
 */
import { pedir } from './apiCliente'
import type { UnidadMedida, UnidadMedidaFormulario } from './tipos'

/**
 * Devuelve todas las unidades, incluidas las inactivas, para que la vista
 * pueda mostrar el estado real y permitir reactivar registros.
 */
export async function listarUnidades(): Promise<UnidadMedida[]> {
  const datos = await pedir<UnidadMedida[]>('measurement-units', {
    query: { includeInactive: true },
  })
  return Array.isArray(datos) ? datos : []
}

/** Consulta puntual de una unidad por identificador. */
export async function obtenerUnidad(id: number): Promise<UnidadMedida> {
  return pedir<UnidadMedida>(`measurement-units/${id}`)
}

/** Crea una unidad. `factorBase` debe ser cadena. */
export async function crearUnidad(datos: UnidadMedidaFormulario): Promise<UnidadMedida> {
  return pedir<UnidadMedida>('measurement-units', {
    metodo: 'POST',
    cuerpo: {
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
      simbolo: datos.simbolo.trim(),
      magnitud: datos.magnitud.trim(),
      // Cadena, sin convertir a Number: el backend exige string.
      factorBase: datos.factorBase.trim(),
    },
  })
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

  return pedir<UnidadMedida>(`measurement-units/${id}`, { metodo: 'PATCH', cuerpo })
}

/**
 * Activa o desactiva una unidad mediante `PATCH { active }`, que es el
 * comportamiento que implementa el backend (no existe una ruta de estado
 * independiente).
 */
export async function cambiarEstadoUnidad(
  id: number,
  activo: boolean,
): Promise<UnidadMedida> {
  return pedir<UnidadMedida>(`measurement-units/${id}`, {
    metodo: 'PATCH',
    cuerpo: { active: activo },
  })
}
