/**
 * CAPA DE CÁLCULO DESACOPADA
 * ---------------------------
 * Este módulo separa la lógica de cálculo de la interfaz.
 * Los valores que devuelve son de DEMOSTRACIÓN y NO corresponden
 * a fórmulas ambientales oficiales.
 *
 * Cuando el proyecto defina sus fórmulas reales de huella hídrica
 * y huella de carbono, deberán implementarse aquí, manteniendo la
 * misma firma de funciones para que la interfaz no cambie.
 */

export type TipoHuella = 'hidrica' | 'carbono'

export interface DatosCalculo {
  tipo: TipoHuella
  organizacion: string
  periodo: string
  sede: string
  /** Datos de consumo capturados en el paso 2. */
  consumo: Record<string, number>
}

export interface ResultadoCalculo {
  tipo: TipoHuella
  titulo: string
  valorPrincipal: string
  desglose: { etiqueta: string; valor: string }[]
  nota: string
}

/**
 * Placeholder del cálculo real.
 * Sustituir por la fórmula oficial cuando esté definida.
 */
export function calcularHuella(datos: DatosCalculo): ResultadoCalculo {
  const total = Object.values(datos.consumo).reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0)

  if (datos.tipo === 'hidrica') {
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

  const tco2e = total > 0 ? Math.round(total * 0.42) : 892
  return {
    tipo: 'carbono',
    titulo: 'Huella de Carbono Total',
    valorPrincipal: `${tco2e.toLocaleString('es-CO')} tCO₂e`,
    desglose: [
      { etiqueta: 'Periodo', valor: datos.periodo },
      { etiqueta: 'Sede', valor: datos.sede },
      { etiqueta: 'Promedio mensual', valor: `${Math.round(tco2e / 12).toLocaleString('es-CO')} tCO₂e` },
    ],
    nota: 'Cálculo de demostración: las fórmulas oficiales del proyecto se conectarán en este módulo.',
  }
}
