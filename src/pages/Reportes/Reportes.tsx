import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, Check, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import PlantillaVista, { useAviso } from '../../components/layout/PlantillaVista'
import {
  DISTRIBUCION_FUENTES,
  EVOLUCION_12_MESES,
  REPORTES_ADICIONALES,
  REPORTES_DISPONIBLES,
} from '../../data/demo'
import type { ReporteDemo } from '../../data/demo'
import { crearPdf, descargarArchivo } from '../../utils/generarPdf'
import type { LineaPdf } from '../../utils/generarPdf'
import GraficaEvolucion from './components/GraficaEvolucion'
import GraficaDonut from './components/GraficaDonut'
import './Reportes.css'

/** Periodos seleccionables de la vista. */
const PERIODOS_GRAFICA = [
  { id: '12m', etiqueta: 'Últimos 12 meses' },
  { id: '6m', etiqueta: 'Últimos 6 meses' },
  { id: 's1', etiqueta: 'Primer semestre' },
  { id: '2025', etiqueta: 'Año 2025' },
] as const

type PeriodoId = (typeof PERIODOS_GRAFICA)[number]['id']

interface PuntoSerie {
  mes: string
  hidrica: number
  carbono: number
}

/** Deriva la serie según el periodo elegido (datos de demostración). */
function serieDelPeriodo(periodo: PeriodoId): PuntoSerie[] {
  if (periodo === '6m') return EVOLUCION_12_MESES.slice(6)
  if (periodo === 's1') return EVOLUCION_12_MESES.slice(0, 6)
  if (periodo === '2025') {
    return EVOLUCION_12_MESES.map((p) => ({
      mes: p.mes,
      hidrica: Math.round(p.hidrica * 0.86),
      carbono: Math.round(p.carbono * 0.91),
    }))
  }
  return EVOLUCION_12_MESES
}

const ICONO_DESCARGA: Record<string, LucideIcon> = {
  PDF: FileText,
}

interface TarjetaReporteProps {
  reporte: ReporteDemo
  activo: boolean
  onGenerar: (reporte: ReporteDemo) => void
}

function TarjetaReporte({ reporte, activo, onGenerar }: TarjetaReporteProps) {
  const Icono = ICONO_DESCARGA[reporte.formato] ?? FileText

  return (
    <article className="rep-reporte">
      <span className="rep-reporte-icono" aria-hidden="true">
        <Icono size={22} strokeWidth={2} />
      </span>
      <div className="rep-reporte-texto">
        <h3>{reporte.titulo}</h3>
        <p>{reporte.descripcion}</p>
        <span className="rep-reporte-formato">{reporte.formato}</span>
      </div>
      <Button
        variante={activo ? 'primario' : 'contorno'}
        className="rep-reporte-boton"
        onClick={() => onGenerar(reporte)}
      >
        {activo ? (
          <>
            <Check size={15} strokeWidth={2.6} aria-hidden="true" />
            Generado
          </>
        ) : (
          <>
            <ArrowDownToLine size={15} strokeWidth={2.3} aria-hidden="true" />
            Descargar
          </>
        )}
      </Button>
    </article>
  )
}

/** Vista de Reportes y Analítica. */
export default function Reportes() {
  const avisar = useAviso()
  const [periodo, setPeriodo] = useState<PeriodoId>('12m')
  const [verTodos, setVerTodos] = useState(false)
  const [generado, setGenerado] = useState<string | null>(null)

  const serie = useMemo(() => serieDelPeriodo(periodo), [periodo])
  const reportes = verTodos ? [...REPORTES_DISPONIBLES, ...REPORTES_ADICIONALES] : REPORTES_DISPONIBLES

  useEffect(() => {
    if (!generado) return
    const temporizador = window.setTimeout(() => setGenerado(null), 2600)
    return () => window.clearTimeout(temporizador)
  }, [generado])

  const generarReporte = (reporte: ReporteDemo) => {
    const etiquetaPeriodo = PERIODOS_GRAFICA.find((p) => p.id === periodo)?.etiqueta ?? ''
    const lineas: LineaPdf[] = [
      { texto: reporte.titulo, estilo: 'titulo' },
      { texto: reporte.descripcion, estilo: 'texto' },
      { texto: `Periodo de referencia: ${etiquetaPeriodo}`, estilo: 'texto' },
      { texto: 'Organización: SENA  ·  Sede: Sede Principal  ·  2026-I', estilo: 'texto' },
      { texto: 'Indicadores principales', estilo: 'subtitulo' },
      { texto: 'Huella Hídrica Total: 1.245 m³  (variación +12%)', estilo: 'fuerte' },
      { texto: 'Huella de Carbono Total: 892 tCO₂e  (variación +8%)', estilo: 'fuerte' },
      { texto: 'Reducción lograda: 18% del periodo anterior', estilo: 'fuerte' },
      { texto: 'Reportes generados: 24', estilo: 'fuerte' },
      { texto: 'Distribución por fuente', estilo: 'subtitulo' },
      ...DISTRIBUCION_FUENTES.map((f) => ({
        texto: `${f.nombre}: ${f.valor}%`,
        estilo: 'texto' as const,
      })),
      { texto: 'Evolución mensual de la huella', estilo: 'subtitulo' },
      ...serie.map((p) => ({
        texto: `${p.mes}  ·  Hídrica ${p.hidrica} m³  ·  Carbono ${p.carbono} tCO₂e`,
        estilo: 'nota' as const,
      })),
      { texto: 'Nota', estilo: 'subtitulo' },
      {
        texto:
          'Documento generado con datos de demostración de HuellaVerde. No representa mediciones oficiales ni un inventario certificado.',
        estilo: 'nota',
      },
    ]

    const blob = crearPdf(
      lineas,
      'HuellaVerde · Documento generado automáticamente con datos de demostración.',
    )
    const archivo = `${reporte.titulo.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
    descargarArchivo(archivo, blob)

    setGenerado(reporte.id)
    avisar(`«${reporte.titulo}» generado y descargado (${reporte.formato}, datos demostrativos).`)
  }

  return (
    <PlantillaVista titulo="HuellaVerde — Reportes" className="rep">
      <PageHeader
        titulo="Reportes y Analítica"
        subtitulo="Visualiza el impacto ambiental de tu organización."
        acciones={
          <div className="vst-campo rep-selector">
            <label htmlFor="rep-periodo">Periodo</label>
            <select
              id="rep-periodo"
              className="vst-select"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoId)}
            >
              {PERIODOS_GRAFICA.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.etiqueta}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="rep-rejilla">
        <section className="vst-tarjeta rep-tarjeta" aria-labelledby="rep-evolucion-titulo">
          <header className="rep-tarjeta-cabecera">
            <h2 id="rep-evolucion-titulo">Evolución de huella</h2>
            <p>Serie mensual comparada en metros cúbicos y toneladas de CO₂e.</p>
          </header>
          <GraficaEvolucion datos={serie} />
        </section>

        <section className="vst-tarjeta rep-tarjeta" aria-labelledby="rep-distribucion-titulo">
          <header className="rep-tarjeta-cabecera">
            <h2 id="rep-distribucion-titulo">Distribución por fuente</h2>
            <p>Participación de cada fuente en la huella total del periodo.</p>
          </header>
          <GraficaDonut datos={DISTRIBUCION_FUENTES} />
        </section>
      </div>

      <section className="rep-reportes" aria-labelledby="rep-disponibles-titulo">
        <header className="rep-reportes-cabecera">
          <h2 id="rep-disponibles-titulo">Reportes disponibles</h2>
          <button type="button" className="rep-ver-todos" onClick={() => setVerTodos((v) => !v)}>
            {verTodos ? 'Ver menos' : 'Ver todos'}
            <span aria-hidden="true">{verTodos ? ' ↑' : ' →'}</span>
          </button>
        </header>

        <div className="rep-reportes-rejilla">
          {reportes.map((reporte) => (
            <TarjetaReporte
              key={reporte.id}
              reporte={reporte}
              activo={generado === reporte.id}
              onGenerar={generarReporte}
            />
          ))}
        </div>
      </section>
    </PlantillaVista>
  )
}
