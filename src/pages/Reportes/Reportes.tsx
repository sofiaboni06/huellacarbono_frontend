import { useEffect, useState } from 'react'
import { ArrowDownToLine, Check, FileText } from 'lucide-react'
import Button from '../../components/common/Button'
import PageHeader from '../../components/common/PageHeader'
import PlantillaVista, { useAviso } from '../../components/layout/PlantillaVista'
import { ErrorApi } from '../../services/api'
import { listarOrganizacionesCalculo, obtenerInformeCarbono, resumenCarbono } from '../../services/calculosService'
import type { ResumenCarbono } from '../../services/calculosService'
import type { Organizacion } from '../../services/organizacionesService'
import { crearInformePdf, descargarArchivo } from '../../utils/generarPdf'
import GraficaEvolucion from './components/GraficaEvolucion'
import GraficaDonut from './components/GraficaDonut'
import './Reportes.css'

const COLORES = ['#3b82f6', '#42d879', '#a855f7', '#f59e0b', '#14b8a6', '#ef4444']

function TarjetaInforme({ activo, onGenerar }: { activo: boolean; onGenerar: () => void }) {
  return (
    <article className="rep-reporte">
      <span className="rep-reporte-icono" aria-hidden="true">
        <FileText size={22} strokeWidth={2} />
      </span>
      <div className="rep-reporte-texto">
        <h3>Informe de huella de carbono</h3>
        <p>Organización, periodo, factores, resultados, toneladas, intensidad y plan de reducción.</p>
        <span className="rep-reporte-formato">PDF</span>
      </div>
      <Button variante={activo ? 'primario' : 'contorno'} className="rep-reporte-boton" onClick={onGenerar}>
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

export default function Reportes() {
  const avisar = useAviso()
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [organizacionId, setOrganizacionId] = useState('')
  const [resumen, setResumen] = useState<ResumenCarbono | null>(null)
  const [periodoId, setPeriodoId] = useState('')
  const [generado, setGenerado] = useState(false)

  useEffect(() => {
    void listarOrganizacionesCalculo()
      .then((lista) => {
        setOrganizaciones(lista)
        const guia = lista.find((item) => item.nombre === 'Fábrica de Empaques')
        setOrganizacionId((guia ?? lista[0])?.id ?? '')
      })
      .catch((error: unknown) => {
        avisar(error instanceof ErrorApi ? error.message : 'No se pudieron cargar las organizaciones.')
      })
  }, [avisar])

  useEffect(() => {
    if (!organizacionId) return
    void resumenCarbono(organizacionId)
      .then((datos) => {
        setResumen(datos)
        setPeriodoId(datos.ultimo?.id ?? '')
        setGenerado(false)
      })
      .catch((error: unknown) => {
        setResumen(null)
        avisar(error instanceof ErrorApi ? error.message : 'No se pudo cargar el carbono.')
      })
  }, [organizacionId, avisar])

  const seleccionado = resumen?.periodos.find((item) => item.id === periodoId) ?? resumen?.ultimo ?? null
  const serie = (resumen?.periodos ?? []).map((item) => ({
    mes: item.periodoNombre,
    hidrica: 0,
    carbono: Number(item.toneladasCo2e) || 0,
  }))
  const fuentes = (seleccionado?.porFuente ?? []).map((fuente, indice) => ({
    nombre: fuente.nombre,
    valor: Number(fuente.valorCo2e) || 0,
    color: COLORES[indice % COLORES.length],
  }))

  async function descargar() {
    if (!seleccionado) {
      avisar('Esta organización todavía no tiene un cálculo.')
      return
    }
    try {
      const informe = await obtenerInformeCarbono(seleccionado.id)
      const blob = await crearInformePdf(informe)
      descargarArchivo(`informe-${informe.organizacionNombre}.pdf`, blob)
      setGenerado(true)
      avisar('Informe descargado.')
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo armar el informe.')
    }
  }

  return (
    <PlantillaVista titulo="HuellaVerde — Reportes" className="rep">
      <PageHeader
        titulo="Reportes y Analítica"
        subtitulo="El carbono de esta pantalla sale de los cálculos guardados."
        acciones={
          <div className="vst-campo rep-selector">
            <label htmlFor="rep-org">Organización</label>
            <select
              id="rep-org"
              className="vst-select"
              value={organizacionId}
              onChange={(evento) => setOrganizacionId(evento.target.value)}
            >
              {organizaciones.map((item) => (
                <option key={item.id} value={item.id}>{item.nombre}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="rep-rejilla">
        <section className="vst-tarjeta rep-tarjeta" aria-labelledby="rep-evolucion-titulo">
          <header className="rep-tarjeta-cabecera">
            <h2 id="rep-evolucion-titulo">Evolución de huella</h2>
            <p>Toneladas de CO2e de cada periodo calculado.</p>
          </header>
          {serie.length ? <GraficaEvolucion datos={serie} /> : <p>Todavía no hay cálculos.</p>}
        </section>

        <section className="vst-tarjeta rep-tarjeta" aria-labelledby="rep-distribucion-titulo">
          <header className="rep-tarjeta-cabecera">
            <h2 id="rep-distribucion-titulo">Distribución por fuente</h2>
            <p>
              {seleccionado
                ? `${seleccionado.periodoNombre}: ${seleccionado.totalCo2e} ${seleccionado.unidadResultado}`
                : 'Sin cálculo para mostrar.'}
            </p>
          </header>
          {fuentes.length ? <GraficaDonut datos={fuentes} /> : null}
        </section>
      </div>

      <section className="rep-reportes" aria-labelledby="rep-disponibles-titulo">
        <header className="rep-reportes-cabecera">
          <h2 id="rep-disponibles-titulo">Informe</h2>
          {resumen && resumen.periodos.length > 1 ? (
            <label className="vst-campo">
              Periodo
              <select className="vst-select" value={periodoId} onChange={(evento) => setPeriodoId(evento.target.value)}>
                {resumen.periodos.map((item) => (
                  <option key={item.id} value={item.id}>{item.periodoNombre}</option>
                ))}
              </select>
            </label>
          ) : null}
        </header>
        <div className="rep-reportes-rejilla">
          <TarjetaInforme activo={generado} onGenerar={() => void descargar()} />
        </div>
      </section>
    </PlantillaVista>
  )
}
