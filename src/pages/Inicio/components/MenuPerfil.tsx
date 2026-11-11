import { useNavigate } from 'react-router-dom'
import { Bell, HelpCircle, LogOut, Shield, SlidersHorizontal, User } from 'lucide-react'
import { usePerfil } from '../../../context/PerfilContext'
import fotoPerfil from '../../../assets/images/profile.png'
import './MenuPerfil.css'

interface MenuPerfilProps {
  onCerrar: () => void
}

/** Cada opción del menú lleva a una sección real de la aplicación. */
const OPCIONES: { id: string; etiqueta: string; Icono: typeof User; to: string }[] = [
  { id: 'perfil', etiqueta: 'Mi perfil', Icono: User, to: '/perfil' },
  { id: 'notificaciones', etiqueta: 'Notificaciones', Icono: Bell, to: '/perfil/notificaciones' },
  { id: 'seguridad', etiqueta: 'Seguridad', Icono: Shield, to: '/perfil/seguridad' },
  { id: 'preferencias', etiqueta: 'Preferencias', Icono: SlidersHorizontal, to: '/perfil/preferencias' },
  { id: 'ayuda', etiqueta: 'Ayuda', Icono: HelpCircle, to: '/ayuda' },
]

export default function MenuPerfil({ onCerrar }: MenuPerfilProps) {
  const navigate = useNavigate()
  const { perfil } = usePerfil()

  const ir = (to: string) => {
    onCerrar()
    navigate(to)
  }

  const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`.trim()

  return (
    <div className="ini-menu" role="menu" aria-label="Menú de perfil">
      <div className="ini-menu-cabecera">
        <img className="ini-menu-avatar" src={fotoPerfil} alt="" aria-hidden="true" />
        <div>
          <p className="ini-menu-nombre">{nombreCompleto}</p>
          <p className="ini-menu-correo">{perfil.correo}</p>
        </div>
      </div>

      <span className="ini-menu-regla" aria-hidden="true" />

      <ul className="ini-menu-lista">
        {OPCIONES.map(({ id, etiqueta, Icono, to }) => (
          <li key={id}>
            <button type="button" role="menuitem" className="ini-menu-item" onClick={() => ir(to)}>
              <Icono size={16} strokeWidth={2.1} aria-hidden="true" />
              <span>{etiqueta}</span>
            </button>
          </li>
        ))}
      </ul>

      <span className="ini-menu-regla" aria-hidden="true" />

      <button
        type="button"
        role="menuitem"
        className="ini-menu-item ini-menu-item--salir"
        onClick={() => ir('/login')}
      >
        <LogOut size={16} strokeWidth={2.1} aria-hidden="true" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  )
}
