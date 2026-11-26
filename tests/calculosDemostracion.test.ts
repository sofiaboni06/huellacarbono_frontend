import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { calcularHuella, MENSAJE_CARBONO_NO_DEMOSTRACION } from '../src/utils/calculationEngine.ts'
import type { DatosCalculo } from '../src/utils/calculationEngine.ts'
import { resolverVistaCalculos } from '../src/pages/Calculos/vistaCalculos.ts'

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), 'utf8')

const BASE = { organizacion: 'Org', periodo: '2026', sede: 'Sede 1' }

// ---------------------------------------------------------------------------
// Navegación principal de carbono
// ---------------------------------------------------------------------------

test('?tipo=carbono abre el flujo real de carbono', () => {
  assert.equal(resolverVistaCalculos('carbono'), 'carbono')
})

test('sin tipo o con tipo desconocido se usa el flujo real de carbono, nunca el asistente', () => {
  for (const tipo of [null, '', 'CARBONO', 'demo', 'hidrica ', 'carbono&demo=1']) {
    assert.equal(resolverVistaCalculos(tipo), 'carbono', `tipo=${String(tipo)}`)
  }
})

test('?tipo=hidrica y ?tipo=historial conservan su vista', () => {
  assert.equal(resolverVistaCalculos('hidrica'), 'hidrica')
  assert.equal(resolverVistaCalculos('historial'), 'historial')
})

test('Calculos.tsx pinta CalculoCarbono para carbono y el asistente solo en la rama restante (hídrica)', () => {
  const fuente = leer('../src/pages/Calculos/Calculos.tsx')
  assert.match(fuente, /vista === 'carbono' \? \(\s*<CalculoCarbono \/>/)
  assert.match(fuente, /<AsistenteCalculo tipo=\{vista\} \/>/)
})

test('CalculoCarbono calcula a través del servicio del backend', () => {
  const vista = leer('../src/pages/Calculos/components/CalculoCarbono.tsx')
  assert.match(vista, /calcularCarbono/)
  assert.doesNotMatch(vista, /calculationEngine|calcularHuella/)
  const servicio = leer('../src/services/calculosService.ts')
  assert.match(servicio, /api<\{ data: CalculoApi \}>\('\/calculos-carbono', \{\s*method: 'POST'/)
})

// ---------------------------------------------------------------------------
// Ausencia de resultados ficticios de carbono
// ---------------------------------------------------------------------------

test('el motor de demostración rechaza carbono en tiempo de ejecución', () => {
  const datos = { ...BASE, tipo: 'carbono', consumo: { electricidad: 100 } } as unknown as DatosCalculo
  assert.throws(() => calcularHuella(datos), { message: MENSAJE_CARBONO_NO_DEMOSTRACION })
})

test('el motor de demostración rechaza carbono incluso sin consumo (antes devolvía 892 tCO₂e fijos)', () => {
  const datos = { ...BASE, tipo: 'carbono', consumo: {} } as unknown as DatosCalculo
  assert.throws(() => calcularHuella(datos))
})

test('el motor y el asistente no contienen unidades ni campos de carbono', () => {
  for (const ruta of ['../src/utils/calculationEngine.ts', '../src/pages/Calculos/components/AsistenteCalculo.tsx']) {
    const fuente = leer(ruta)
    assert.doesNotMatch(fuente, /tCO₂e|tCO2e|kWh|Huella de Carbono Total|Combustible diésel/, ruta)
  }
})

test('los datos de demostración ya no contienen resultados ni series de carbono', () => {
  const demo = leer('../src/data/demo.ts')
  // Ninguna cifra de carbono (p. ej. '892 tCO₂e'). La unidad sí puede aparecer en textos de ayuda.
  assert.doesNotMatch(demo, /\d[\d.,]*\s*tCO(₂|2)e/)
  assert.doesNotMatch(demo, /HISTORIAL_DEMO|EVOLUCION_12_MESES|DISTRIBUCION_FUENTES|carbono:\s*\d/)
  // Los datos con consumidores reales se conservan.
  for (const nombre of ['PERIODOS', 'SEDES', 'NOTIFICACIONES_INICIALES', 'ACTIVIDAD_RECIENTE', 'PREGUNTAS_FRECUENTES', 'GUIAS_USO']) {
    assert.match(demo, new RegExp(`export const ${nombre}\\b`), nombre)
  }
})

// ---------------------------------------------------------------------------
// Asistente hídrico (comportamiento preservado)
// ---------------------------------------------------------------------------

test('cálculo hídrico: mismo resultado que antes del cambio', () => {
  const resultado = calcularHuella({ ...BASE, tipo: 'hidrica', consumo: { potable: 100, riego: 50 } })
  assert.equal(resultado.tipo, 'hidrica')
  assert.equal(resultado.titulo, 'Huella Hídrica Total')
  assert.equal(resultado.valorPrincipal, `${(177).toLocaleString('es-CO')} m³`)
  assert.deepEqual(resultado.desglose, [
    { etiqueta: 'Periodo', valor: '2026' },
    { etiqueta: 'Sede', valor: 'Sede 1' },
    { etiqueta: 'Promedio mensual', valor: `${(15).toLocaleString('es-CO')} m³` },
  ])
  assert.match(resultado.nota, /demostración/)
})

test('cálculo hídrico ignora valores no finitos', () => {
  const resultado = calcularHuella({ ...BASE, tipo: 'hidrica', consumo: { potable: 10, riego: Number.NaN } })
  assert.equal(resultado.valorPrincipal, `${(12).toLocaleString('es-CO')} m³`)
})

test('el asistente conserva los seis campos hídricos', () => {
  const fuente = leer('../src/pages/Calculos/components/AsistenteCalculo.tsx')
  for (const id of ['potable', 'riego', 'industrial', 'refrigeracion', 'saneamiento', 'lavado']) {
    assert.match(fuente, new RegExp(`id: '${id}'`), id)
  }
})
