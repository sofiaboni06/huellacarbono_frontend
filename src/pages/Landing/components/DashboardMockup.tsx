import type { LucideIcon } from 'lucide-react'
import { BarChart3, Calculator, Droplets, History, Home, Leaf, Settings } from 'lucide-react'

const MENU: { icono: LucideIcon; etiqueta: string }[] = [
  { icono: Home, etiqueta: 'Inicio' },
  { icono: Calculator, etiqueta: 'Calculadora' },
  { icono: BarChart3, etiqueta: 'Reportes' },
  { icono: History, etiqueta: 'Historial' },
  { icono: Settings, etiqueta: 'Configuración' },
]

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
const CARBONO = [96, 88, 92, 74, 66, 52]
const AGUA = [104, 100, 92, 94, 84, 80]
const FUENTES = [
  { etiqueta: 'Transporte', valor: 42 },
  { etiqueta: 'Energía', valor: 31 },
  { etiqueta: 'Alimentación', valor: 27 },
]

function puntos(serie: number[]) {
  return serie.map((y, i) => `${24 + i * 52},${y}`).join(' ')
}

function Anillo({
  tono,
  icono: Icono,
  porcentaje,
  cifra,
  unidad,
  titulo,
}: {
  tono: 'verde' | 'agua'
  icono: LucideIcon
  porcentaje: number
  cifra: string
  unidad: string
  titulo: string
}) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className={`ld-mock__anillo ld-mock__anillo--${tono}`}>
      <small>{titulo}</small>
      <div className="ld-mock__aro">
        <svg viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={r} className="pista" />
          <circle
            cx="42"
            cy="42"
            r={r}
            className="valor"
            strokeDasharray={`${c * porcentaje} ${c}`}
            transform="rotate(-90 42 42)"
          />
        </svg>
        <span>
          <Icono size={18} strokeWidth={2.2} />
        </span>
      </div>
      <strong>{cifra}</strong>
      <em>{unidad}</em>
    </div>
  )
}

export default function DashboardMockup() {
  return (
    <div className="ld-mock-escena" data-revelar>
      <div className="ld-mock" role="img" aria-label="Vista ilustrativa del panel de HuellaVerde con indicadores de carbono y agua">
        <aside className="ld-mock__lateral" aria-hidden="true">
          <p className="ld-mock__marca">
            <span>
              <Leaf size={14} strokeWidth={2.4} />
            </span>
            HuellaVerde
          </p>
          <ul>
            {MENU.map(({ icono: Icono, etiqueta }, i) => (
              <li key={etiqueta} className={i === 0 ? 'es-activo' : undefined}>
                <Icono size={15} strokeWidth={2} /> {etiqueta}
              </li>
            ))}
          </ul>
        </aside>

        <div className="ld-mock__cuerpo" aria-hidden="true">
          <header>
            <div>
              <small>Resumen anual</small>
              <strong>Tu impacto ambiental</strong>
            </div>
            <span className="ld-mock__chip">
              <Leaf size={12} strokeWidth={2.4} /> ¡Vas por buen camino!
            </span>
          </header>

          <div className="ld-mock__fila">
            <Anillo tono="verde" icono={Leaf} porcentaje={0.72} cifra="2.8" unidad="t CO₂ eq/año" titulo="Carbono" />
            <Anillo tono="agua" icono={Droplets} porcentaje={0.6} cifra="1.3" unidad="mil m³/año" titulo="Agua" />

            <div className="ld-mock__grafica">
              <div className="ld-mock__grafica-cabecera">
                <small>Evolución</small>
                <span>
                  <i className="verde" /> Carbono <i className="agua" /> Agua
                </span>
              </div>
              <svg viewBox="0 0 300 140">
                <defs>
                  <linearGradient id="ld-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#11AA60" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#11AA60" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[30, 60, 90, 120].map((y) => (
                  <line key={y} x1="12" x2="292" y1={y} y2={y} className="guia" />
                ))}
                <polygon points={`24,124 ${puntos(CARBONO)} 284,124`} fill="url(#ld-area)" />
                <polyline points={puntos(AGUA)} className="linea-agua" />
                <polyline points={puntos(CARBONO)} className="linea-carbono" />
                {CARBONO.map((y, i) => (
                  <circle key={i} cx={24 + i * 52} cy={y} r="3.6" className="punto" />
                ))}
              </svg>
              <div className="ld-mock__meses">
                {MESES.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="ld-mock__fuentes">
            <small>Principales fuentes</small>
            {FUENTES.map((f) => (
              <div key={f.etiqueta}>
                <span>{f.etiqueta}</span>
                <b>
                  <i style={{ width: `${f.valor * 2}%` }} />
                </b>
                <em>{f.valor}%</em>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Leaf className="ld-flota ld-flota--c" size={34} aria-hidden="true" />
      <Leaf className="ld-flota ld-flota--d" size={24} aria-hidden="true" />
    </div>
  )
}
