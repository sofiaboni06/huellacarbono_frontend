import { useCallback, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Bell,
  Calculator,
  ChevronDown,
  Contact,
  FileText,
  Home,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useNotificaciones } from '../../../context/NotificacionesContext'
import { usePerfil } from '../../../context/PerfilContext'
import { useClickOutside } from '../../../hooks/useClickOutside'
import MenuPerfil from './MenuPerfil'
import MenuNotificaciones from './MenuNotificaciones'
import hvLeaf from '../../../assets/images/hv-leaf.png'
import fotoPerfil from '../../../assets/images/profile.png'
import './NavbarInicio.css'

interface EnlaceNav {
  to: string
  etiqueta: string
  Icono: typeof Home
}

/** Enlaces independientes de la navegación principal. */
const ENLACES: EnlaceNav[] = [
  { to: '/inicio', etiqueta: 'Inicio', Icono: Home },
  { to: '/calculos', etiqueta: 'Cálculo', Icono: Calculator },
  { to: '/reportes', etiqueta: 'Informe', Icono: FileText },
]

/** Secciones del desplegable «Gestión». */
const GESTION: EnlaceNav[] = [
  { to: '/gestion/usuarios', etiqueta: 'Usuarios', Icono: UserRound },
  { to: '/gestion/perfiles', etiqueta: 'Perfiles', Icono: Contact },
  { to: '/gestion/roles-permisos', etiqueta: 'Roles y permisos', Icono: ShieldCheck },
]

/** Barra de navegación global: marca, enlaces, desplegable, campana y perfil. */
export default function NavbarInicio() {
  const { noLeidas } = useNotificaciones()
  const { perfil } = usePerfil()
  const { pathname } = useLocation()

  const [menuMovil, setMenuMovil] = useState(false)
  const [perfilAbierto, setPerfilAbierto] = useState(false)
  const [notifAbierta, setNotifAbierta] = useState(false)
  const [gestionAbierta, setGestionAbierta] = useState(false)

  /** La opción «Gestión» queda resaltada en cualquier ruta /gestion/… */
  const enGestion = pathname.startsWith('/gestion')

  const cerrarPerfil = useCallback(() => setPerfilAbierto(false), [])
  const cerrarNotif = useCallback(() => setNotifAbierta(false), [])
  const cerrarGestion = useCallback(() => setGestionAbierta(false), [])
  const refPerfil = useClickOutside<HTMLDivElement>(cerrarPerfil, perfilAbierto)
  const refNotif = useClickOutside<HTMLDivElement>(cerrarNotif, notifAbierta)
  const refGestion = useClickOutside<HTMLDivElement>(cerrarGestion, gestionAbierta)

  const cerrarTodo = useCallback(() => {
    setMenuMovil(false)
    setPerfilAbierto(false)
    setNotifAbierta(false)
    setGestionAbierta(false)
  }, [])

  const alternarPerfil = () => {
    setNotifAbierta(false)
    setGestionAbierta(false)
    setPerfilAbierto((v) => !v)
  }

  const alternarNotif = () => {
    setPerfilAbierto(false)
    setGestionAbierta(false)
    setNotifAbierta((v) => !v)
  }

  const alternarGestion = () => {
    setPerfilAbierto(false)
    setNotifAbierta(false)
    setGestionAbierta((v) => !v)
  }

  const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`.trim()

  return (
    <header className="ini-nav">
      <div className="ini-nav-interno">
        <NavLink to="/inicio" className="ini-marca" onClick={cerrarTodo}>
          <img className="ini-marca-icono" src={hvLeaf} alt="" aria-hidden="true" />
          <span className="ini-marca-texto">
            <b>Huella</b>
            <i>Verde</i>
          </span>
        </NavLink>

        <button
          type="button"
          className="ini-nav-burger"
          onClick={() => setMenuMovil((v) => !v)}
          aria-label={menuMovil ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={menuMovil}
        >
          {menuMovil ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>

        <nav
          className={`ini-nav-links ${menuMovil ? 'abierto' : ''}`}
          aria-label="Navegación principal"
        >
          {ENLACES.map(({ to, etiqueta, Icono }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/inicio'}
              className={({ isActive }) => `ini-nav-enlace ${isActive ? 'activo' : ''}`}
              onClick={cerrarTodo}
            >
              <Icono size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>{etiqueta}</span>
            </NavLink>
          ))}

          <div className="ini-desplegable ini-gestion" ref={refGestion}>
            <button
              type="button"
              className={`ini-nav-enlace ini-nav-gestion ${enGestion ? 'activo' : ''}`}
              onClick={alternarGestion}
              aria-haspopup="menu"
              aria-expanded={gestionAbierta}
            >
              <Users size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>Gestión</span>
              <ChevronDown
                size={14}
                strokeWidth={2.6}
                aria-hidden="true"
                className={`ini-gestion-flecha ${gestionAbierta ? 'girada' : ''}`}
              />
            </button>

            {gestionAbierta ? (
              <div className="ini-menu ini-menu--gestion" role="menu" aria-label="Gestión">
                {GESTION.map(({ to, etiqueta, Icono }) => (
                  <NavLink
                    key={to}
                    to={to}
                    role="menuitem"
                    className={({ isActive }) => `ini-menu-item ${isActive ? 'activo' : ''}`}
                    onClick={cerrarTodo}
                  >
                    <Icono size={16} strokeWidth={2.2} aria-hidden="true" />
                    <span>{etiqueta}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="ini-nav-acciones">
          <div className="ini-desplegable" ref={refNotif}>
            <button
              type="button"
              className="ini-nav-campana"
              onClick={alternarNotif}
              aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ''}`}
              aria-haspopup="menu"
              aria-expanded={notifAbierta}
            >
              <Bell size={19} strokeWidth={2.1} aria-hidden="true" />
              {noLeidas > 0 ? <span className="ini-nav-punto" aria-hidden="true" /> : null}
            </button>
            {notifAbierta ? <MenuNotificaciones onCerrar={cerrarNotif} /> : null}
          </div>

          <div className="ini-desplegable" ref={refPerfil}>
            <button
              type="button"
              className="ini-nav-perfil"
              onClick={alternarPerfil}
              aria-label={`Menú de perfil de ${nombreCompleto}`}
              aria-haspopup="menu"
              aria-expanded={perfilAbierto}
            >
              <img className="ini-nav-foto" src={fotoPerfil} alt={nombreCompleto} />
              <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
            {perfilAbierto ? <MenuPerfil onCerrar={cerrarPerfil} /> : null}
          </div>
        </div>
      </div>
    </header>
  )
}
