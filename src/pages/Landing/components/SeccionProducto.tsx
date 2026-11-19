import BotonLanding from './BotonLanding'
import DashboardMockup from './DashboardMockup'

export default function SeccionProducto() {
  return (
    <section className="ld-producto" id="reportes" aria-labelledby="ld-producto-titulo">
      <div className="ld-contenedor ld-producto__interno">
        <div className="ld-producto__copy" data-revelar>
          <p className="ld-kicker">
            <i aria-hidden="true" /> ¿Qué es HuellaVerde?
          </p>
          <h2 id="ld-producto-titulo">
            Una herramienta inteligente para un mundo sostenible
          </h2>
          <p>
            Analiza tu consumo, identifica tus principales fuentes de impacto y recibe recomendaciones
            personalizadas para reducir tu huella ambiental.
          </p>
          <BotonLanding href="#metodologia">Conocer más</BotonLanding>
        </div>
        <DashboardMockup />
      </div>
    </section>
  )
}
