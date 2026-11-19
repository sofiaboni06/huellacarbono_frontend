/**
 * Errores por campo devueltos por el backend para el formulario de
 * unidades de medida.
 *
 * El backend responde 422 con `errors: [{ field, message, rule }]`;
 * `api.ts` lo normaliza en `ErrorApi.campos` y aquí se traduce al
 * vocabulario del formulario (`codigo`, `nombre`, `simbolo`, …).
 */
import type { UnidadMedidaFormulario } from '../../../services/tipos'

/** Mapa campo → mensaje mostrado bajo cada input. */
export type ErroresUnidad = Partial<Record<keyof UnidadMedidaFormulario, string>>

/** Traduce los errores de la API (`ErrorApi.campos`) al mapa del formulario. */
export function erroresDeApi(campos: Record<string, string>): ErroresUnidad {
  const mapa: ErroresUnidad = {}
  const equivalencias: Record<string, keyof UnidadMedidaFormulario> = {
    codigo: 'codigo',
    nombre: 'nombre',
    simbolo: 'simbolo',
    magnitud: 'magnitud',
    factorBase: 'factorBase',
  }
  for (const [campo, mensaje] of Object.entries(campos)) {
    const destino = equivalencias[campo]
    if (destino) mapa[destino] = mensaje
  }
  return mapa
}
