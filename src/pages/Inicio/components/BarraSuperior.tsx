import { useCallback, useMemo, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu as MenuIcon, Search, X } from 'lucide-react'
import { useNotificaciones } from '../../../context/NotificacionesContext'
import { usePerfil } from '../../../context/PerfilContext'
import { useClickOutside } from '../../../hooks/useClickOutside'
import MenuNotificaciones from './MenuNotificaciones'
import MenuPerfil from './MenuPerfil'
import fotoPerfil from '../../../assets/images/profile.png'
import './BarraSuperior.css'

interface SeccionBuscable {
  titulo: string
  to: string
  /** Palabras clave para la búsqueda (se normalizan sin acentos). */
  claves: string
}

/** Secciones reales de la plataforma que el buscador puede abrir. */
const SECCIONES: SeccionBuscable[] = [
  { titulo: 'Inicio', to: '/inicio', claves: 'inicio dashboard panel resumen' },
  { titulo: 'Cálculos', to: '/calculos', claves: 'calculos huella hidrica carbono asistente' },
  { titulo: 'Reportes', to: '/reportes', claves: 'reportes informes pdf descargas analitica' },
  { titulo: 'Configuración', to: '/configuracion', claves: 'configuracion preferencias tema idioma' },
  { titulo: 'Ayuda', to: '/ayuda', claves: 'ayuda faq preguntas guias contacto' },
  { titulo: 'Mi perfil', to: '/perfil', claves: 'perfil usuario datos personales' },
  { titulo: 'Notificaciones', to: '/perfil/notificaciones', claves: 'notificaciones historial avisos' },
  { titulo: 'Seguridad', to: '/perfil/seguridad', claves: 'seguridad contrasena password clave' },
  { titulo: 'Preferencias', to: '/perfil/preferencias', claves: 'preferencias notificaciones ajustes' },
  { titulo: 'Gestión de usuarios', to: '/gestion/usuarios', claves: 'gestion usuarios administrar' },
  { titulo: 'Gestión de perfiles', to: '/gestion/perfiles', claves: 'gestion perfiles administrar' },
  { titulo: 'Roles y permisos', to: '/gestion/roles-permisos', claves: 'roles permisos gestion seguridad' },
]

/** Quita acentos y pasa a minúsculas para comparar búsquedas. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

interface BarraSuperiorProps {
  /** Abre o cierra el cajón lateral en pantallas pequeñas. */
  onAlternarLateral: () => void
}

/**
 * Barra superior del Dashboard: buscador de secciones, notificaciones
 * con contador de pendientes y acceso al menú de perfil.
 */
export default function BarraSuperior({ onAlternarLateral }: BarraSuperiorProps) {
  const navigate = useNavigate()
  const { noLeidas } = useNotificaciones()
  const { perfil } = usePerfil()

  const [consulta, setConsulta] = useState('')
  const [foco, setFoco] = useState(false)
  const [notifAbierta, setNotifAbierta] = useState(false)
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  const cerrarNotif = useCallback(() => setNotifAbierta(false), [])
  const cerrarPerfil = useCallback(() => setPerfilAbierto(false), [])
  const refNotif = useClickOutside<HTMLDivElement>(cerrarNotif, notifAbierta)
  const refPerfil = useClickOutside<HTMLDivElement>(cerrarPerfil, perfilAbierto)

  const refBuscador = useClickOutside<HTMLDivElement>(() => setFoco(false), foco)

  const resultados = useMemo(() => {
    const texto = normalizar(consulta.trim())
    if (!texto) return []
    return SECCIONES.filter(
      (seccion) =>
        normalizar(seccion.titulo).includes(texto) || normalizar(seccion.claves).includes(texto),
    ).slice(0, 6)
  }, [consulta])

  const ir = (to: string) => {
    setConsulta('')
    setFoco(false)
    setNotifAbierta(false)
    setPerfilAbierto(false)
    navigate(to)
  }

  const alternarNotif = () => {
    setPerfilAbierto(false)
    setNotifAbierta((v) => !v)
  }

  const alternarPerfil = () => {
    setNotifAbierta(false)
    setPerfilAbierto((v) => !v)
  }

  const manejarTeclas = (evento: ReactKeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'Enter' && resultados.length > 0) {
      evento.preventDefault()
      ir(resultados[0].to)
    } else if (evento.key === 'Escape') {
      setConsulta('')
      setFoco(false)
    }
  }

  const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`.trim()
  const panelVisible = foco && consulta.trim().length > 0

  return (
    <header className="ini-barra">
      <button
        type="button"
        className="ini-barra-burger"
        onClick={onAlternarLateral}
        aria-label="Abrir menú lateral"
      >
        <MenuIcon size={21} strokeWidth={2.2} aria-hidden="true" />
      </button>

      <div className="ini-busca" ref={refBuscador}>
        <Search className="ini-busca-icono" size={16} strokeWidth={2.2} aria-hidden="true" />
        <input
          className="ini-busca-input"
          type="search"
          value={consulta}
          onChange={(evento) => setConsulta(evento.target.value)}
          onFocus={() => setFoco(true)}
          onKeyDown={manejarTeclas}
          placeholder="Buscar en la plataforma..."
          aria-label="Buscar en la plataforma"
          aria-expanded={panelVisible}
          role="combobox"
          aria-controls="ini-busca-resultados"
          autoComplete="off"
        />
        {consulta ? (
          <button
            type="button"
            className="ini-busca-limpiar"
            onClick={() => setConsulta('')}
            aria-label="Limpiar búsqueda"
          >
            <X size={14} strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : null}

        {panelVisible ? (
          <div className="ini-busca-panel" id="ini-busca-resultados" role="listbox" aria-label="Resultados de búsqueda">
            {resultados.length > 0 ? (
              resultados.map((seccion) => (
                <button
                  key={seccion.to}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className="ini-busca-opcion"
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => ir(seccion.to)}
                >
                  {seccion.titulo}
                </button>
              ))
            ) : (
              <p className="ini-busca-vacio">Sin resultados para «{consulta.trim()}»</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="ini-barra-acciones">
        <div className="ini-desplegable" ref={refNotif}>
          <button
            type="button"
            className="ini-barra-campana"
            onClick={alternarNotif}
            aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ''}`}
            aria-haspopup="menu"
            aria-expanded={notifAbierta}
          >
            <Bell size={19} strokeWidth={2.1} aria-hidden="true" />
            {noLeidas > 0 ? (
              <span className="ini-barra-contador" aria-hidden="true">
                {noLeidas}
              </span>
            ) : null}
          </button>
          {notifAbierta ? <MenuNotificaciones onCerrar={cerrarNotif} /> : null}
        </div>

        <div className="ini-desplegable" ref={refPerfil}>
          <button
            type="button"
            className="ini-barra-perfil"
            onClick={alternarPerfil}
            aria-label={`Menú de perfil de ${nombreCompleto}`}
            aria-haspopup="menu"
            aria-expanded={perfilAbierto}
          >
            <img className="ini-barra-foto" src={fotoPerfil} alt={nombreCompleto} />
          </button>
          {perfilAbierto ? <MenuPerfil onCerrar={cerrarPerfil} /> : null}
        </div>
      </div>
    </header>
  )
}
