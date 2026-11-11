import { TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import Sparkline from '../../../components/common/Sparkline'
import './TarjetaIndicador.css'

type TonoIcono = 'azul' | 'verde'

interface TarjetaIndicadorProps {
  /** Identificador del indicador (demo). */
  id?: string
  titulo: string
  valor: string
  /** Variación porcentual tipo «↑ 12%». */
  indicador?: string
  tonoIcono: TonoIcono
  colorGrafica: string
  icono: ReactNode
  /** Serie de datos de la gráfica de línea. */
  serie: number[]
  /** Muestra un indicador visual en lugar del porcentaje. */
  soloIcono?: boolean
}

/**
 * Tarjeta de indicador del panel: icono, título, valor, variación
 * y gráfica de línea dibujada en SVG real (componente Sparkline).
 */
export default function TarjetaIndicador({
  titulo,
  valor,
  indicador,
  tonoIcono,
  colorGrafica,
  icono,
  serie,
  soloIcono = false,
}: TarjetaIndicadorProps) {
  return (
    <article className="ini-tarjeta ini-indicador">
      <header className="ini-indicador-cabecera">
        <span className={`ini-indicador-icono tono-${tonoIcono}`} aria-hidden="true">
          {icono}
        </span>
        <h3 className="ini-indicador-titulo">{titulo}</h3>
      </header>

      <p className="ini-indicador-valor">{valor}</p>

      <footer className="ini-indicador-pie">
        {soloIcono ? (
          <span className="ini-indicador-chip" title="Tendencia positiva">
            <TrendingUp size={15} strokeWidth={2.4} aria-hidden="true" />
          </span>
        ) : (
          <span className="ini-indicador-variacion">
            <span aria-hidden="true">↑</span> {indicador}
          </span>
        )}

        <Sparkline
          data={serie}
          color={colorGrafica}
          height={44}
          className="ini-indicador-grafica"
        />
      </footer>
    </article>
  )
}
