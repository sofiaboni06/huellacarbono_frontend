import { Leaf, Play } from 'lucide-react'
import heroTierra from '../../../assets/images/hero-tierra-fondo-hd.jpg'
import BotonLanding from './BotonLanding'

export default function HeroLanding() {
  return (
    <section className="ld-hero" id="inicio" aria-labelledby="ld-hero-titulo">
      <div className="ld-hero__visual" aria-hidden="true">
        <img src={heroTierra} width={2560} height={1468} alt="" fetchPriority="high" decoding="async" />
      </div>

      <div className="ld-contenedor ld-hero__interno">
        <div className="ld-hero__copy" data-revelar>
          <p className="ld-etiqueta">
            <Leaf size={15} strokeWidth={2.4} /> Por un planeta más verde
          </p>
          <h1 id="ld-hero-titulo">
            Calcula, reduce y
            <br />
            <span className="ld-degradado">cuida el planeta</span>
            <Leaf className="ld-hero__hoja" size={40} strokeWidth={2} aria-hidden="true" />
          </h1>
          <p className="ld-hero__texto">
            Con <strong>HuellaVerde</strong> descubre tu impacto ambiental, conoce tu huella de carbono e
            hídrica, y toma acción para un futuro más sostenible.
          </p>
          <div className="ld-hero__acciones">
            <BotonLanding to="/login">Calcular mi huella</BotonLanding>
            <BotonLanding
              href="#metodologia"
              variante="secundario"
              icono={<Play size={12} fill="currentColor" strokeWidth={0} />}
            >
              Ver cómo funciona
            </BotonLanding>
          </div>
        </div>
      </div>
    </section>
  )
}
