import { useMemo, useState } from 'react'
import { ChevronDown, Clock, Mail, MessageSquare, Phone, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import PlantillaVista, { useAviso } from '../../components/layout/PlantillaVista'
import { GUIAS_USO, PREGUNTAS_FRECUENTES } from '../../data/demo'
import './Ayuda.css'

const CONTACTO = [
  { id: 'correo', etiqueta: 'Correo de soporte', valor: 'soporte@huellaverde.app', Icono: Mail },
  { id: 'telefono', etiqueta: 'Línea de atención', valor: '+57 (601) 555 0148', Icono: Phone },
  { id: 'horario', etiqueta: 'Horario', valor: 'Lun a Vie · 8:00 a.m. – 6:00 p.m.', Icono: Clock },
]

/** Centro de ayuda: buscador, preguntas frecuentes, guías y contacto. */
export default function Ayuda() {
  const navigate = useNavigate()
  const avisar = useAviso()

  const [consulta, setConsulta] = useState('')
  const [abiertas, setAbiertas] = useState<string[]>([])

  const filtradas = useMemo(() => {
    const texto = consulta.trim().toLowerCase()
    if (!texto) return PREGUNTAS_FRECUENTES
    return PREGUNTAS_FRECUENTES.filter(
      (item) =>
        item.pregunta.toLowerCase().includes(texto) ||
        item.respuesta.toLowerCase().includes(texto),
    )
  }, [consulta])

  const alternar = (id: string) => {
    setAbiertas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <PlantillaVista titulo="HuellaVerde — Centro de ayuda" className="ayu">
      <PageHeader
        titulo="Centro de ayuda"
        subtitulo="Encuentra orientación para utilizar HuellaVerde."
      />

      {/* ------------------------------ Buscador ------------------------------ */}
      <div className="vst-tarjeta ayu-buscador">
        <Search size={18} strokeWidth={2.2} aria-hidden="true" />
        <input
          className="ayu-buscador-input"
          type="search"
          value={consulta}
          placeholder="Busca en las preguntas frecuentes…"
          aria-label="Buscar en el centro de ayuda"
          onChange={(e) => setConsulta(e.target.value)}
        />
        {consulta ? (
          <button
            type="button"
            className="ayu-buscador-limpiar"
            onClick={() => setConsulta('')}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        ) : null}
        <span className="ayu-buscador-contador" aria-live="polite">
          {filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      <div className="ayu-rejilla ayu-rejilla--principal">
        {/* ---------------------- Preguntas frecuentes ---------------------- */}
        <section className="vst-tarjeta ayu-faq" aria-labelledby="ayu-faq-titulo">
          <h2 id="ayu-faq-titulo">Preguntas frecuentes</h2>

          {filtradas.length === 0 ? (
            <p className="ayu-vacio">
              No encontramos preguntas que coincidan con «{consulta}». Prueba con otro término.
            </p>
          ) : (
            <ul className="ayu-faq-lista">
              {filtradas.map((item) => {
                const abierta = abiertas.includes(item.id)
                return (
                  <li key={item.id} className={`ayu-faq-item ${abierta ? 'abierta' : ''}`}>
                    <button
                      type="button"
                      className="ayu-faq-pregunta"
                      aria-expanded={abierta}
                      aria-controls={`ayu-resp-${item.id}`}
                      onClick={() => alternar(item.id)}
                    >
                      <span>{item.pregunta}</span>
                      <ChevronDown
                        size={18}
                        strokeWidth={2.4}
                        aria-hidden="true"
                        className="ayu-faq-flecha"
                      />
                    </button>
                    {abierta ? (
                      <div className="ayu-faq-respuesta" id={`ayu-resp-${item.id}`}>
                        <p>{item.respuesta}</p>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* --------------------------- Contacto ---------------------------- */}
        <section className="vst-tarjeta ayu-contacto" aria-labelledby="ayu-contacto-titulo">
          <h2 id="ayu-contacto-titulo">Información de contacto</h2>
          <p className="ayu-contacto-texto">
            ¿No resolviste tu duda? El equipo de HuellaVerde te acompaña.
          </p>

          <ul className="ayu-contacto-lista">
            {CONTACTO.map(({ id, etiqueta, valor, Icono }) => (
              <li key={id}>
                <span className="ayu-contacto-icono" aria-hidden="true">
                  <Icono size={16} strokeWidth={2.2} />
                </span>
                <span>
                  <small>{etiqueta}</small>
                  <b>{valor}</b>
                </span>
              </li>
            ))}
          </ul>

          <Button
            variante="primario"
            className="ayu-contacto-boton"
            onClick={() =>
              avisar('Solicitud enviada al equipo de soporte (demostración, sin backend).')
            }
          >
            <MessageSquare size={15} strokeWidth={2.3} aria-hidden="true" />
            Escribir al equipo
          </Button>
        </section>
      </div>

      <div className="ayu-rejilla ayu-rejilla--inferior">
        {/* ----------------------------- Guía ------------------------------ */}
        <section className="vst-tarjeta ayu-guias" aria-labelledby="ayu-guias-titulo">
          <h2 id="ayu-guias-titulo">Guía de uso</h2>
          <ul className="ayu-guias-lista">
            {GUIAS_USO.map((guia) => (
              <li key={guia.id}>
                <span className="ayu-guia-numero" aria-hidden="true">
                  {GUIAS_USO.indexOf(guia) + 1}
                </span>
                <span className="ayu-guia-texto">
                  <b>{guia.titulo}</b>
                  <small>{guia.descripcion}</small>
                </span>
                <span className="ayu-guia-duracion">
                  <Clock size={13} strokeWidth={2.3} aria-hidden="true" />
                  {guia.duracion}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* -------------------------- Secciones ---------------------------- */}
        <section className="vst-tarjeta ayu-secciones" aria-labelledby="ayu-secciones-titulo">
          <h2 id="ayu-secciones-titulo">Secciones de la plataforma</h2>

          <button type="button" className="ayu-seccion" onClick={() => navigate('/calculos')}>
            <span className="ayu-seccion-texto">
              <b>Cálculos</b>
              <small>Registra el consumo y obtén la huella hídrica o de carbono.</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>

          <button type="button" className="ayu-seccion" onClick={() => navigate('/reportes')}>
            <span className="ayu-seccion-texto">
              <b>Reportes</b>
              <small>Visualiza la evolución y descarga los documentos en PDF.</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>

          <button type="button" className="ayu-seccion" onClick={() => navigate('/configuracion')}>
            <span className="ayu-seccion-texto">
              <b>Configuración</b>
              <small>Ajusta la organización, el tema visual y las notificaciones.</small>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </section>
      </div>
    </PlantillaVista>
  )
}
