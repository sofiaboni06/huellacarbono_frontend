import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './Paneles.css'

const COLOR_CARBONO = '#22b573'
const COLOR_AGUA = '#3b82f6'

const RANGOS = [
  { id: 'anio', etiqueta: '1 año', dias: 365 },
  { id: 'semestre', etiqueta: '6 meses', dias: 182 },
  { id: 'mes', etiqueta: '30 días', dias: 30 },
] as const

type RangoId = (typeof RANGOS)[number]['id']

export interface PuntoCarbono {
  mes: string
  carbono: number
  agua?: number
  fecha?: string
}

/** Curva de agua ilustrativa, proporcionada a la huella, hasta que exista serie hídrica. */
function aguaIlustrativa(indice: number, total: number, topeCarbono: number): number {
  const onda = [0.42, 0.55, 0.36, 0.62, 0.4, 0.7, 0.48, 0.74, 0.52, 0.66, 0.44, 0.58]
  const base = onda[indice % onda.length]
  const escala = Math.max(topeCarbono, 0.4)
  const respiracion = total > 1 ? 0.92 + (indice % 3) * 0.04 : 1
  return Number((base * escala * respiracion).toFixed(2))
}

export default function PanelEvolucion({ datos }: { datos: PuntoCarbono[] }) {
  const [rango, setRango] = useState<RangoId>('anio')

  const visibles = useMemo(() => {
    const elegido = RANGOS.find((item) => item.id === rango) ?? RANGOS[0]
    const conFecha = datos.filter((punto) => punto.fecha && !Number.isNaN(Date.parse(punto.fecha)))
    if (!conFecha.length) return datos
    const corte = Date.now() - elegido.dias * 86_400_000
    const filtrados = datos.filter((punto) => {
      const tiempo = punto.fecha ? Date.parse(punto.fecha) : Number.NaN
      return !Number.isNaN(tiempo) && tiempo >= corte
    })
    return filtrados.length ? filtrados : datos
  }, [datos, rango])

  const serie = useMemo(() => {
    const topeCarbono = Math.max(...visibles.map((punto) => punto.carbono), 0)
    return visibles.map((punto, indice) => ({
      ...punto,
      agua: punto.agua ?? aguaIlustrativa(indice, visibles.length, topeCarbono),
    }))
  }, [visibles])

  const maximo = Math.max(...serie.flatMap((punto) => [punto.carbono, punto.agua]), 0)
  const tope = maximo <= 0 ? 4 : Math.ceil(maximo * 1.2 * 10) / 10
  const marcas = [0, 1, 2, 3, 4].map((paso) => Number(((tope / 4) * paso).toFixed(2)))

  return (
    <section className="ini-tarjeta ini-panel ini-panel--evolucion" aria-labelledby="ini-evolucion-titulo">
      <header className="ini-panel-cabecera">
        <h2 className="ini-titulo-seccion" id="ini-evolucion-titulo">
          <BarChart3 size={16} strokeWidth={2.3} aria-hidden="true" />
          Evolución de tu impacto
        </h2>
        <div className="ini-panel-herramientas">
          <div className="ini-panel-rangos" role="group" aria-label="Rango de la gráfica">
            {RANGOS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={rango === item.id ? 'activo' : ''}
                aria-pressed={rango === item.id}
                onClick={() => setRango(item.id)}
              >
                {item.etiqueta}
              </button>
            ))}
          </div>
          <ul className="ini-panel-leyenda">
            <li>
              <span className="ini-panel-muestra" style={{ background: COLOR_CARBONO }} aria-hidden="true" />
              Carbono
            </li>
            <li>
              <span className="ini-panel-muestra" style={{ background: COLOR_AGUA }} aria-hidden="true" />
              Agua
            </li>
          </ul>
        </div>
      </header>

      {serie.length ? (
        <div className="ini-panel-grafica">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
              <defs>
                <linearGradient id="ini-area-carbono" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_CARBONO} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={COLOR_CARBONO} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="ini-area-agua" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_AGUA} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={COLOR_AGUA} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(90, 122, 110, 0.14)" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#6d8494', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                minTickGap={0}
                padding={{ left: 8, right: 12 }}
              />
              <YAxis
                domain={[0, tope]}
                ticks={marcas}
                tickFormatter={(valor) =>
                  Number(valor).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                }
                tick={{ fill: '#6d8494', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={42}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid rgba(31, 173, 106, 0.18)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: '#163044',
                  boxShadow: '0 12px 28px rgba(20, 50, 40, 0.12)',
                }}
                formatter={(valor, nombre) => [
                  `${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 })}`,
                  nombre,
                ]}
              />
              <Area
                type="monotone"
                dataKey="agua"
                name="Agua"
                stroke={COLOR_AGUA}
                strokeWidth={2.4}
                fill="url(#ini-area-agua)"
                dot={{ r: 3, fill: '#fff', stroke: COLOR_AGUA, strokeWidth: 2 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: COLOR_AGUA }}
              />
              <Area
                type="monotone"
                dataKey="carbono"
                name="Carbono"
                stroke={COLOR_CARBONO}
                strokeWidth={2.6}
                fill="url(#ini-area-carbono)"
                dot={{ r: 3.2, fill: '#fff', stroke: COLOR_CARBONO, strokeWidth: 2 }}
                activeDot={{ r: 5, strokeWidth: 0, fill: COLOR_CARBONO }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="ini-panel-vacio">No hay cálculos de carbono en ese rango.</p>
      )}
    </section>
  )
}
