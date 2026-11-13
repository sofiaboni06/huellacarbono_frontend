import { usePerfil } from '../../../context/PerfilContext'
import SelectorOrganizacion from './SelectorOrganizacion'
import './Bienvenida.css'

/** Cabecera del panel de inicio: saludo dinámico y selector de periodo. */
export default function Bienvenida() {
  const { perfil } = usePerfil()

  const nombre = perfil.nombre.trim() || 'de nuevo'

  return (
    <section className="ini-bienvenida" aria-label="Bienvenida">
      <div className="ini-bienvenida-texto">
        <h1 className="ini-bienvenida-saludo">¡Hola, {nombre}!</h1>
        <p className="ini-bienvenida-subtitulo">
          Aquí tienes un resumen del estado ambiental de tu organización.
        </p>
      </div>

      <SelectorOrganizacion />
    </section>
  )
}
