import { Bell, CheckCheck, Info, TriangleAlert, User } from 'lucide-react'
import { useNotificaciones } from '../../../context/NotificacionesContext'
import './MenuNotificaciones.css'

interface MenuNotificacionesProps {
  onCerrar: () => void
}

const ICONOS = {
  exito: CheckCheck,
  info: Info,
  usuario: User,
  alerta: TriangleAlert,
} as const

export default function MenuNotificaciones({ onCerrar }: MenuNotificacionesProps) {
  const { notificaciones, noLeidas, marcarTodasComoLeidas } = useNotificaciones()

  return (
    <div className="ini-notif" role="menu" aria-label="Notificaciones">
      <header className="ini-notif-cabecera">
        <div>
          <h2 className="ini-notif-titulo">Notificaciones</h2>
          <p className="ini-notif-resumen">
            {noLeidas > 0 ? `${noLeidas} sin leer de ${notificaciones.length}` : `${notificaciones.length} en total`}
          </p>
        </div>
        <button
          type="button"
          className="ini-notif-todas"
          onClick={marcarTodasComoLeidas}
          disabled={noLeidas === 0}
        >
          <CheckCheck size={14} strokeWidth={2.2} aria-hidden="true" />
          Marcar como leídas
        </button>
      </header>

      <ul className="ini-notif-lista">
        {notificaciones.map((n) => {
          const Icono = ICONOS[n.tipo]
          return (
            <li key={n.id} className={`ini-notif-item ${n.leida ? '' : 'no-leida'}`}>
              <span className={`ini-notif-icono tipo-${n.tipo}`}>
                <Icono size={15} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className="ini-notif-texto">
                <span className="ini-notif-asunto">{n.titulo}</span>
                <span className="ini-notif-mensaje">{n.mensaje}</span>
                <span className="ini-notif-tiempo">{n.tiempo}</span>
              </span>
              {n.leida ? null : <span className="ini-notif-punto" aria-label="Sin leer" />}
            </li>
          )
        })}
      </ul>

      <footer className="ini-notif-pie">
        <button type="button" className="ini-notif-ver" onClick={onCerrar}>
          Cerrar
        </button>
        <span className="ini-notif-icono-pie" aria-hidden="true">
          <Bell size={14} strokeWidth={2.1} />
        </span>
      </footer>
    </div>
  )
}
