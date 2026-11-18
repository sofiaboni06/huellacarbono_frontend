/**
 * Errores por campo devueltos por el backend para el formulario de datos
 * de actividad.
 *
 * El backend responde 422 con `errors: [{ field, message, rule }]`;
 * `apiCliente.ts` lo normaliza en `ErrorApi.campos` y aquí se traduce al
 * vocabulario del formulario (`activityId`, `quantity`, `document`, …).
 * Las validaciones de negocio (proyecto, periodo, catálogos inactivos)
 * llegan como mensaje único y se muestran como aviso.
 */
import type { DatoActividadFormulario } from '../../services/tipos'

/** Mapa campo → mensaje mostrado bajo cada input. */
export type ErroresDato = Partial<Record<keyof DatoActividadFormulario, string>>

/** Traduce los errores de la API (`ErrorApi.campos`) al mapa del formulario. */
export function erroresDeApi(campos: Record<string, string>): ErroresDato {
  const mapa: ErroresDato = {}
  const equivalencias: Record<string, keyof DatoActividadFormulario> = {
    activityId: 'activityId',
    periodId: 'periodId',
    emissionSourceId: 'emissionSourceId',
    scopeId: 'scopeId',
    unitId: 'unitId',
    quantity: 'quantity',
    whatToCopy: 'whatToCopy',
    document: 'document',
  }
  for (const [campo, mensaje] of Object.entries(campos)) {
    const destino = equivalencias[campo]
    if (destino) mapa[destino] = mensaje
  }
  return mapa
}
