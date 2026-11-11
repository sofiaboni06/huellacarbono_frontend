import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../../components/common/Button'
import Interruptor from '../../components/common/Interruptor'
import PageHeader from '../../components/common/PageHeader'
import { useAviso } from '../../components/layout/PlantillaVista'
import './SeccionPreferencias.css'

const IDIOMAS = ['Español', 'English', 'Português']
const FORMATOS = ['DD/MM/AAAA', 'AAAA-MM-DD', 'Mes D, AAAA']
const ZONAS = ['(GMT-05:00) Bogotá', '(GMT-06:00) Ciudad de México', '(GMT+00:00) Londres']

interface PreferenciasPersonales {
  idioma: string
  formato: string
  zona: string
  correo: boolean
  resumen: boolean
  sonido: boolean
}

const PREFERENCIAS_INICIALES: PreferenciasPersonales = {
  idioma: 'Español',
  formato: 'DD/MM/AAAA',
  zona: '(GMT-05:00) Bogotá',
  correo: true,
  resumen: true,
  sonido: false,
}

/** Preferencias personales del usuario (idioma, formato y avisos). */
export default function SeccionPreferencias() {
  const avisar = useAviso()

  const [borrador, setBorrador] = useState<PreferenciasPersonales>(PREFERENCIAS_INICIALES)
  const [guardadas, setGuardadas] = useState<PreferenciasPersonales>(PREFERENCIAS_INICIALES)

  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(guardadas)

  const cambiar = <K extends keyof PreferenciasPersonales>(
    clave: K,
    valor: PreferenciasPersonales[K],
  ) => setBorrador((prev) => ({ ...prev, [clave]: valor }))

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    setGuardadas(borrador)
    avisar('Preferencias guardadas correctamente (estado local de la aplicación).')
  }

  return (
    <>
      <PageHeader
        titulo="Preferencias"
        subtitulo="Personaliza la región y los avisos de tu cuenta."
      />

      <form className="prf-preferencias-formulario" onSubmit={guardar} noValidate>
        <section className="vst-tarjeta prf-pref" aria-labelledby="prf-region-titulo">
          <h2 id="prf-region-titulo">Idioma y región</h2>

          <div className="prf-pref-rejilla">
            <div className="vst-campo">
              <label htmlFor="prf-idioma">Idioma de la interfaz</label>
              <select
                id="prf-idioma"
                className="vst-select"
                value={borrador.idioma}
                onChange={(e) => cambiar('idioma', e.target.value)}
              >
                {IDIOMAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="prf-formato">Formato de fechas</label>
              <select
                id="prf-formato"
                className="vst-select"
                value={borrador.formato}
                onChange={(e) => cambiar('formato', e.target.value)}
              >
                {FORMATOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="prf-zona">Zona horaria</label>
              <select
                id="prf-zona"
                className="vst-select"
                value={borrador.zona}
                onChange={(e) => cambiar('zona', e.target.value)}
              >
                {ZONAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="vst-tarjeta prf-pref" aria-labelledby="prf-avisos-titulo">
          <h2 id="prf-avisos-titulo">Avisos personales</h2>

          <Interruptor
            id="prf-aviso-correo"
            etiqueta="Notificaciones por correo"
            descripcion="Recibe un aviso cuando se complete un cálculo o un reporte."
            activo={borrador.correo}
            onCambio={(valor) => cambiar('correo', valor)}
          />
          <Interruptor
            id="prf-aviso-resumen"
            etiqueta="Resumen semanal"
            descripcion="Lunes por la mañana con los indicadores de la semana anterior."
            activo={borrador.resumen}
            onCambio={(valor) => cambiar('resumen', valor)}
          />
          <Interruptor
            id="prf-aviso-sonido"
            etiqueta="Sonido de alerta"
            descripcion="Reproduce un tono suave al llegar una notificación nueva."
            activo={borrador.sonido}
            onCambio={(valor) => cambiar('sonido', valor)}
          />
        </section>

        <div className="prf-pref-acciones">
          <Button
            variante="contorno"
            type="button"
            onClick={() => setBorrador(guardadas)}
            disabled={!hayCambios}
          >
            Descartar
          </Button>
          <Button variante="primario" type="submit" disabled={!hayCambios}>
            Guardar preferencias
          </Button>
        </div>
      </form>
    </>
  )
}
