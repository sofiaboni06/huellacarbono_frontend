import { Fragment } from 'react'
import { ArrowRight } from 'lucide-react'
import { PASOS, type Paso } from '../landingDatos'

function TarjetaPaso({ numero, titulo, texto, imagen, alt }: Paso) {
  return (
    <li className="ld-paso">
      <div className="ld-paso__texto">
        <span className="ld-paso__numero">{numero}</span>
        <h3>{titulo}</h3>
        <p>{texto}</p>
      </div>
      <figure className="ld-paso__imagen">
        <img src={imagen} alt={alt} width={160} height={120} loading="lazy" decoding="async" />
      </figure>
    </li>
  )
}

export default function PasosFuncionamiento() {
  return (
    <section className="ld-pasos" id="metodologia" aria-labelledby="ld-pasos-titulo">
      <div className="ld-contenedor">
        <header className="ld-pasos__cabecera" data-revelar>
          <p className="ld-kicker ld-kicker--centro">
            <i aria-hidden="true" /> ¿Cómo funciona?
          </p>
          <h2 id="ld-pasos-titulo">Es fácil, rápido y útil</h2>
        </header>
        <ol className="ld-pasos__lista" data-revelar>
          {PASOS.map((paso, i) => (
            <Fragment key={paso.numero}>
              {i > 0 ? (
                <li className="ld-pasos__flecha" aria-hidden="true">
                  <ArrowRight size={18} strokeWidth={2.4} />
                </li>
              ) : null}
              <TarjetaPaso {...paso} />
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  )
}
