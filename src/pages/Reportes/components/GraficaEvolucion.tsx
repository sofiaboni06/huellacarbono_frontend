import { useState } from 'react'
import './GraficaEvolucion.css'

interface PuntoSerie {
  mes: string
  hidrica: number
  carbono: number
}

interface GraficaEvolucionProps {
  datos: PuntoSerie[]
}

const ANCHO = 740
const ALTO = 300
const IZQ = 58
const DER = 18
const ARRIBA = 18
const ABAJO = 44

const COLOR_HIDRICA = '#3b82f6'
const COLOR_CARBONO = '#22c55e'
const COLOR_REJILLA = 'rgba(17, 56, 32, 0.12)'
const COLOR_EJE = 'rgba(17, 56, 32, 0.45)'

/**
 * Gráfica de líneas de evolución (SVG real, interactiva con punto de consulta).
 * Dos series: huella hídrica (azul) y huella de carbono (verde).
 */
export default function GraficaEvolucion({ datos }: GraficaEvolucionProps) {
  const [activo, setActivo] = useState<number | null>(null)

  const maximo = Math.max(100, ...datos.flatMap((d) => [d.hidrica, d.carbono]))
  const tope = Math.ceil(maximo / 250) * 250
  const divisiones = 5

  const anchoUtil = ANCHO - IZQ - DER
  const altoUtil = ALTO - ARRIBA - ABAJO
  const paso = datos.length > 1 ? anchoUtil / (datos.length - 1) : anchoUtil

  const posicionX = (i: number) => IZQ + paso * i
  const posicionY = (valor: number) => ARRIBA + altoUtil - (valor / tope) * altoUtil

  const trazar = (clave: 'hidrica' | 'carbono') =>
    datos
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${posicionX(i).toFixed(1)} ${posicionY(d[clave]).toFixed(1)}`)
      .join(' ')

  const rejilla = Array.from({ length: divisiones + 1 }, (_, k) => (tope * k) / divisiones)
  const puntoActivo = activo !== null ? datos[activo] : null

  const etiquetaAria = datos
    .map((d) => `${d.mes}: ${d.hidrica} metros cúbicos y ${d.carbono} toneladas de CO2e`)
    .join('; ')

  return (
    <div className="ge-contenedor" onMouseLeave={() => setActivo(null)}>
      <div className="ge-zona">
      <svg
        className="ge-svg"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="img"
        aria-label={`Evolución mensual de la huella. ${etiquetaAria}`}
        onMouseLeave={() => setActivo(null)}
      >
        {/* ------------------------------- Rejilla ------------------------------ */}
        {rejilla.map((valor) => (
          <g key={valor}>
            <line
              x1={IZQ}
              x2={ANCHO - DER}
              y1={posicionY(valor)}
              y2={posicionY(valor)}
              stroke={COLOR_REJILLA}
              strokeWidth={1}
              strokeDasharray={valor === 0 ? '0' : '4 5'}
            />
            <text className="ge-eje ge-eje-y" x={IZQ - 10} y={posicionY(valor) + 4} textAnchor="end">
              {Math.round(valor).toLocaleString('es-CO')}
            </text>
          </g>
        ))}

        {/* -------------------------------- Ejes ------------------------------- */}
        <line
          x1={IZQ}
          x2={IZQ}
          y1={ARRIBA}
          y2={ARRIBA + altoUtil}
          stroke={COLOR_EJE}
          strokeWidth={1.2}
        />
        <line
          x1={IZQ}
          x2={ANCHO - DER}
          y1={ARRIBA + altoUtil}
          y2={ARRIBA + altoUtil}
          stroke={COLOR_EJE}
          strokeWidth={1.2}
        />

        {/* --------------------------- Guía de consulta ------------------------ */}
        {puntoActivo && activo !== null ? (
          <line
            x1={posicionX(activo)}
            x2={posicionX(activo)}
            y1={ARRIBA}
            y2={ARRIBA + altoUtil}
            stroke="rgba(20, 96, 47, 0.4)"
            strokeWidth={1.4}
            strokeDasharray="4 4"
          />
        ) : null}

        {/* ------------------------------- Series ------------------------------ */}
        <path d={trazar('hidrica')} fill="none" stroke={COLOR_HIDRICA} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
        <path d={trazar('carbono')} fill="none" stroke={COLOR_CARBONO} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />

        {datos.map((d, i) => (
          <g key={`p-${d.mes}`}>
            <circle
              cx={posicionX(i)}
              cy={posicionY(d.hidrica)}
              r={activo === i ? 5.5 : 3.6}
              fill="#fff"
              stroke={COLOR_HIDRICA}
              strokeWidth={2.4}
            />
            <circle
              cx={posicionX(i)}
              cy={posicionY(d.carbono)}
              r={activo === i ? 5.5 : 3.6}
              fill="#fff"
              stroke={COLOR_CARBONO}
              strokeWidth={2.4}
            />
          </g>
        ))}

        {/* --------------------------- Etiquetas de mes ------------------------ */}
        {datos.map((d, i) => (
          <text
            key={`m-${d.mes}`}
            className={`ge-eje ge-eje-x ${activo === i ? 'activo' : ''}`}
            x={posicionX(i)}
            y={ARRIBA + altoUtil + 24}
            textAnchor="middle"
          >
            {d.mes}
          </text>
        ))}

        {/* ------------------------- Zonas de interacción ---------------------- */}
        {datos.map((d, i) => {
          const x0 = i === 0 ? IZQ : posicionX(i) - paso / 2
          const ancho = i === datos.length - 1 ? ANCHO - DER - x0 : paso
          return (
            <rect
              key={`z-${d.mes}`}
              x={x0}
              y={ARRIBA}
              width={Math.max(ancho, 1)}
              height={altoUtil}
              fill="transparent"
              onMouseEnter={() => setActivo(i)}
            />
          )
        })}
      </svg>

      {puntoActivo && activo !== null ? (
        <div
          className="ge-consulta"
          style={{
            left: `${Math.min(86, Math.max(14, (posicionX(activo) / ANCHO) * 100))}%`,
            top: `${Math.min(
              72,
              Math.max(
                22,
                (Math.min(posicionY(puntoActivo.hidrica), posicionY(puntoActivo.carbono)) / ALTO) * 100,
              ),
            )}%`,
          }}
          role="status"
        >
          <strong className="ge-consulta-mes">{puntoActivo.mes}</strong>
          <span className="ge-consulta-fila">
            <i style={{ background: COLOR_HIDRICA }} aria-hidden="true" />
            Hídrica <b>{puntoActivo.hidrica.toLocaleString('es-CO')} m³</b>
          </span>
          <span className="ge-consulta-fila">
            <i style={{ background: COLOR_CARBONO }} aria-hidden="true" />
            Carbono <b>{puntoActivo.carbono.toLocaleString('es-CO')} tCO₂e</b>
          </span>
        </div>
      ) : null}
      </div>

      <ul className="ge-leyenda">
        <li>
          <span className="ge-leyenda-muestra" style={{ background: COLOR_HIDRICA }} aria-hidden="true" />
          Hídrica (m³)
        </li>
        <li>
          <span className="ge-leyenda-muestra" style={{ background: COLOR_CARBONO }} aria-hidden="true" />
          Carbono (tCO₂e)
        </li>
        <li className="ge-leyenda-ayuda">Pasa el cursor por la gráfica para consultar valores</li>
      </ul>
    </div>
  )
}
