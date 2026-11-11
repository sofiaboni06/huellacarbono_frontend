import { Outlet } from 'react-router-dom'
import PlantillaVista from '../../components/layout/PlantillaVista'
import SidebarPerfil from './components/SidebarPerfil'
import './Perfil.css'

/**
 * Contenedor de las secciones de perfil
 * (/perfil, /perfil/notificaciones, /perfil/seguridad, /perfil/preferencias).
 */
export default function Perfil() {
  return (
    <PlantillaVista titulo="HuellaVerde — Mi Perfil" className="prf">
      <div className="prf-plantilla">
        <SidebarPerfil />
        <div className="prf-panel">
          <Outlet />
        </div>
      </div>
    </PlantillaVista>
  )
}
