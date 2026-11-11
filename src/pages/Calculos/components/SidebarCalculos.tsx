import { useNavigate } from 'react-router-dom'
import { Cloud, Droplets, History, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Secciones disponibles en el menú lateral de cálculos. */
export type VistaCalculos = 'hidrica' | 'carbono' | 'historial'

interface SidebarCalculosProps {
  vista: VistaCalculos
  onCambiar: (vista: VistaCalculos) => void
}

const OPCIONES: { id: VistaCalculos; etiqueta: string; Icono: LucideIcon }[] = [
  { id: 'hidrica', etiqueta: 'Huella Hídrica', Icono: Droplets },
  { id: 'carbono', etiqueta: 'Huella de Carbono', Icono: Cloud },
  { id: 'historial', etiqueta: 'Historial', Icono: History },
]

/** Menú lateral del módulo de cálculos (reutiliza el estilo global .vst-sidebar). */
export default function SidebarCalculos({ vista, onCambiar }: SidebarCalculosProps) {
  const navigate = useNavigate()

  return (
    <nav className="vst-sidebar" aria-label="Secciones de cálculo">
      <p className="vst-sidebar-titulo">Cálculos</p>

      <ul className="vst-sidebar-lista">
        {OPCIONES.map(({ id, etiqueta, Icono }) => (
          <li key={id}>
            <button
              type="button"
              className={`vst-sidebar-item ${vista === id ? 'activo' : ''}`}
              aria-current={vista === id ? 'page' : undefined}
              onClick={() => onCambiar(id)}
            >
              <Icono size={17} strokeWidth={2.1} aria-hidden="true" />
              <span>{etiqueta}</span>
            </button>
          </li>
        ))}

        <li>
          <button
            type="button"
            className="vst-sidebar-item"
            onClick={() => navigate('/configuracion')}
          >
            <Settings size={17} strokeWidth={2.1} aria-hidden="true" />
            <span>Configuración</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
