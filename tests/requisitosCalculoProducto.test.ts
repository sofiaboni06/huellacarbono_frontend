import test from 'node:test'
import assert from 'node:assert/strict'
import { configuracionCamposProducto } from '../src/pages/Calculos/requisitosCalculoProducto.ts'

test('requisitos no definidos muestran campos opcionales y permiten el total', () => {
  assert.deepEqual(configuracionCamposProducto('PENDIENTE_DEFINICION'), { visible: true, cantidadRequerida: false, unidadFuncionalRequerida: false, avisoPendiente: true })
})

test('intensidad opcional muestra ambos campos sin marcarlos obligatorios', () => {
  assert.deepEqual(configuracionCamposProducto('INTENSIDAD_OPCIONAL'), { visible: true, cantidadRequerida: false, unidadFuncionalRequerida: false, avisoPendiente: false })
})

test('cantidad y unidad funcional son siempre opcionales', () => {
  for (const requisito of ['UNIDAD_FUNCIONAL_REQUERIDA', 'UNIDADES_PRODUCIDAS_REQUERIDAS', 'AMBOS_REQUERIDOS', 'SIN_INTENSIDAD'] as const) {
    const campos = configuracionCamposProducto(requisito)
    assert.equal(campos.visible, true)
    assert.equal(campos.cantidadRequerida, false)
    assert.equal(campos.unidadFuncionalRequerida, false)
  }
})
