import { useCallback, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Calculator,
  ChevronDown,
  Contact,
  FileText,
  HelpCircle,
  Home,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePerfil } from '../../../context/PerfilContext'
import { useClickOutside } from '../../../hooks/useClickOutside'
import MenuPerfil from './MenuPerfil'
import hvLeaf from '../../../assets/images/hv-leaf.png'
import fotoPerfil from '../../../assets/images/profile.png'
import './SidebarInicio.css'

interface EnlaceLateral {
  to: string
  etiqueta: string
  Icono: LucideIcon
}

/** Secciones con ruta propia en la aplicación. */
const ENLACES: EnlaceLateral[] = [
  { to: '/inicio', etiqueta: 'Inicio', Icono: Home },
  { to: '/calculos', etiqueta: 'Cálculos', Icono: Calculator },
  { to: '/reportes', etiqueta: 'Reportes', Icono: FileText },
  { to: '/configuracion', etiqueta: 'Configuración', Icono: Settings },
  { to: '/ayuda', etiqueta: 'Ayuda', Icono: HelpCircle },
]

/** Secciones del desplegable «Gestión» (rutas existentes). */
const GESTION: EnlaceLateral[] = [
  { to: '/gestion/usuarios', etiqueta: 'Usuarios', Icono: UserRound },
  { to: '/gestion/perfiles', etiqueta: 'Perfiles', Icono: Contact },
  { to: '/gestion/roles-permisos', etiqueta: 'Roles y permisos', Icono: ShieldCheck },
]

interface SidebarInicioProps {
  /** Estado del cajón en pantallas pequeñas. */
  abierto: boolean
  /** Cierra el cajón móvil (al navegar o tocar el fondo). */
  onCerrar: () => void
}

/**
 * Barra lateral fija del Dashboard: marca, módulos, desplegable de Gestión
 * y bloque de usuario con el menú de perfil. En móvil se convierte en cajón.
 */
export default function SidebarInicio({ abierto, onCerrar }: SidebarInicioProps) {
  const { perfil, rol } = usePerfil()
  const { pathname } = useLocation()

  const [gestionAbierta, setGestionAbierta] = useState(() => pathname.startsWith('/gestion'))
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  const cerrarGestion = useCallback(() => setGestionAbierta(false), [])
  const cerrarPerfil = useCallback(() => setPerfilAbierto(false), [])
  const refGestion = useClickOutside<HTMLLIElement>(cerrarGestion, gestionAbierta)
  const refPerfil = useClickOutside<HTMLDivElement>(cerrarPerfil, perfilAbierto)

  // Al cambiar de ruta se cierran los desplegables del lateral; el grupo
  // «Gestión» queda abierto cuando la ruta corresponde a ese módulo, para que
  // el elemento activo sea visible según la sección actual.
  const [rutaPrevia, setRutaPrevia] = useState(pathname)
  if (rutaPrevia !== pathname) {
    setRutaPrevia(pathname)
    setGestionAbierta(pathname.startsWith('/gestion'))
    setPerfilAbierto(false)
  }

  const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`.trim()
  const enGestion = pathname.startsWith('/gestion')

  return (
    <aside className={`ini-lateral ${abierto ? 'abierto' : ''}`} aria-label="Menú lateral">
      <div className="ini-lateral-top">
        <NavLink to="/inicio" className="ini-lateral-marca" onClick={onCerrar}>
          <img className="ini-lateral-marca-icono" src={hvLeaf} alt="" aria-hidden="true" />
          <span className="ini-lateral-marca-texto">
            <b>Huella</b>
            <i>Verde</i>
          </span>
        </NavLink>

        <button
          type="button"
          className="ini-lateral-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar menú lateral"
        >
          <X size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <nav className="ini-lateral-nav" aria-label="Módulos">
        <ul className="ini-lateral-lista">
          {ENLACES.map(({ to, etiqueta, Icono }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/inicio'}
                className={({ isActive }) => `ini-lateral-enlace ${isActive ? 'activo' : ''}`}
                onClick={onCerrar}
              >
                <Icono size={17} strokeWidth={2.1} aria-hidden="true" />
                <span>{etiqueta}</span>
              </NavLink>
            </li>
          ))}

          <li className="ini-lateral-grupo" ref={refGestion}>
            <button
              type="button"
              className={`ini-lateral-enlace ini-lateral-gestion ${enGestion ? 'activo' : ''}`}
              onClick={() => setGestionAbierta((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={gestionAbierta}
            >
              <Users size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>Gestión</span>
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                aria-hidden="true"
                className={`ini-lateral-flecha ${gestionAbierta ? 'girada' : ''}`}
              />
            </button>

            {gestionAbierta ? (
              <div className="ini-lateral-submenu" role="menu" aria-label="Gestión">
                {GESTION.map(({ to, etiqueta, Icono }) => (
                  <NavLink
                    key={to}
                    to={to}
                    role="menuitem"
                    className={({ isActive }) => `ini-lateral-subenlace ${isActive ? 'activo' : ''}`}
                    onClick={onCerrar}
                  >
                    <Icono size={15} strokeWidth={2.1} aria-hidden="true" />
                    <span>{etiqueta}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </li>
        </ul>
      </nav>

      <div className="ini-lateral-usuario" ref={refPerfil}>
        <button
          type="button"
          className="ini-lateral-usuario-boton"
          onClick={() => setPerfilAbierto((v) => !v)}
          aria-label={`Menú de perfil de ${nombreCompleto}`}
          aria-haspopup="menu"
          aria-expanded={perfilAbierto}
        >
          <img className="ini-lateral-usuario-foto" src={fotoPerfil} alt="" aria-hidden="true" />
          <span className="ini-lateral-usuario-texto">
            <b>{nombreCompleto}</b>
            <i>{rol}</i>
          </span>
          <ChevronDown
            size={14}
            strokeWidth={2.4}
            aria-hidden="true"
            className={`ini-lateral-flecha ${perfilAbierto ? 'girada' : ''}`}
          />
        </button>
        {perfilAbierto ? <MenuPerfil onCerrar={cerrarPerfil} /> : null}
      </div>
    </aside>
  )
}
