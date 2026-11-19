import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Download, FileText, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import PlantillaVista from '../../components/layout/PlantillaVista'
import {
  BLOQUES_GUIA,
  CHEQUEO,
  CRUCE_PROCESO,
  DOCUMENTOS_GUIA,
  type Cobertura,
} from '../../data/guiasPo'
import './Guias.css'

type Pestana = 'proceso' | 'contenido'

const ETIQUETA: Record<Cobertura, string> = {
  cubierto: 'Cubierto',
  parcial: 'Por revisar',
}

export default function Guias() {
  const [pestana, setPestana] = useState<Pestana>('proceso')

  return (
    <PlantillaVista titulo="HuellaVerde — Guías" className="gui">
      <PageHeader
        titulo="Guías de cálculo"
        subtitulo="Material del product owner y el cruce con el proceso que ya recorre la calculadora de huella de carbono."
      />

      <p className="gui-aviso">
        Vista provisional de revisión. Sirve para comprobar, de acuerdo con las guías, que el
        inventario sigue el orden: alcance, datos de actividad, factores, cálculo, consolidación y
        plan.
      </p>

      <div className="gui-docs">
        {DOCUMENTOS_GUIA.map((doc) => (
          <article key={doc.id} className="vst-tarjeta gui-doc">
            <span className="gui-doc-icono" aria-hidden="true">
              <FileText size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h2>{doc.titulo}</h2>
              <p className="gui-doc-origen">{doc.origen}</p>
              <p>{doc.resumen}</p>
            </div>
            <a className="gui-descarga" href={doc.archivo} download={doc.archivoNombre}>
              <Download size={15} strokeWidth={2.3} aria-hidden="true" />
              Descargar original
            </a>
          </article>
        ))}
      </div>

      <div className="gui-pestanas" role="tablist" aria-label="Contenido de las guías">
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'proceso'}
          className={pestana === 'proceso' ? 'activa' : ''}
          onClick={() => setPestana('proceso')}
        >
          Proceso en la plataforma
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'contenido'}
          className={pestana === 'contenido' ? 'activa' : ''}
          onClick={() => setPestana('contenido')}
        >
          Contenido de las guías
        </button>
      </div>

      {pestana === 'proceso' ? (
        <div className="gui-proceso">
          <section className="vst-tarjeta gui-intro">
            <BookOpen size={18} strokeWidth={2.2} aria-hidden="true" />
            <p>
              Las dos guías describen el mismo recorrido de ocho pasos. La calculadora lo agrupa en
              cuatro pantallas. Abajo queda qué parte ya está y qué conviene mirar antes de dar el
              proceso por cerrado.
            </p>
            <Link to="/calculos?tipo=carbono" className="gui-ir">
              Abrir la calculadora
              <ArrowRight size={15} strokeWidth={2.3} aria-hidden="true" />
            </Link>
          </section>

          <ol className="gui-cruce">
            {CRUCE_PROCESO.map((paso) => (
              <li key={paso.guia} className="vst-tarjeta gui-paso">
                <header>
                  <span className="gui-paso-num">{paso.guia}</span>
                  <h3>{paso.titulo}</h3>
                  <span className={`gui-estado gui-estado--${paso.cobertura}`}>
                    {ETIQUETA[paso.cobertura]}
                  </span>
                </header>
                <div className="gui-paso-cols">
                  <div>
                    <h4>De acuerdo con la guía</h4>
                    <p>{paso.segunGuia}</p>
                  </div>
                  <div>
                    <h4>En HuellaVerde</h4>
                    <p>{paso.enPlataforma}</p>
                    <small>{paso.donde}</small>
                  </div>
                </div>
                <p className="gui-pendiente">
                  <strong>Qué falta mirar. </strong>
                  {paso.pendiente}
                </p>
              </li>
            ))}
          </ol>

          <section className="vst-tarjeta gui-chequeo" aria-labelledby="gui-chequeo-titulo">
            <h2 id="gui-chequeo-titulo">Lista de chequeo</h2>
            <p>La guía cierra con esta verificación. Así está cada punto en la versión actual.</p>
            <ul>
              {CHEQUEO.map((fila) => (
                <li key={fila.item}>
                  <span className={`gui-estado gui-estado--${fila.cobertura}`}>
                    {ETIQUETA[fila.cobertura]}
                  </span>
                  <span>
                    <b>{fila.item}</b>
                    <small>{fila.donde}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="gui-contenido">
          {BLOQUES_GUIA.map((bloque) => (
            <section key={bloque.id} className="vst-tarjeta gui-bloque">
              <h2>{bloque.titulo}</h2>
              {bloque.parrafos.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
              {bloque.filas ? (
                <ul>
                  {bloque.filas.map((fila) => (
                    <li key={fila.titulo}>
                      <b>{fila.titulo}</b>
                      <span>{fila.detalle}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </PlantillaVista>
  )
}
