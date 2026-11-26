import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clasificarFactores,
  factorCubreFechas,
  mensajeFactores,
  type FactorClasificable,
} from '../src/pages/Calculos/clasificacionFactores.ts'

/** Factor real de B1-01 en la base: UPME Res. 000085/2026, aplica a 2024. */
const UPME_2024: FactorClasificable & { variante: string } = {
  estadoAprobacion: 'APROBADO',
  fechaInicioVigencia: '2024-01-01',
  fechaFinVigencia: '2024-12-31',
  anioAplicacion: 2024,
  tipoVigencia: null,
  variante: 'ELECTRICIDAD_SIN',
}
const ref = (desde: string, hasta = desde) => ({ desde, hasta })
const contexto = { versionNombre: 'GHG Protocol Ed. revisada 2004', referencia: 'el periodo' }

test('2024: el factor UPME aprobado y vigente se reconoce', () => {
  const c = clasificarFactores([UPME_2024], ref('2024-01-01', '2024-12-31'))
  assert.equal(c.caso, 'VIGENTE')
  assert.equal(c.aprobadosVigentes.length, 1)
})

test('2025 y 2026: aprobado fuera de vigencia, nunca «ninguno está aprobado»', () => {
  for (const r of [ref('2025-01-01', '2025-12-31'), ref('2026-02-11', '2026-08-11'), ref('2026-04-15')]) {
    const c = clasificarFactores([UPME_2024], r)
    assert.equal(c.caso, 'APROBADO_FUERA_DE_VIGENCIA', JSON.stringify(r))
    assert.equal(c.aprobadosVigentes.length, 0)
    const texto = mensajeFactores(c, contexto)
    assert.doesNotMatch(texto, /ninguno está aprobado/)
    assert.match(texto, /1 factor\(es\) aprobado\(s\)/)
    assert.match(texto, /2024-01-01–2024-12-31/)
    assert.match(texto, /No se usa un factor de otro año/)
    assert.match(texto, /se puede guardar/)
  }
})

test('un periodo que cruza 2024-2025 sin fecha del dato no queda cubierto por el factor de 2024', () => {
  assert.equal(clasificarFactores([UPME_2024], ref('2024-07-01', '2025-06-30')).caso, 'APROBADO_FUERA_DE_VIGENCIA')
  assert.equal(clasificarFactores([UPME_2024], ref('2024-11-15')).caso, 'VIGENTE')
})

test('pendiente que cubriría 2026 no cuenta como vigente y se menciona', () => {
  const pendiente2026 = {
    ...UPME_2024,
    estadoAprobacion: 'PENDIENTE',
    fechaInicioVigencia: '2026-01-01',
    fechaFinVigencia: '2026-12-31',
    anioAplicacion: 2026,
  }
  const soloPendiente = clasificarFactores([pendiente2026], ref('2026-02-11', '2026-08-11'))
  assert.equal(soloPendiente.caso, 'PENDIENTE')
  assert.match(mensajeFactores(soloPendiente, contexto), /pendiente\(s\) de aprobación y ninguno aprobado/)
  const ambos = clasificarFactores([UPME_2024, pendiente2026], ref('2026-02-11', '2026-08-11'))
  assert.equal(ambos.caso, 'APROBADO_FUERA_DE_VIGENCIA')
  assert.match(mensajeFactores(ambos, contexto), /1 factor\(es\) pendiente\(s\) de aprobación/)
})

test('rechazados y ausencia total de factores se distinguen', () => {
  const rechazado = clasificarFactores([{ ...UPME_2024, estadoAprobacion: 'RECHAZADO' }], ref('2024-05-01'))
  assert.equal(rechazado.caso, 'RECHAZADO')
  assert.match(mensajeFactores(rechazado, contexto), /fueron rechazados/)
  const vacio = clasificarFactores([], ref('2026-05-01'))
  assert.equal(vacio.caso, 'SIN_FACTOR')
  assert.match(mensajeFactores(vacio, contexto), /No hay factores registrados/)
})

test('opción declarada sin factor: se informa aparte de la ausencia total', () => {
  const c = clasificarFactores([UPME_2024], ref('2024-05-01'), (f) => f.variante === 'GN_CUSIANA')
  assert.equal(c.caso, 'SIN_FACTOR_PARA_OPCION')
})

test('vigencia abierta solo con regla explícita aprobada', () => {
  const sinFin = { ...UPME_2024, fechaFinVigencia: null, anioAplicacion: null, fechaInicioVigencia: '2026-01-01' }
  assert.equal(factorCubreFechas({ ...sinFin, tipoVigencia: null }, '2026-03-01', '2026-03-01'), false)
  assert.equal(factorCubreFechas({ ...sinFin, tipoVigencia: 'ABIERTA_HASTA_REEMPLAZO' }, '2026-03-01', '2026-03-01'), true)
  assert.equal(factorCubreFechas({ ...sinFin, tipoVigencia: 'ABIERTA_HASTA_REEMPLAZO' }, '2025-12-31', '2025-12-31'), false)
  // Sin fecha final pero con año de aplicación: acotado al año, nunca perpetuo.
  assert.equal(factorCubreFechas({ ...UPME_2024, fechaFinVigencia: null }, '2025-01-01', '2025-01-01'), false)
})
