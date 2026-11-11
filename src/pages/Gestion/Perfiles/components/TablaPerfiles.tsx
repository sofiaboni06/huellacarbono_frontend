import { Pencil, Power, Trash2 } from 'lucide-react'
import type { Perfil } from '../../../../services/tipos'

interface TablaPerfilesProps {
  perfiles: Perfil[]
  onEditar: (perfil: Perfil) => void
  onAlternarEstado: (perfil: Perfil) => void
  onEliminar: (perfil: Perfil) => void
}

/**
 * Tabla de perfiles de acceso.
 * El contenedor con desplazamiento horizontal lo provee la vista.
 */
export default function TablaPerfiles({
  perfiles,
  onEditar,
  onAlternarEstado,
  onEliminar,
}: TablaPerfilesProps) {
  return (
    <div className="gst-tabla-envoltura">
      <table className="gst-tabla gst-tabla--perfiles">
        <caption className="gst-sr-only">Perfiles de acceso de la plataforma</caption>
        <thead>
          <tr>
            <th scope="col">Perfil</th>
            <th scope="col">Descripción</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {perfiles.map((perfil) => (
            <tr key={perfil.id} className={perfil.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}>
              <td>
                <span className="gst-modulo">
                  <span className="gst-modulo-icono" aria-hidden="true">
                    {perfil.nombre.trim().charAt(0).toUpperCase()}
                  </span>
                  {perfil.nombre}
                </span>
              </td>
              <td>{perfil.descripcion}</td>
              <td>
                <span
                  className={`gst-estado gst-estado--${perfil.estado}`}
                  data-estado={perfil.estado}
                >
                  {perfil.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <span className="gst-acciones">
                  <button
                    type="button"
                    className="gst-accion"
                    title={`Editar ${perfil.nombre}`}
                    aria-label={`Editar ${perfil.nombre}`}
                    onClick={() => onEditar(perfil)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className={`gst-accion ${perfil.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                    title={perfil.estado === 'activo' ? 'Desactivar perfil' : 'Activar perfil'}
                    aria-label={
                      perfil.estado === 'activo'
                        ? `Desactivar ${perfil.nombre}`
                        : `Activar ${perfil.nombre}`
                    }
                    onClick={() => onAlternarEstado(perfil)}
                  >
                    <Power size={15} />
                  </button>
                  <button
                    type="button"
                    className="gst-accion gst-accion--peligro"
                    title="Eliminar perfil"
                    aria-label={`Eliminar ${perfil.nombre}`}
                    onClick={() => onEliminar(perfil)}
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
