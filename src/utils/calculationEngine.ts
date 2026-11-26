/**
 * CAPA DE CÁLCULO DE DEMOSTRACIÓN (SOLO HUELLA HÍDRICA)
 * -----------------------------------------------------
 * Este módulo separa la lógica de cálculo de la interfaz del asistente hídrico.
 * Los valores que devuelve son de DEMOSTRACIÓN y NO corresponden
 * a fórmulas ambientales oficiales.
 *
 * La huella de carbono NO se calcula aquí: se calcula únicamente en el
 * backend (`POST /calculos-carbono`, ver `services/calculosService.ts`).
 * Este módulo rechaza cualquier petición de carbono para que nunca pueda
 * mostrarse un resultado ficticio que se confunda con uno real.
 */

/** Único tipo de huella que admite el cálculo de demostración. */
export type TipoHuellaDemostracion = 'hidrica'

export interface DatosCalculo {
  tipo: TipoHuellaDemostracion
  organizacion: string
  periodo: string
  sede: string
  /** Datos de consumo capturados en el paso 2. */
  consumo: Record<string, number>
}

export interface ResultadoCalculo {
  tipo: TipoHuellaDemostracion
  titulo: string
  valorPrincipal: string
  desglose: { etiqueta: string; valor: string }[]
  nota: string
}

export const MENSAJE_CARBONO_NO_DEMOSTRACION =
  'La huella de carbono no admite cálculos de demostración: se calcula únicamente con el backend.'

/**
 * Placeholder del cálculo hídrico real.
 * Sustituir por la fórmula oficial cuando esté definida.
 */
export function calcularHuella(datos: DatosCalculo): ResultadoCalculo {
  // Protección en tiempo de ejecución: aunque el tipado solo admite 'hidrica',
  // un valor llegado desde la URL o desde código sin tipar no debe producir
  // jamás una cifra de carbono inventada.
  if ((datos.tipo as string) !== 'hidrica') {
    throw new Error(MENSAJE_CARBONO_NO_DEMOSTRACION)
  }

  const total = Object.values(datos.consumo).reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0)
  const m3 = total > 0 ? Math.round(total * 1.18) : 1245
  return {
    tipo: 'hidrica',
    titulo: 'Huella Hídrica Total',
    valorPrincipal: `${m3.toLocaleString('es-CO')} m³`,
    desglose: [
      { etiqueta: 'Periodo', valor: datos.periodo },
      { etiqueta: 'Sede', valor: datos.sede },
      { etiqueta: 'Promedio mensual', valor: `${Math.round(m3 / 12).toLocaleString('es-CO')} m³` },
    ],
    nota: 'Cálculo de demostración: las fórmulas oficiales del proyecto se conectarán en este módulo.',
  }
}
