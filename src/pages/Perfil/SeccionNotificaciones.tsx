import { Bell, CheckCheck, Info, TriangleAlert, User } from 'lucide-react'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import { useNotificaciones } from '../../context/NotificacionesContext'
import './SeccionNotificaciones.css'

const ICONOS = {
  exito: CheckCheck,
  info: Info,
  usuario: User,
  alerta: TriangleAlert,
} as const

/** Historial completo de notificaciones con acción de lectura individual. */
export default function SeccionNotificaciones() {
  const { notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas } = useNotificaciones()

  return (
    <>
      <PageHeader
        titulo="Notificaciones"
        subtitulo="Consulta los avisos de tu organización y gestiona su lectura."
        acciones={
          <Button
            variante="contorno"
            onClick={marcarTodasComoLeidas}
            disabled={noLeidas === 0}
          >
            <CheckCheck size={15} strokeWidth={2.3} aria-hidden="true" />
            Marcar todas como leídas
          </Button>
        }
      />

      <section className="vst-tarjeta prf-notif" aria-label="Lista de notificaciones">
        <header className="prf-notif-cabecera">
          <span className={`prf-notif-contador ${noLeidas > 0 ? 'hay' : ''}`}>
            {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo leído'}
          </span>
          <span className="prf-notif-total">{notificaciones.length} notificaciones</span>
        </header>

        <ul className="prf-notif-lista">
          {notificaciones.map((notificacion) => {
            const Icono = ICONOS[notificacion.tipo]
            return (
              <li
                key={notificacion.id}
                className={`prf-notif-item ${notificacion.leida ? 'leida' : 'no-leida'}`}
              >
                <span className={`prf-notif-icono tipo-${notificacion.tipo}`} aria-hidden="true">
                  <Icono size={17} strokeWidth={2.2} />
                </span>

                <div className="prf-notif-texto">
                  <div className="prf-notif-fila">
                    <h3>{notificacion.titulo}</h3>
                    {!notificacion.leida ? (
                      <span className="prf-notif-punto" aria-label="Sin leer" />
                    ) : null}
                  </div>
                  <p>{notificacion.mensaje}</p>
                  <span className="prf-notif-tiempo">{notificacion.tiempo}</span>
                </div>

                <div className="prf-notif-acciones">
                  {notificacion.leida ? (
                    <span className="prf-notif-estado">
                      <CheckCheck size={14} strokeWidth={2.3} aria-hidden="true" />
                      Leída
                    </span>
                  ) : (
                    <Button
                      variante="contorno"
                      onClick={() => marcarComoLeida(notificacion.id)}
                    >
                      Marcar como leída
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {notificaciones.length === 0 ? (
          <p className="prf-notif-vacio">
            <Bell size={18} aria-hidden="true" />
            No tienes notificaciones pendientes.
          </p>
        ) : null}
      </section>
    </>
  )
}
