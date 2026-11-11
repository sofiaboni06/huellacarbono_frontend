import { ArrowRight, CheckCircle2, Info, User } from 'lucide-react'
import { ACTIVIDAD_RECIENTE } from '../../../data/demo'
import './ActividadReciente.css'

interface ActividadRecienteProps {
  onAviso: (mensaje: string) => void
}

const ICONOS = {
  exito: CheckCircle2,
  info: Info,
  usuario: User,
} as const

/** Lista de actividad reciente del panel de inicio (datos de demostración). */
export default function ActividadReciente({ onAviso }: ActividadRecienteProps) {
  return (
    <section
      className="ini-tarjeta ini-actividad"
      aria-labelledby="ini-actividad-titulo"
    >
      <header className="ini-actividad-cabecera">
        <h2 className="ini-titulo-seccion" id="ini-actividad-titulo">
          Actividad reciente
        </h2>
        <button
          type="button"
          className="ini-actividad-ver"
          onClick={() => onAviso('«Ver todo» está pendiente: se habilitará en una fase futura.')}
        >
          Ver todo
          <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </header>

      <ul className="ini-actividad-lista">
        {ACTIVIDAD_RECIENTE.map((item) => {
          const Icono = ICONOS[item.tipo]
          return (
            <li key={item.id} className="ini-actividad-item">
              <span className={`ini-actividad-icono tipo-${item.tipo}`} aria-hidden="true">
                <Icono size={17} strokeWidth={2.2} />
              </span>
              <span className="ini-actividad-texto">
                <span className="ini-actividad-frase">{item.texto}</span>
                <span className="ini-actividad-tiempo">{item.tiempo}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
