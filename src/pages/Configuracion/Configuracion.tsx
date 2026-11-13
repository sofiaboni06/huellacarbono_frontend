import { useState } from 'react'
import type { FormEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { BellRing, Eye, LayoutGrid, Lock, Settings2, ShieldCheck, User } from 'lucide-react'
import Button from '../../components/common/Button'
import Interruptor from '../../components/common/Interruptor'
import PageHeader from '../../components/common/PageHeader'
import PlantillaVista, { useAviso } from '../../components/layout/PlantillaVista'
import { usePreferencias } from '../../context/PreferenciasContext'
import type { TemaVisual } from '../../context/PreferenciasContext'
import { PERIODOS, SEDES } from '../../data/demo'
import './Configuracion.css'

const ORGANIZACIONES = ['SENA', 'SENA Regional Antioquia', 'SENA Regional Bogotá', 'SENA Regional Costa']

const TEMAS: { id: TemaVisual; etiqueta: string }[] = [
  { id: 'claro', etiqueta: 'Claro' },
  { id: 'naturaleza', etiqueta: 'Naturaleza (predeterminado)' },
  { id: 'profundo', etiqueta: 'Profundo' },
]

const CUENTA = [
  {
    id: 'informacion',
    titulo: 'Información de cuenta',
    descripcion: 'Nombre, correo, cargo y organización.',
    to: '/perfil',
    Icono: User,
  },
  {
    id: 'seguridad',
    titulo: 'Seguridad',
    descripcion: 'Contraseña, doble factor y sesiones activas.',
    to: '/perfil/seguridad',
    Icono: ShieldCheck,
  },
  {
    id: 'preferencias',
    titulo: 'Preferencias',
    descripcion: 'Idioma, formato de fechas y avisos personales.',
    to: '/perfil/preferencias',
    Icono: Settings2,
  },
]

/** Vista de Configuración de la plataforma. */
export default function Configuracion() {
  const avisar = useAviso()
  const { tema, hojasVisibles, animacionesActivas, aplicar } = usePreferencias()

  const [organizacion, setOrganizacion] = useState(ORGANIZACIONES[0])
  const [sede, setSede] = useState(SEDES[0])
  const [periodo, setPeriodo] = useState(PERIODOS[0])

  // Borrador de preferencias visuales: se aplican al guardar.
  const [temaBorrador, setTemaBorrador] = useState<TemaVisual>(tema)
  const [hojasBorrador, setHojasBorrador] = useState(hojasVisibles)
  const [animacionesBorrador, setAnimacionesBorrador] = useState(animacionesActivas)

  const [sistema, setSistema] = useState(true)
  const [alertasReportes, setAlertasReportes] = useState(true)
  const [avisosCalculos, setAvisosCalculos] = useState(false)

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    aplicar({
      tema: temaBorrador,
      hojasVisibles: hojasBorrador,
      animacionesActivas: animacionesBorrador,
    })
    avisar(`Configuración guardada · ${organizacion} · ${sede} · ${periodo}.`)
  }

  return (
    <PlantillaVista titulo="HuellaVerde — Configuración" className="cfg">
      <PageHeader
        titulo="Configuración"
        subtitulo="Administra las preferencias de HuellaVerde."
        acciones={
          <Button variante="primario" type="submit" form="cfg-formulario">
            Guardar cambios
          </Button>
        }
      />

      <form id="cfg-formulario" className="cfg-rejilla" onSubmit={guardar} noValidate>
        {/* --------------------------- General --------------------------- */}
        <section className="vst-tarjeta cfg-tarjeta" aria-labelledby="cfg-general-titulo">
          <header className="cfg-cabecera">
            <span className="cfg-icono" aria-hidden="true">
              <LayoutGrid size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 id="cfg-general-titulo">Configuración general</h2>
              <p>Valores predeterminados para nuevos cálculos y reportes.</p>
            </div>
          </header>

          <div className="cfg-campos">
            <div className="vst-campo">
              <label htmlFor="cfg-organizacion">Organización</label>
              <select
                id="cfg-organizacion"
                className="vst-select"
                value={organizacion}
                onChange={(e) => setOrganizacion(e.target.value)}
              >
                {ORGANIZACIONES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="cfg-sede">Sede</label>
              <select
                id="cfg-sede"
                className="vst-select"
                value={sede}
                onChange={(e) => setSede(e.target.value)}
              >
                {SEDES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="cfg-periodo">Periodo predeterminado</label>
              <select
                id="cfg-periodo"
                className="vst-select"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                {PERIODOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ------------------------- Visualización ------------------------ */}
        <section className="vst-tarjeta cfg-tarjeta" aria-labelledby="cfg-visual-titulo">
          <header className="cfg-cabecera">
            <span className="cfg-icono" aria-hidden="true">
              <Eye size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 id="cfg-visual-titulo">Preferencias de visualización</h2>
              <p>Se aplican a todas las vistas al guardar.</p>
            </div>
          </header>

          <div className="vst-campo cfg-tema">
            <label htmlFor="cfg-tema">Tema visual</label>
            <select
              id="cfg-tema"
              className="vst-select"
              value={temaBorrador}
              onChange={(e) => setTemaBorrador(e.target.value as TemaVisual)}
            >
              {TEMAS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <Interruptor
            id="cfg-hojas"
            etiqueta="Hojas decorativas"
            descripcion="Muestra la vegetación ambiental en el fondo de las vistas."
            activo={hojasBorrador}
            onCambio={setHojasBorrador}
          />
          <Interruptor
            id="cfg-animaciones"
            etiqueta="Animaciones de interfaz"
            descripcion="Transiciones suaves al navegar y abrir menús."
            activo={animacionesBorrador}
            onCambio={setAnimacionesBorrador}
          />
        </section>

        {/* ------------------------- Notificaciones ----------------------- */}
        <section className="vst-tarjeta cfg-tarjeta" aria-labelledby="cfg-notif-titulo">
          <header className="cfg-cabecera">
            <span className="cfg-icono" aria-hidden="true">
              <BellRing size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 id="cfg-notif-titulo">Configuración de notificaciones</h2>
              <p>Define qué avisos aparecen en la campana superior.</p>
            </div>
          </header>

          <Interruptor
            id="cfg-sistema"
            etiqueta="Notificaciones del sistema"
            descripcion="Cambios de cuenta, sesiones y mantenimiento."
            activo={sistema}
            onCambio={setSistema}
          />
          <Interruptor
            id="cfg-reportes"
            etiqueta="Alertas de reportes"
            descripcion="Aviso cuando un reporte está disponible para descargar."
            activo={alertasReportes}
            onCambio={setAlertasReportes}
          />
          <Interruptor
            id="cfg-calculos"
            etiqueta="Avisos de cálculos"
            descripcion="Confirmación al finalizar un cálculo de huella."
            activo={avisosCalculos}
            onCambio={setAvisosCalculos}
          />
        </section>

        {/* ------------------------ Gestión de cuenta --------------------- */}
        <section className="vst-tarjeta cfg-tarjeta cfg-cuenta" aria-labelledby="cfg-cuenta-titulo">
          <header className="cfg-cabecera">
            <span className="cfg-icono" aria-hidden="true">
              <Lock size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2 id="cfg-cuenta-titulo">Gestión de cuenta</h2>
              <p>Accesos directos a la información y la seguridad de tu cuenta.</p>
            </div>
          </header>

          <ul className="cfg-cuenta-lista">
            {CUENTA.map(({ id, titulo, descripcion, to, Icono }) => (
              <li key={id}>
                <NavLink className="cfg-cuenta-item" to={to}>
                  <span className="cfg-cuenta-icono" aria-hidden="true">
                    <Icono size={17} strokeWidth={2.1} />
                  </span>
                  <span className="cfg-cuenta-texto">
                    <b>{titulo}</b>
                    <small>{descripcion}</small>
                  </span>
                  <span className="cfg-cuenta-flecha" aria-hidden="true">
                    →
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      </form>
    </PlantillaVista>
  )
}
