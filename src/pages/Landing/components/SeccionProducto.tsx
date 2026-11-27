import BotonLanding from './BotonLanding'
// Importamos el componente de Lottie
import { DotLottieReact } from '@lottiefiles/dotlottie-react' 

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
        
        {/* Aquí reemplazamos el componente antiguo por la animación de Lottie */}
        <div className="ld-producto__visual" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <DotLottieReact
            /* Como el archivo está en la carpeta 'public', se accede directamente desde la raíz '/' */
            src="/Windmills House With Solar Panel.json"
            loop
            autoplay
            style={{ width: '100%', maxWidth: '550px', height: 'auto' }}
          />
        </div>
        
      </div>
    </section>
  )
}