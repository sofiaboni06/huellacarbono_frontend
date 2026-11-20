import { useState } from 'react'
import { ArrowUpRight, Leaf, PieChart as PieIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import './Paneles.css'

const PALETA = [
  'var(--hv-linea-carbono)',
  'var(--hv-grafica)',
  'var(--hv-impacto)',
  'var(--hv-turquesa)',
  'var(--hv-azul-intenso)',
  'var(--hv-carbono)',
]

export interface FuentePanel {
  nombre: string
  valor: number
  color: string
}

interface Props {
  datos: FuentePanel[]
  total?: string
  unidad?: string
  nota?: string
}

export default function PanelDistribucion({ datos, total, unidad, nota }: Props) {
  const [activo, setActivo] = useState(0)
  const seleccionado = datos[activo] ?? datos[0]

  return (
    <section className="ini-tarjeta ini-panel ini-panel--distribucion" aria-labelledby="ini-distribucion-titulo">
      <header className="ini-panel-cabecera">
        <h2 className="ini-titulo-seccion" id="ini-distribucion-titulo">
          <PieIcon size={16} strokeWidth={2.3} aria-hidden="true" />
          Resumen General
        </h2>
      </header>

      {datos.length && seleccionado ? (
        <div className="ini-panel-cuerpo">
          <div className="ini-panel-donut">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos}
                  dataKey="valor"
                  nameKey="nombre"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                  onMouseEnter={(_, indice) => setActivo(indice)}
                >
                  {datos.map((fuente, indice) => (
                    <Cell
                      key={fuente.nombre}
                      fill={fuente.color || PALETA[indice % PALETA.length]}
                      fillOpacity={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--hv-blanco-azul)',
                    border: '1px solid var(--hv-neblina)',
                    borderRadius: 12,
                    boxShadow: '0 12px 28px color-mix(in srgb, var(--hv-noche) 12%, transparent)',
                    fontSize: 12,
                    color: 'var(--hv-eje)',
                  }}
                  formatter={(valor, nombre) => `${nombre}: ${valor}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="ini-donut-centro" aria-hidden="true">
              <b>{total || `${seleccionado.valor}%`}</b>
              <span>{unidad || seleccionado.nombre}</span>
            </div>
          </div>
          <ul className="ini-panel-fuentes">
            {datos.map((fuente, indice) => (
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
                    style={{ background: fuente.color || PALETA[indice % PALETA.length] }}
                    aria-hidden="true"
                  />
                  <span className="ini-panel-fuente-nombre">{fuente.nombre}</span>
                  <b>{fuente.valor}%</b>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {datos.length && nota ? (
        <p className="ini-resumen-nota">
          <Leaf size={16} strokeWidth={2.4} aria-hidden="true" />
          <span>{nota}</span>
          <ArrowUpRight className="ini-resumen-nota-flecha" size={16} strokeWidth={2.3} aria-hidden="true" />
        </p>
      ) : null}

      {datos.length ? null : (
        <p className="ini-panel-vacio">Todavía no hay un cálculo de carbono para esta organización.</p>
      )}
    </section>
  )
}
