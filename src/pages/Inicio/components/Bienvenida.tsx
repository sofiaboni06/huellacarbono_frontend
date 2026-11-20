import { Sprout } from 'lucide-react'
import SelectorOrganizacion from './SelectorOrganizacion'
import { usePerfil } from '../../../context/PerfilContext'
import './Bienvenida.css'

interface Opcion {
  id: string
  nombre: string
}

interface Props {
  organizaciones: Opcion[]
  periodos: Opcion[]
  organizacionId: string
  periodoId: string
  onOrganizacion: (id: string) => void
  onPeriodo: (id: string) => void
}

export default function Bienvenida(props: Props) {
  const { perfil } = usePerfil()
  const nombre = perfil.nombre.trim() || 'de nuevo'

  return (
    <section className="ini-bienvenida" aria-label="Bienvenida">
      <div className="ini-bienvenida-texto">
        <h1 className="ini-bienvenida-saludo">
          Hola, <span className="ini-bienvenida-nombre">{nombre}</span>
          <span className="ini-bienvenida-mano" aria-hidden="true">
            <Sprout size={26} strokeWidth={1.8} />
          </span>
        </h1>
        <p className="ini-bienvenida-subtitulo">Aquí tienes un resumen de tu impacto ambiental.</p>
      </div>
      <SelectorOrganizacion {...props} />
    </section>
  )
}
