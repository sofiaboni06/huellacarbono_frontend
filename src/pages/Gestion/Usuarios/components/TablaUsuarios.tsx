import { Pencil, Power, Trash2 } from 'lucide-react'
import type { Usuario } from '../../../../services/tipos'

interface TablaUsuariosProps {
  usuarios: Usuario[]
  onEditar: (usuario: Usuario) => void
  onAlternarEstado: (usuario: Usuario) => void
  onEliminar: (usuario: Usuario) => void
}

/** Iniciales del usuario para el avatar. */
function iniciales(usuario: Usuario): string {
  return `${usuario.nombres.trim().charAt(0)}${usuario.apellidos.trim().charAt(0)}`.toUpperCase()
}

/** Tono cromático estable por id, para que el avatar no cambie entre renders. */
function tono(id: string): string {
  const suma = id.split('').reduce((total, letra) => total + letra.charCodeAt(0), 0)
  const tonos = ['', 'gst-avatar--azul', 'gst-avatar--violeta', 'gst-avatar--ambar']
  return tonos[suma % tonos.length]
}

/**
 * Tabla de usuarios con acciones por fila.
 * Es una tabla semántica real: el contenedor con `overflow-x` lo pone la vista.
 */
export default function TablaUsuarios({
  usuarios,
  onEditar,
  onAlternarEstado,
  onEliminar,
}: TablaUsuariosProps) {
  return (
    <div className="gst-tabla-envoltura">
      <table className="gst-tabla">
        <caption className="gst-sr-only">Usuarios registrados en la plataforma</caption>
        <thead>
          <tr>
            <th scope="col">Usuario</th>
            <th scope="col">Correo</th>
            <th scope="col">Perfil</th>
            <th scope="col">Centro</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className={usuario.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}>
              <td>
                <div className="gst-usuario">
                  <span className={`gst-avatar ${tono(usuario.id)}`} aria-hidden="true">
                    {iniciales(usuario)}
                  </span>
                  <span className="gst-usuario-texto">
                    <b>{usuario.nombres} {usuario.apellidos}</b>
                    <small>
                      {usuario.tipoDocumento} {usuario.numeroDocumento}
                    </small>
                  </span>
                </div>
              </td>
              <td className="gst-correo">{usuario.correo}</td>
              <td>
                <span className="gst-etiqueta-perfil">{usuario.perfil}</span>
              </td>
              <td>
                <span className="gst-centro">
                  <b>{usuario.centro}</b>
                  <small>{usuario.regional}</small>
                </span>
              </td>
              <td>
                <span
                  className={`gst-estado gst-estado--${usuario.estado}`}
                  data-estado={usuario.estado}
                >
                  {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <span className="gst-acciones">
                  <button
                    type="button"
                    className="gst-accion"
                    title={`Editar ${usuario.nombres} ${usuario.apellidos}`}
                    aria-label={`Editar ${usuario.nombres} ${usuario.apellidos}`}
                    onClick={() => onEditar(usuario)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className={`gst-accion ${usuario.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                    title={usuario.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                    aria-label={
                      usuario.estado === 'activo'
                        ? `Desactivar ${usuario.nombres} ${usuario.apellidos}`
                        : `Activar ${usuario.nombres} ${usuario.apellidos}`
                    }
                    onClick={() => onAlternarEstado(usuario)}
                  >
                    <Power size={15} />
                  </button>
                  <button
                    type="button"
                    className="gst-accion gst-accion--peligro"
                    title="Eliminar usuario"
                    aria-label={`Eliminar ${usuario.nombres} ${usuario.apellidos}`}
                    onClick={() => onEliminar(usuario)}
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
