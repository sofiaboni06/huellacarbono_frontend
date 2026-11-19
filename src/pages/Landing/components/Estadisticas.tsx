import { TrendingDown, TrendingUp } from 'lucide-react'
import { INDICADORES, type Indicador } from '../landingDatos'

function TarjetaIndicador({ icono: Icono, tono, valor, detalle, variacion, tendencia }: Indicador) {
  const Tendencia = tendencia === 'baja' ? TrendingDown : TrendingUp
  return (
    <li className={`ld-indicador ld-indicador--${tono}`}>
      <span className="ld-indicador__icono" aria-hidden="true">
        <Icono size={22} strokeWidth={2} />
      </span>
      <div>
        <strong>{valor}</strong>
        <span className="ld-indicador__detalle">{detalle}</span>
        <span className="ld-indicador__variacion">
          <Tendencia size={14} strokeWidth={2.4} aria-hidden="true" /> {variacion}
        </span>
      </div>
    </li>
  )
}

export default function Estadisticas() {
  return (
    <section className="ld-stats" id="calculadora" aria-labelledby="ld-stats-titulo">
      <div className="ld-contenedor">
        <h2 className="ld-oculto" id="ld-stats-titulo">
          Ejemplo de indicadores ambientales
        </h2>
        <ul className="ld-stats__tarjeta" data-revelar>
          {INDICADORES.map((item) => (
            <TarjetaIndicador key={item.detalle} {...item} />
          ))}
        </ul>
        <p className="ld-stats__nota">Valores ilustrativos. Calcula tu huella para ver tus propios resultados.</p>
      </div>
    </section>
  )
}
