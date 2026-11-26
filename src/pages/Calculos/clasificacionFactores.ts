/**
 * Clasificación de los factores de una fuente para el formulario de datos de
 * actividad. Replica la regla temporal del backend
 * (app/services/emissions/anio_factores_periodo.ts → factorCubreReferencia):
 *
 * - Fin efectivo = fecha final; si falta, el 31-12 del año de aplicación.
 * - Sin fecha final ni año de aplicación, la vigencia solo es abierta si se
 *   aprobó expresamente como ABIERTA_HASTA_REEMPLAZO; si no, no cubre nada.
 * - Con fecha del dato se evalúa esa fecha; sin ella, el periodo completo.
 *
 * Es solo orientación: guardar el dato NO depende de esta clasificación; quien
 * decide si se calcula es el motor del backend con el mismo criterio.
 */

export interface FactorClasificable {
  estadoAprobacion: string
  fechaInicioVigencia: string
  fechaFinVigencia: string | null
  anioAplicacion: number | null
  tipoVigencia: string | null
}

export type CasoFactores =
  | 'VIGENTE'
  | 'APROBADO_FUERA_DE_VIGENCIA'
  | 'PENDIENTE'
  | 'RECHAZADO'
  | 'SIN_FACTOR_PARA_OPCION'
  | 'SIN_FACTOR'

export interface ClasificacionFactores<T extends FactorClasificable> {
  caso: CasoFactores
  /** Aprobados cuya vigencia cubre la fecha del dato o el periodo completo. */
  aprobadosVigentes: T[]
  /** Aprobados cuya vigencia NO cubre la referencia (vencidos, futuros o abiertos sin regla). */
  aprobadosFueraDeVigencia: T[]
  /** PENDIENTE o BORRADOR: nunca se usan en el cálculo. */
  pendientes: T[]
  rechazados: T[]
  /** Factores de la fuente antes de filtrar por la opción declarada. */
  totalFuente: number
}

export function vigenciaAbiertaSinRegla(factor: FactorClasificable) {
  return (
    !factor.fechaFinVigencia &&
    !factor.anioAplicacion &&
    factor.tipoVigencia !== 'ABIERTA_HASTA_REEMPLAZO'
  )
}

/** Fin efectivo de la vigencia (null = abierta), igual que finEfectivoFactor del backend. */
export function finEfectivoVigencia(factor: FactorClasificable) {
  return factor.fechaFinVigencia ?? (factor.anioAplicacion ? `${factor.anioAplicacion}-12-31` : null)
}

/** ¿El factor cubre todo el intervalo [desde, hasta]? (desde = hasta = fecha del dato si la hay). */
export function factorCubreFechas(factor: FactorClasificable, desde: string, hasta: string) {
  if (vigenciaAbiertaSinRegla(factor)) return false
  const fin = finEfectivoVigencia(factor)
  return factor.fechaInicioVigencia <= desde && (!fin || fin >= hasta)
}

export function clasificarFactores<T extends FactorClasificable>(
  factores: T[],
  referencia: { desde: string; hasta: string },
  admiteOpcion: (factor: T) => boolean = () => true,
): ClasificacionFactores<T> {
  const deLaOpcion = factores.filter(admiteOpcion)
  const aprobados = deLaOpcion.filter((factor) => factor.estadoAprobacion === 'APROBADO')
  const aprobadosVigentes = aprobados.filter((factor) =>
    factorCubreFechas(factor, referencia.desde, referencia.hasta),
  )
  const aprobadosFueraDeVigencia = aprobados.filter(
    (factor) => !factorCubreFechas(factor, referencia.desde, referencia.hasta),
  )
  const pendientes = deLaOpcion.filter((factor) =>
    ['PENDIENTE', 'BORRADOR'].includes(factor.estadoAprobacion),
  )
  const rechazados = deLaOpcion.filter((factor) => factor.estadoAprobacion === 'RECHAZADO')
  const caso: CasoFactores = aprobadosVigentes.length
    ? 'VIGENTE'
    : aprobadosFueraDeVigencia.length
      ? 'APROBADO_FUERA_DE_VIGENCIA'
      : pendientes.length
        ? 'PENDIENTE'
        : rechazados.length
          ? 'RECHAZADO'
          : factores.length
            ? 'SIN_FACTOR_PARA_OPCION'
            : 'SIN_FACTOR'
  return {
    caso,
    aprobadosVigentes,
    aprobadosFueraDeVigencia,
    pendientes,
    rechazados,
    totalFuente: factores.length,
  }
}

function vigenciaTexto(factor: FactorClasificable) {
  if (vigenciaAbiertaSinRegla(factor)) {
    return `${factor.fechaInicioVigencia}–sin fecha final ni regla de vigencia abierta`
  }
  return `${factor.fechaInicioVigencia}–${finEfectivoVigencia(factor) ?? 'abierta hasta reemplazo'}`
}

/**
 * Mensaje del formulario para cada caso. Nunca dice «ninguno está aprobado»
 * si hay factores aprobados que solo están fuera de vigencia.
 */
export function mensajeFactores<T extends FactorClasificable>(
  c: ClasificacionFactores<T>,
  contexto: { versionNombre: string; referencia: string },
): string {
  const guardar =
    'El dato se puede guardar; quedará fuera del cálculo hasta que exista un factor aprobado y vigente para esas fechas.'
  const pendientesNota = c.pendientes.length
    ? ` Además hay ${c.pendientes.length} factor(es) pendiente(s) de aprobación, que no se usan hasta aprobarse.`
    : ''
  switch (c.caso) {
    case 'VIGENTE':
      return `${c.aprobadosVigentes.length} factor(es) aprobado(s) y vigente(s) en ${contexto.versionNombre} para ${contexto.referencia}.`
    case 'APROBADO_FUERA_DE_VIGENCIA':
      return `Hay ${c.aprobadosFueraDeVigencia.length} factor(es) aprobado(s) en ${contexto.versionNombre}, pero ninguno vigente para ${contexto.referencia} (vigencias: ${[
        ...new Set(c.aprobadosFueraDeVigencia.map(vigenciaTexto)),
      ].join(', ')}). No se usa un factor de otro año.${pendientesNota} ${guardar}`
    case 'PENDIENTE':
      return `Hay ${c.pendientes.length} factor(es) en ${contexto.versionNombre} pendiente(s) de aprobación y ninguno aprobado. ${guardar}`
    case 'RECHAZADO':
      return `Los ${c.rechazados.length} factor(es) de esta fuente en ${contexto.versionNombre} fueron rechazados; hace falta registrar y aprobar uno nuevo. ${guardar}`
    case 'SIN_FACTOR_PARA_OPCION':
      return `No hay factores en ${contexto.versionNombre} para la opción elegida (combustible, proceso u opción de factor); la fuente sí tiene factores para otras opciones. ${guardar}`
    default:
      return `No hay factores registrados para esta fuente en ${contexto.versionNombre}. ${guardar}`
  }
}
