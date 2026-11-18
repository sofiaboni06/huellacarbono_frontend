import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { DISTRIBUCION_FUENTES } from '../../../data/demo'
import './Paneles.css'

/** Paleta del Dashboard para las fuentes (los datos provienen de demo.ts). */
const COLORES: Record<string, string> = {
  Energía: '#3b82f6',
  Transporte: '#42d879',
  Procesos: '#a855f7',
}

const colorDe = (nombre: string, respaldo: string) => COLORES[nombre] ?? respaldo

/**
 * Panel «Distribución por fuente»: donut con el porcentaje central
 * y leyenda lateral interactiva sobre los datos reales de la plataforma.
 */
export default function PanelDistribucion() {
  const [activo, setActivo] = useState(0)

  const seleccionado = DISTRIBUCION_FUENTES[activo] ?? DISTRIBUCION_FUENTES[0]

  return (
    <section
      className="ini-tarjeta ini-panel ini-panel--distribucion"
      aria-labelledby="ini-distribucion-titulo"
    >
      <header className="ini-panel-cabecera">
        <h2 className="ini-titulo-seccion" id="ini-distribucion-titulo">
          Distribución por fuente
        </h2>
      </header>

      <div className="ini-panel-cuerpo">
        <div className="ini-panel-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DISTRIBUCION_FUENTES}
                dataKey="valor"
                nameKey="nombre"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={3}
                stroke="none"
                onMouseEnter={(_, indice) => setActivo(indice)}
              >
                {DISTRIBUCION_FUENTES.map((fuente) => (
                  <Cell
                    key={fuente.nombre}
                    fill={colorDe(fuente.nombre, fuente.color)}
                    fillOpacity={activo === DISTRIBUCION_FUENTES.indexOf(fuente) ? 1 : 0.55}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#101d31',
                  border: '1px solid rgba(148, 166, 196, 0.22)',
                  borderRadius: 12,
                  boxShadow: '0 18px 40px rgba(2, 8, 18, 0.5)',
                  fontSize: 12,
                  color: '#f5f7fb',
                }}
                labelStyle={{ color: '#f5f7fb', fontWeight: 600 }}
                formatter={(valor, nombre) => `${nombre}: ${valor}%`}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="ini-donut-centro" aria-hidden="true">
            <b>{seleccionado.valor}%</b>
            <span>{seleccionado.nombre}</span>
          </div>
        </div>

        <ul className="ini-panel-fuentes">
          {DISTRIBUCION_FUENTES.map((fuente, indice) => (
            <li key={fuente.nombre}>
              <button
                type="button"
                className={`ini-panel-fuente ${activo === indice ? 'activa' : ''}`}
                onMouseEnter={() => setActivo(indice)}
                onFocus={() => setActivo(indice)}
                onClick={() => setActivo(indice)}
              >
                <span
                  className="ini-panel-muestra"
                  style={{ background: colorDe(fuente.nombre, fuente.color) }}
                  aria-hidden="true"
                />
                <span className="ini-panel-fuente-nombre">{fuente.nombre}</span>
                <b>{fuente.valor}%</b>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
