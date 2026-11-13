import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EVOLUCION_12_MESES } from '../../../data/demo'
import './Paneles.css'

const COLOR_HIDRICA = '#3b82f6'
const COLOR_CARBONO = '#42d879'

/**
 * Panel «Evolución de indicadores»: gráfica de líneas con las dos series
 * reales de la plataforma (huella hídrica en azul, carbono en verde).
 */
export default function PanelEvolucion() {
  return (
    <section
      className="ini-tarjeta ini-panel ini-panel--evolucion"
      aria-labelledby="ini-evolucion-titulo"
    >
      <header className="ini-panel-cabecera">
        <h2 className="ini-titulo-seccion" id="ini-evolucion-titulo">
          Evolución de indicadores
        </h2>
        <ul className="ini-panel-leyenda">
          <li>
            <span
              className="ini-panel-muestra"
              style={{ background: COLOR_HIDRICA }}
              aria-hidden="true"
            />
            Huella Hídrica
          </li>
          <li>
            <span
              className="ini-panel-muestra"
              style={{ background: COLOR_CARBONO }}
              aria-hidden="true"
            />
            Huella de Carbono
          </li>
        </ul>
      </header>

      <div className="ini-panel-grafica">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={EVOLUCION_12_MESES}
            margin={{ top: 10, right: 12, left: -6, bottom: 0 }}
          >
            <CartesianGrid stroke="rgba(169, 183, 201, 0.1)" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: '#a9b7c9', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(169, 183, 201, 0.18)' }}
              interval={0}
            />
            <YAxis
              domain={[0, 1500]}
              ticks={[0, 500, 1000, 1500]}
              tick={{ fill: '#a9b7c9', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={46}
            />
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
              itemStyle={{ color: '#d7dfea' }}
              cursor={{ stroke: 'rgba(169, 183, 201, 0.3)', strokeDasharray: '4 4' }}
              formatter={(valor) => Number(valor).toLocaleString('es-CO')}
            />
            <Line
              type="monotone"
              dataKey="hidrica"
              name="Huella Hídrica (m³)"
              stroke={COLOR_HIDRICA}
              strokeWidth={2.6}
              strokeLinecap="round"
              dot={{ r: 3, fill: '#0b1526', stroke: COLOR_HIDRICA, strokeWidth: 2 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="carbono"
              name="Huella de Carbono (tCO₂e)"
              stroke={COLOR_CARBONO}
              strokeWidth={2.6}
              strokeLinecap="round"
              dot={{ r: 3, fill: '#0b1526', stroke: COLOR_CARBONO, strokeWidth: 2 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
