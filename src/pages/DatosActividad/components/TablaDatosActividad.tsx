import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { DatoActividad } from '../../../services/tipos'

interface TablaDatosActividadProps {
  datos: DatoActividad[]
  /** Sin permiso `dato_actividad.editar` se oculta la edición. */
  puedeEditar: boolean
  /** Sin permiso `dato_actividad.eliminar` se oculta la eliminación. */
  puedeEliminar: boolean
  onConsultar: (dato: DatoActividad) => void
  onEditar: (dato: DatoActividad) => void
  onEliminar: (dato: DatoActividad) => void
}

/**
 * Tabla de datos de actividad.
 * El contenedor con desplazamiento horizontal lo provee la vista.
 */
export default function TablaDatosActividad({
  datos,
  puedeEditar,
  puedeEliminar,
  onConsultar,
  onEditar,
  onEliminar,
}: TablaDatosActividadProps) {
  return (
    <div className="gst-tabla-envoltura">
      <table className="gst-tabla gst-tabla--datos">
        <caption className="gst-sr-only">Registros de datos de actividad</caption>
        <thead>
          <tr>
            <th scope="col">Actividad</th>
            <th scope="col">Qué se copia</th>
            <th scope="col">Cantidad</th>
            <th scope="col">Unidad</th>
            <th scope="col">Fuente de emisión</th>
            <th scope="col">Alcance</th>
            <th scope="col">Documento</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((dato) => (
            <tr key={dato.id}>
              <td>
                <span className="dad-actividad">{dato.activityName}</span>
                {dato.processName && <small className="dad-proceso">{dato.processName}</small>}
              </td>
              <td>
                <span className="dad-que-se-copia">{dato.whatToCopy}</span>
              </td>
              <td>
                <span className="dad-cantidad">{dato.quantity}</span>
              </td>
              <td>
                <span className="dad-unidad">{dato.unitSymbol}</span>
              </td>
              <td>{dato.emissionSourceName}</td>
              <td>
                <span className="dad-alcance" title={dato.scopeName}>
                  {dato.scopeCode}
                </span>
              </td>
              <td>
                <span className="dad-documento">{dato.document}</span>
              </td>
              <td>
                <span className="gst-estado gst-estado--activo">{dato.status}</span>
              </td>
              <td>
                <div className="gst-acciones">
                  <button
                    type="button"
                    className="gst-accion gst-accion--ver"
                    onClick={() => onConsultar(dato)}
                    title="Consultar"
                    aria-label={`Consultar el registro de ${dato.activityName}`}
                  >
                    <Eye size={16} aria-hidden="true" />
                  </button>
                  {puedeEditar && (
                    <button
                      type="button"
                      className="gst-accion gst-accion--editar"
                      onClick={() => onEditar(dato)}
                      title="Editar"
                      aria-label={`Editar el registro de ${dato.activityName}`}
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  )}
                  {puedeEliminar && (
                    <button
                      type="button"
                      className="gst-accion gst-accion--eliminar"
                      onClick={() => onEliminar(dato)}
                      title="Eliminar"
                      aria-label={`Eliminar el registro de ${dato.activityName}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
