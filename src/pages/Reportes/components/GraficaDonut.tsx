import { useState } from 'react'
import './GraficaDonut.css'

interface Fuente {
  nombre: string
  valor: number
  color: string
}

interface GraficaDonutProps {
  datos: Fuente[]
}

const TAMANO = 236
const RADIO = 86
const GROSOR = 26
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
const HUECO = 4

/**
 * Gráfica circular (donut) de distribución por fuente.
 * SVG real, con centro interactivo y leyenda.
 */
export default function GraficaDonut({ datos }: GraficaDonutProps) {
  const [activo, setActivo] = useState(0)

  const total = datos.reduce((acc, item) => acc + item.valor, 0) || 1
  let acumulado = 0

  const segmentos = datos.map((item) => {
    const longitud = (item.valor / total) * CIRCUNFERENCIA
    const segmento = {
      ...item,
      longitud: Math.max(longitud - HUECO, 1),
      desplazamiento: -acumulado,
      porcentaje: Math.round((item.valor / total) * 100),
    }
    acumulado += longitud
    return segmento
  })

  const seleccionado = segmentos[activo] ?? segmentos[0]

  return (
    <div className="gd-contenedor">
      <div className="gd-zona">
        <svg
          className="gd-svg"
          viewBox={`0 0 ${TAMANO} ${TAMANO}`}
          role="img"
          aria-label={`Distribución por fuente: ${segmentos
            .map((s) => `${s.nombre} ${s.porcentaje}%`)
            .join(', ')}`}
        >
          <circle
            className="gd-pista"
            cx={TAMANO / 2}
            cy={TAMANO / 2}
            r={RADIO}
            fill="none"
            stroke="rgba(148, 177, 210, 0.12)"
            strokeWidth={GROSOR}
          />

          {segmentos.map((segmento, i) => (
            <circle
              key={segmento.nombre}
              className={`gd-segmento ${activo === i ? 'activo' : ''}`}
              cx={TAMANO / 2}
              cy={TAMANO / 2}
              r={RADIO}
              fill="none"
              stroke={segmento.color}
              strokeWidth={activo === i ? GROSOR + 6 : GROSOR}
              strokeDasharray={`${segmento.longitud} ${CIRCUNFERENCIA - segmento.longitud}`}
              strokeDashoffset={segmento.desplazamiento}
              transform={`rotate(-90 ${TAMANO / 2} ${TAMANO / 2})`}
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              tabIndex={0}
              role="button"
              aria-label={`${segmento.nombre}: ${segmento.porcentaje}%`}
            />
          ))}

          <text className="gd-centro-valor" x={TAMANO / 2} y={TAMANO / 2 - 2} textAnchor="middle">
            {seleccionado.porcentaje}%
          </text>
          <text className="gd-centro-etiqueta" x={TAMANO / 2} y={TAMANO / 2 + 22} textAnchor="middle">
            {seleccionado.nombre}
          </text>
        </svg>
      </div>

      <ul className="gd-leyenda">
        {segmentos.map((segmento, i) => (
          <li key={segmento.nombre}>
            <button
              type="button"
              className={`gd-leyenda-item ${activo === i ? 'activo' : ''}`}
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onClick={() => setActivo(i)}
            >
              <span className="gd-leyenda-muestra" style={{ background: segmento.color }} aria-hidden="true" />
              <span className="gd-leyenda-nombre">{segmento.nombre}</span>
              <span className="gd-leyenda-valor">{segmento.porcentaje}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
