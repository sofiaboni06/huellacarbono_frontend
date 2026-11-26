export type VistaCalculos = 'carbono' | 'hidrica' | 'historial'

/**
 * Traduce el parámetro `?tipo=` de `/calculos` a la vista que se pinta.
 *
 * - `carbono` (y cualquier valor desconocido o ausente) → flujo real de carbono
 *   con el backend (`CalculoCarbono`). Nunca el asistente de demostración.
 * - `hidrica` → asistente hídrico de demostración.
 * - `historial` → historial de cálculos guardados.
 */
export function resolverVistaCalculos(tipo: string | null): VistaCalculos {
  return tipo === 'hidrica' || tipo === 'carbono' || tipo === 'historial' ? tipo : 'carbono'
}
