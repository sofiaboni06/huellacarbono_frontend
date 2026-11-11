import { useNavigate } from 'react-router-dom'
import { BarChart3, Cloud, Droplets, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './AccesosRapidos.css'

interface AccesoRapido {
  id: string
  etiqueta: string
  /** Ruta real a la que lleva el acceso. */
  to: string
  Icono: LucideIcon
  tono: 'azul' | 'verde'
}

const ACCESOS: AccesoRapido[] = [
  { id: 'agua', etiqueta: 'Calcular Huella Hídrica', to: '/calculos?tipo=hidrica', Icono: Droplets, tono: 'azul' },
  { id: 'carbono', etiqueta: 'Calcular Huella de Carbono', to: '/calculos?tipo=carbono', Icono: Cloud, tono: 'verde' },
  { id: 'reportes', etiqueta: 'Ver Reportes', to: '/reportes', Icono: BarChart3, tono: 'azul' },
  { id: 'config', etiqueta: 'Configuración', to: '/configuracion', Icono: Settings, tono: 'azul' },
]

/** Rejilla de accesos rápidos del panel de inicio. */
export default function AccesosRapidos() {
  const navigate = useNavigate()

  return (
    <section className="ini-tarjeta ini-accesos" aria-labelledby="ini-accesos-titulo">
      <h2 className="ini-titulo-seccion" id="ini-accesos-titulo">
        Accesos rápidos
      </h2>

      <ul className="ini-accesos-rejilla">
        {ACCESOS.map(({ id, etiqueta, to, Icono, tono }) => (
          <li key={id}>
            <button type="button" className="ini-acceso" onClick={() => navigate(to)}>
              <span className={`ini-acceso-icono tono-${tono}`}>
                <Icono size={26} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="ini-acceso-texto">{etiqueta}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
