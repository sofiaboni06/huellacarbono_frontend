import { NavLink } from 'react-router-dom'
import { Contact, ShieldCheck } from 'lucide-react'
import { usePerfil } from '../../../context/PerfilContext'

/**
 * Pestañas horizontales que comunican las dos vistas de configuración de
 * accesos: `Gestión de Perfiles` y `Roles y Permisos`.
 *
 * Se comparten entre ambas pantallas para que la navegación y el resaltado
 * sean idénticos en los dos puntos de entrada.
 */
export default function PestanasGestion() {
  const { puede, permisosListos } = usePerfil()
  if (!permisosListos || !puede('rol.ver')) return null

  return (
    <nav className="gst-tabs" aria-label="Secciones de gestión de accesos">
      <NavLink
        to="/gestion/perfiles"
        className={({ isActive }) => `gst-tab ${isActive ? 'activo' : ''}`}
      >
        <Contact size={15} aria-hidden="true" />
        Perfiles
      </NavLink>
      <NavLink
        to="/gestion/roles-permisos"
        className={({ isActive }) => `gst-tab ${isActive ? 'activo' : ''}`}
      >
        <ShieldCheck size={15} aria-hidden="true" />
        Roles y Permisos
      </NavLink>
    </nav>
  )
}
