import type { RequisitoCalculoProducto } from '../../services/calculosService'

export function configuracionCamposProducto(requisito: RequisitoCalculoProducto) {
  return {
    visible: true,
    cantidadRequerida: false,
    unidadFuncionalRequerida: false,
    avisoPendiente: requisito === 'PENDIENTE_DEFINICION',
  }
}
