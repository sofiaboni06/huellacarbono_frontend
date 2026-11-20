import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Building2,
  Calculator,
  ChevronDown,
  Cloud,
  Contact,
  Droplets,
  HelpCircle,
  History,
  Home,
  Landmark,
  Leaf,
  Library,
  Ruler,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePerfil } from '../../../context/PerfilContext'
import { PERMISOS_CATALOGO } from '../../../services/acceso'
import { useClickOutside } from '../../../hooks/useClickOutside'
import MenuPerfil from './MenuPerfil'
import fotoPerfil from '../../../assets/images/profile.png'
import navbarFoto from '../../../assets/images/navbar-aurora.jpg'
import plantaNavbar from '../../../assets/images/planta-navbar.png'
import './SidebarInicio.css'

interface EnlaceLateral {
  to: string
  etiqueta: string
  Icono: LucideIcon
  permiso?: string
}

/** Opciones del desplegable «Cálculo». */
const CALCULOS: { id: 'carbono' | 'hidrica' | 'historial'; to: string; etiqueta: string; Icono: LucideIcon }[] = [
  { id: 'carbono', to: '/calculos?tipo=carbono', etiqueta: 'Huella de Carbono', Icono: Cloud },
  { id: 'hidrica', to: '/calculos?tipo=hidrica', etiqueta: 'Huella Hídrica', Icono: Droplets },
  { id: 'historial', to: '/calculos?tipo=historial', etiqueta: 'Historial', Icono: History },
]

/** Secciones del desplegable «Gestión» (rutas existentes). */
const GESTION: EnlaceLateral[] = [
  { to: '/gestion/centros', etiqueta: 'Centros', Icono: Landmark, permiso: 'centro.ver' },
  { to: '/gestion/usuarios', etiqueta: 'Usuarios', Icono: UserRound, permiso: 'usuario.ver' },
  { to: '/gestion/perfiles', etiqueta: 'Perfiles', Icono: Contact, permiso: 'rol.ver' },
  { to: '/gestion/roles-permisos', etiqueta: 'Roles y permisos', Icono: ShieldCheck, permiso: 'rol.ver' },
  { to: '/gestion/organizaciones', etiqueta: 'Organizaciones', Icono: Building2, permiso: 'organizacion.ver' },
  { to: '/gestion/catalogos', etiqueta: 'Catálogos', Icono: Library },
  { to: '/gestion/unidades-medida', etiqueta: 'Unidades de medida', Icono: Ruler, permiso: 'unidad_medida.ver' },
]

interface SidebarInicioProps {
  /** Estado del cajón en pantallas pequeñas. */
  abierto: boolean
  /** Cierra el cajón móvil (al navegar o tocar el fondo). */
  onCerrar: () => void
}

/**
 * Barra lateral fija del Dashboard y de las vistas principales: marca, módulos,
 * desplegables de Cálculo y Gestión, tarjeta ambiental y bloque de usuario.
 */
export default function SidebarInicio({ abierto, onCerrar }: SidebarInicioProps) {
  const { perfil, rol, puede } = usePerfil()
  const verCatalogos = PERMISOS_CATALOGO.some((codigo) => puede(codigo))
  const gestion = GESTION.filter((enlace) => {
    if (enlace.to === '/gestion/catalogos') return verCatalogos
    if (enlace.permiso) return puede(enlace.permiso)
    return false
  })
  const { pathname, search } = useLocation()

  const [calculoAbierto, setCalculoAbierto] = useState(() => pathname.startsWith('/calculos'))
  const [gestionAbierta, setGestionAbierta] = useState(() => pathname.startsWith('/gestion'))
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  const enCalculos = pathname.startsWith('/calculos')
  const enGestion = pathname.startsWith('/gestion')

  const cerrarCalculo = useCallback(() => {
    if (!enCalculos) setCalculoAbierto(false)
  }, [enCalculos])
  const cerrarGestion = useCallback(() => {
    if (!enGestion) setGestionAbierta(false)
  }, [enGestion])
  const cerrarPerfil = useCallback(() => setPerfilAbierto(false), [])
  const refCalculo = useClickOutside<HTMLLIElement>(cerrarCalculo, calculoAbierto)
  const refGestion = useClickOutside<HTMLLIElement>(cerrarGestion, gestionAbierta)
  const refPerfil = useClickOutside<HTMLDivElement>(cerrarPerfil, perfilAbierto)

  const rutaActual = `${pathname}${search}`
  const [rutaPrevia, setRutaPrevia] = useState(rutaActual)
  if (rutaPrevia !== rutaActual) {
    setRutaPrevia(rutaActual)
    setCalculoAbierto(pathname.startsWith('/calculos'))
    setGestionAbierta(pathname.startsWith('/gestion'))
    setPerfilAbierto(false)
  }

  const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`.trim()
  const tipoCalculo = new URLSearchParams(search).get('tipo')
  const tipoActivo: 'carbono' | 'hidrica' | 'historial' =
    tipoCalculo === 'hidrica' || tipoCalculo === 'historial' ? tipoCalculo : 'carbono'

  return (
    <aside
      className={`ini-lateral ${abierto ? 'abierto' : ''}`}
      aria-label="Menú lateral"
      style={{ '--ini-navbar': `url("${navbarFoto}")` } as CSSProperties}
    >
      <div className="ini-lateral-atmosfera" aria-hidden="true">
        <span className="ini-lateral-velo" />
        <span className="ini-aurora ini-aurora--1" />
        <span className="ini-aurora ini-aurora--2" />
        <span className="ini-aurora ini-aurora--3" />
        <span className="ini-aurora-luz ini-aurora-luz--a" />
        <span className="ini-aurora-luz ini-aurora-luz--b" />
      </div>

      <div className="ini-lateral-top">
        <NavLink to="/inicio" className="ini-lateral-marca" onClick={onCerrar}>
          <span className="ini-lateral-hoja" aria-hidden="true">
            <Leaf size={16} strokeWidth={2.4} />
          </span>
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
          <li>
            <NavLink
              to="/inicio"
              end
              className={({ isActive }) => `ini-lateral-enlace ${isActive ? 'activo' : ''}`}
              onClick={onCerrar}
            >
              <Home size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>Inicio</span>
            </NavLink>
          </li>

          <li className="ini-lateral-grupo" ref={refCalculo}>
            <button
              type="button"
              className={`ini-lateral-enlace ini-lateral-gestion ${enCalculos ? 'activo' : ''}`}
              onClick={() => {
                setGestionAbierta(false)
                setCalculoAbierto((v) => !v)
              }}
              aria-haspopup="menu"
              aria-expanded={calculoAbierto}
            >
              <Calculator size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>Calculadora</span>
              <ChevronDown
                size={14}
                strokeWidth={2.4}
                aria-hidden="true"
                className={`ini-lateral-flecha ${calculoAbierto ? 'girada' : ''}`}
              />
            </button>

            {calculoAbierto ? (
              <div className="ini-lateral-submenu" role="menu" aria-label="Opciones de cálculo">
                {CALCULOS.map(({ id, to, etiqueta, Icono }) => (
                  <NavLink
                    key={id}
                    to={to}
                    role="menuitem"
                    className={`ini-lateral-subenlace ${enCalculos && tipoActivo === id ? 'activo' : ''}`}
                    onClick={() => {
                      setCalculoAbierto(false)
                      onCerrar()
                    }}
                  >
                    <Icono size={15} strokeWidth={2.1} aria-hidden="true" />
                    <span>{etiqueta}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </li>

          <li>
            <NavLink
              to="/reportes"
              className={({ isActive }) => `ini-lateral-enlace ${isActive ? 'activo' : ''}`}
              onClick={onCerrar}
            >
              <BarChart3 size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>Reportes</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/guias"
              className={({ isActive }) => `ini-lateral-enlace ${isActive ? 'activo' : ''}`}
              onClick={onCerrar}
            >
              <BookOpen size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>Guías</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/configuracion"
              className={({ isActive }) => `ini-lateral-enlace ${isActive ? 'activo' : ''}`}
              onClick={onCerrar}
            >
              <Settings size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>Configuración</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/ayuda"
              className={({ isActive }) => `ini-lateral-enlace ${isActive ? 'activo' : ''}`}
              onClick={onCerrar}
            >
              <HelpCircle size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>Ayuda</span>
            </NavLink>
          </li>

          {gestion.length > 0 ? (
          <li className="ini-lateral-grupo" ref={refGestion}>
            <button
              type="button"
              className={`ini-lateral-enlace ini-lateral-gestion ${enGestion ? 'activo' : ''}`}
              onClick={() => {
                setCalculoAbierto(false)
                setGestionAbierta((v) => !v)
              }}
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
                {gestion.map(({ to, etiqueta, Icono }) => (
                  <NavLink
                    key={to}
                    to={to}
                    role="menuitem"
                    className={({ isActive }) => `ini-lateral-subenlace ${isActive ? 'activo' : ''}`}
                    onClick={() => {
                      setGestionAbierta(false)
                      onCerrar()
                    }}
                  >
                    <Icono size={15} strokeWidth={2.1} aria-hidden="true" />
                    <span>{etiqueta}</span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </li>
          ) : null}
        </ul>
      </nav>

      <div className="ini-lateral-planta">
        <img src={plantaNavbar} alt="" />
        <Link to="/calculos?tipo=carbono" className="ini-lateral-lema" onClick={onCerrar}>
          <strong>Pequeñas acciones, grandes cambios.</strong>
          <span>Cuidemos el planeta →</span>
        </Link>
      </div>

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
