import { Eye, Pencil, Power } from 'lucide-react'
import type { UnidadMedida } from '../../../../services/tipos'

interface TablaUnidadesMedidaProps {
  unidades: UnidadMedida[]
  /** Sin permiso `unidad_medida.editar` se ocultan edición y estado. */
  puedeEditar: boolean
  onConsultar: (unidad: UnidadMedida) => void
  onEditar: (unidad: UnidadMedida) => void
  onAlternarEstado: (unidad: UnidadMedida) => void
}

/**
 * Tabla de unidades de medida.
 * El contenedor con desplazamiento horizontal lo provee la vista.
 */
export default function TablaUnidadesMedida({
  unidades,
  puedeEditar,
  onConsultar,
  onEditar,
  onAlternarEstado,
}: TablaUnidadesMedidaProps) {
  return (
    <div className="gst-tabla-envoltura">
      <table className="gst-tabla gst-tabla--unidades">
        <caption className="gst-sr-only">Unidades de medida de la plataforma</caption>
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Nombre</th>
            <th scope="col">Símbolo</th>
            <th scope="col">Magnitud</th>
            <th scope="col">Factor base</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {unidades.map((unidad) => (
            <tr key={unidad.id} className={unidad.active ? '' : 'gst-fila--inactiva'}>
              <td>
                <span className="umd-codigo">{unidad.code}</span>
              </td>
              <td>
                <span className="umd-nombre">{unidad.name}</span>
              </td>
              <td>
                <span className="umd-simbolo">{unidad.symbol}</span>
              </td>
              <td>
                <span className="umd-magnitud">{unidad.magnitude}</span>
              </td>
              <td>
                {/* Cadena decimal: se muestra tal cual, sin pasar por Number. */}
                <span className="umd-factor" title={unidad.baseFactor}>
                  {unidad.baseFactor}
                </span>
              </td>
              <td>
                <span
                  className={`gst-estado gst-estado--${unidad.active ? 'activo' : 'inactivo'}`}
                  data-estado={unidad.active ? 'activo' : 'inactivo'}
                >
                  {unidad.active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <span className="gst-acciones">
                  <button
                    type="button"
                    className="gst-accion"
                    title={`Consultar ${unidad.name}`}
                    aria-label={`Consultar ${unidad.name}`}
                    onClick={() => onConsultar(unidad)}
                  >
                    <Eye size={15} />
                  </button>
                  {puedeEditar && (
                    <>
                      <button
                        type="button"
                        className="gst-accion"
                        title={`Editar ${unidad.name}`}
                        aria-label={`Editar ${unidad.name}`}
                        onClick={() => onEditar(unidad)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className={`gst-accion ${unidad.active ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                        title={unidad.active ? 'Desactivar unidad' : 'Activar unidad'}
                        aria-label={
                          unidad.active
                            ? `Desactivar ${unidad.name}`
                            : `Activar ${unidad.name}`
                        }
                        onClick={() => onAlternarEstado(unidad)}
                      >
                        <Power size={15} />
                      </button>
                    </>
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
