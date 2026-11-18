import type { ReactNode } from 'react'
import Sparkline from '../../../components/common/Sparkline'
import './TarjetaIndicador.css'

type TonoIcono = 'azul' | 'verde' | 'morado'

interface TarjetaIndicadorProps {
  /** Identificador del indicador. */
  id?: string
  titulo: string
  /** Valor principal sin unidad (p. ej. «1.245»). */
  valor: string
  /** Unidad junto al valor (p. ej. «m³», «tCO₂e», «%”). */
  unidad?: string
  /** Variación porcentual tipo «12%». */
  variacion?: string
  /** Texto de comparación (p. ej. «vs periodo anterior»). */
  comparacion?: string
  tonoIcono: TonoIcono
  colorGrafica: string
  icono: ReactNode
  /** Serie de datos de la gráfica de tendencia. */
  serie: number[]
  /** Tipo de gráfica pequeña: línea de tendencia o barras. */
  grafica?: 'linea' | 'barras'
}

/** Gráfica de barras pequeña dibujada en SVG (sin dependencias). */
function Barras({ data, color }: { data: number[]; color: string }) {
  const ancho = 120
  const alto = 44
  const hueco = 4
  const maximo = Math.max(...data, 1)
  const postes = data.length
  const anchoPoste = (ancho - hueco * (postes - 1)) / postes

  return (
    <svg
      className="ini-indicador-barras"
      viewBox={`0 0 ${ancho} ${alto}`}
      width={ancho}
      height={alto}
      aria-hidden="true"
    >
      {data.map((valor, indice) => {
        const altura = Math.max((valor / maximo) * (alto - 4), 4)
        return (
          <rect
            key={`barra-${indice}`}
            x={indice * (anchoPoste + hueco)}
            y={alto - altura}
            width={anchoPoste}
            height={altura}
            rx={2.5}
            fill={color}
            opacity={0.35 + (0.65 * (indice + 1)) / postes}
          />
        )
      })}
    </svg>
  )
}

/**
 * Tarjeta de indicador del panel: icono, título, valor con unidad,
 * variación respecto al periodo anterior y gráfica de tendencia.
 */
export default function TarjetaIndicador({
  titulo,
  valor,
  unidad,
  variacion,
  comparacion,
  tonoIcono,
  colorGrafica,
  icono,
  serie,
  grafica = 'linea',
}: TarjetaIndicadorProps) {
  return (
    <article className="ini-tarjeta ini-indicador">
      <header className="ini-indicador-cabecera">
        <span className={`ini-indicador-icono tono-${tonoIcono}`} aria-hidden="true">
          {icono}
        </span>
        <h3 className="ini-indicador-titulo">{titulo}</h3>
      </header>

      <p className="ini-indicador-valor">
        {valor}
        {unidad ? (
          <span
            className={`ini-indicador-unidad ${unidad === '%' ? 'ini-indicador-unidad--apretada' : ''}`}
          >
            {unidad}
          </span>
        ) : null}
      </p>

      <footer className="ini-indicador-pie">
        {variacion || comparacion ? (
          <span className="ini-indicador-comparacion">
            {variacion ? (
              <b className="ini-indicador-variacion">
                <span aria-hidden="true">↑</span> {variacion}
              </b>
            ) : null}
            {comparacion ? (
              <span className="ini-indicador-vs">{comparacion}</span>
            ) : null}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}

        {grafica === 'barras' ? (
          <Barras data={serie} color={colorGrafica} />
        ) : (
          <Sparkline
            data={serie}
            color={colorGrafica}
            height={44}
            className="ini-indicador-grafica"
          />
        )}
      </footer>
    </article>
  )
}
