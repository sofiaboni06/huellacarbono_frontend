import { Leaf } from 'lucide-react'
import montanas from '../../../assets/images/ld-banner-montanas.jpg'
import planeta from '../../../assets/images/ld-paso-planeta.jpg'
import BotonLanding from './BotonLanding'

export default function BannerCta() {
  return (
    <section className="ld-banner" id="nosotros" aria-labelledby="ld-banner-titulo">
      <div className="ld-contenedor">
        <div className="ld-banner__tarjeta" data-revelar>
          <img className="ld-banner__fondo" src={montanas} alt="" loading="lazy" decoding="async" />
          <div className="ld-banner__contenido">
            <span className="ld-banner__planeta" aria-hidden="true">
              <img src={planeta} alt="" loading="lazy" />
              <Leaf size={14} strokeWidth={2.4} />
            </span>
            <div>
              <h2 id="ld-banner-titulo">
                Juntos por un planeta <span>más verde</span>
              </h2>
              <p>Cada acción cuenta. Empieza hoy y sé parte del cambio.</p>
            </div>
            <BotonLanding to="/login" variante="claro">
              Comenzar ahora
            </BotonLanding>
          </div>
        </div>
      </div>
    </section>
  )
}
