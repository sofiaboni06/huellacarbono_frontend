import { NavLink } from 'react-router-dom'
import { Bell, HelpCircle, Shield, SlidersHorizontal, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Opcion {
  to: string
  etiqueta: string
  Icono: LucideIcon
  final?: boolean
}

const OPCIONES: Opcion[] = [
  { to: '/perfil', etiqueta: 'Mi Perfil', Icono: User, final: true },
  { to: '/perfil/notificaciones', etiqueta: 'Notificaciones', Icono: Bell },
  { to: '/perfil/seguridad', etiqueta: 'Seguridad', Icono: Shield },
  { to: '/perfil/preferencias', etiqueta: 'Preferencias', Icono: SlidersHorizontal },
  { to: '/ayuda', etiqueta: 'Ayuda', Icono: HelpCircle },
]

/** Menú lateral de la vista de perfil (misma identidad que el de Cálculos). */
export default function SidebarPerfil() {
  return (
    <nav className="vst-sidebar" aria-label="Secciones del perfil">
      <p className="vst-sidebar-titulo">Cuenta</p>

      <ul className="vst-sidebar-lista">
        {OPCIONES.map(({ to, etiqueta, Icono, final }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={final}
              className={({ isActive }) => `vst-sidebar-item ${isActive ? 'activo' : ''}`}
            >
              <Icono size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>{etiqueta}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
