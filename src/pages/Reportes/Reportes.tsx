import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  Calendar,
  Car,
  ChartColumn,
  Check,
  Droplets,
  Factory,
  FileText,
  Leaf,
  Play,
  TrendingDown,
  TrendingUp,
  Trash2,
  TreePine,
  Utensils,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Button from '../../components/common/Button'
import PlantillaVista, { useAviso } from '../../components/layout/PlantillaVista'
import { ErrorApi } from '../../services/api'
import { listarOrganizacionesCalculo, obtenerInformeCarbono, resumenCarbono } from '../../services/calculosService'
import type { ResumenCarbono } from '../../services/calculosService'
import type { Organizacion } from '../../services/organizacionesService'
import { crearInformePdf, descargarArchivo } from '../../utils/generarPdf'
import GraficaEvolucion from './components/GraficaEvolucion'
import GraficaDonut from './components/GraficaDonut'
import './Reportes.css'

const COLORES = ['#22b573', '#3b82f6', '#a855f7', '#f59e0b', '#14b8a6', '#ef4444']

/** Icono sugerido por el nombre real de cada fuente; respaldo genérico si no coincide. */
const ICONOS_FUENTE: { claves: string[]; Icono: LucideIcon }[] = [
  {
    claves: [
      'transporte',
      'vehículo',
      'vehiculo',
      'carro',
      'camión',
      'camion',
      'flota',
      'flete',
      'gasolina',
      'diésel',
      'diesel',
      'combustible',
      'viaje',
    ],
    Icono: Car,
  },
  { claves: ['energía', 'energia', 'eléctric', 'electric', 'kwh', 'luz', 'gas natural'], Icono: Zap },
  { claves: ['alimentación', 'alimentacion', 'alimento', 'comida', 'catering', 'café', 'cafe'], Icono: Utensils },
  { claves: ['agua', 'hídric', 'hidric', 'potable', 'acueducto'], Icono: Droplets },
  { claves: ['residuo', 'basura', 'desecho', 'recolección', 'recoleccion'], Icono: Trash2 },
  { claves: ['proceso', 'producción', 'produccion', 'maquinaria', 'industrial', 'fábrica', 'fabrica'], Icono: Factory },
]

function iconoFuente(nombre: string): LucideIcon {
  const texto = nombre.toLowerCase()
  return ICONOS_FUENTE.find((item) => item.claves.some((clave) => texto.includes(clave)))?.Icono ?? Leaf
}

function formato(valor: string | number, decimales = 1): string {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '0'
  return numero.toLocaleString('es-CO', {
    maximumFractionDigits: decimales,
    minimumFractionDigits: numero % 1 === 0 ? 0 : 1,
  })
}

/** Variación real entre el periodo seleccionado y el inmediatamente anterior. */
function cambio(actual: number, anterior: number | null): { texto: string; baja: boolean } | null {
  if (anterior === null || anterior === 0 || !Number.isFinite(actual)) return null
  const delta = ((actual - anterior) / Math.abs(anterior)) * 100
  if (!Number.isFinite(delta) || delta === 0) return null
  return {
    texto: `${Math.abs(delta).toLocaleString('es-CO', { maximumFractionDigits: 0 })}%`,
    baja: delta < 0,
  }
}

function TarjetaInforme({
  activo,
  onGenerar,
  controles,
}: {
  activo: boolean
  onGenerar: () => void
  controles?: ReactNode
}) {
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
      <div className="rep-reporte-acciones">
        {controles}
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
      </div>
    </article>
  )
}

export default function Reportes() {
  const avisar = useAviso()
  const navigate = useNavigate()
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [organizacionId, setOrganizacionId] = useState('')
  const [resumen, setResumen] = useState<ResumenCarbono | null>(null)
  const [periodoId, setPeriodoId] = useState('')
  const [generado, setGenerado] = useState(false)
  const [cargando, setCargando] = useState(false)

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
    setCargando(true)
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
      .finally(() => setCargando(false))
  }, [organizacionId, avisar])

  const periodos = resumen?.periodos ?? []
  const seleccionado = periodos.find((item) => item.id === periodoId) ?? resumen?.ultimo ?? null
  const serie = periodos.map((item) => ({
    mes: item.periodoNombre,
    hidrica: 0,
    carbono: Number(item.toneladasCo2e) || 0,
  }))
  const fuentes = (seleccionado?.porFuente ?? []).map((fuente, indice) => ({
    nombre: fuente.nombre,
    valor: Number(fuente.valorCo2e) || 0,
    color: COLORES[indice % COLORES.length],
  }))
  const totalFuentes = fuentes.reduce((acc, item) => acc + item.valor, 0)
  const barras = fuentes.map((fuente) => ({
    ...fuente,
    porcentaje: totalFuentes > 0 ? (fuente.valor / totalFuentes) * 100 : 0,
  }))

  const indiceSeleccionado = seleccionado
    ? periodos.findIndex((item) => item.id === seleccionado.id)
    : -1
  const periodoAnterior = indiceSeleccionado > 0 ? periodos[indiceSeleccionado - 1] : undefined
  const variacion =
    seleccionado && periodoAnterior
      ? cambio(Number(seleccionado.toneladasCo2e) || 0, Number(periodoAnterior.toneladasCo2e) || 0)
      : null

  /** Chip inferior de la tarjeta de carbono: siempre respaldado por datos reales. */
  let chipCarbono: ReactNode = null
  if (!cargando) {
    if (!seleccionado) {
      chipCarbono = <span className="rep-kpi-chip rep-kpi-chip--neutro">Sin cálculo</span>
    } else if (variacion) {
      chipCarbono = (
        <span
          className={`rep-kpi-chip ${variacion.baja ? 'rep-kpi-chip--baja' : 'rep-kpi-chip--sube'}`}
        >
          {variacion.baja ? (
            <TrendingDown size={13} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <TrendingUp size={13} strokeWidth={2.5} aria-hidden="true" />
          )}
          {variacion.texto} vs. periodo anterior
        </span>
      )
    } else {
      chipCarbono = <span className="rep-kpi-chip rep-kpi-chip--neutro">{seleccionado.periodoNombre}</span>
    }
  }

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

  const selectorPeriodo =
    resumen && resumen.periodos.length > 1 ? (
      <label className="vst-campo rep-periodo">
        Periodo
        <select className="vst-select" value={periodoId} onChange={(evento) => setPeriodoId(evento.target.value)}>
          {resumen.periodos.map((item) => (
            <option key={item.id} value={item.id}>
              {item.periodoNombre}
            </option>
          ))}
        </select>
      </label>
    ) : null

  return (
    <PlantillaVista titulo="HuellaVerde — Reportes" className="rep">
      <div className="rep-layout">
        {/* ------------------------- Lado izquierdo: presentación ------------------------- */}
        <section className="rep-presentacion" aria-labelledby="rep-presentacion-titulo">
          <span className="rep-presentacion-etiqueta">
            <ChartColumn size={15} strokeWidth={2.4} aria-hidden="true" />
            ¿Qué es HuellaVerde?
          </span>

          <h1 id="rep-presentacion-titulo" className="rep-presentacion-titulo">
            Una herramienta inteligente para un mundo{' '}
            <span className="rep-degradado">sostenible.</span>
          </h1>

          <p className="rep-presentacion-desc">
            Analiza tu consumo, identifica tus principales fuentes de impacto y recibe recomendaciones
            personalizadas para reducir tu huella ambiental.
          </p>

          <div className="rep-presentacion-botones">
            <button type="button" className="rep-boton rep-boton--primario" onClick={() => navigate('/ayuda')}>
              Conocer más
              <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <button type="button" className="rep-boton rep-boton--vidrio" onClick={() => navigate('/guias')}>
              <span className="rep-boton-play" aria-hidden="true">
                <Play size={12} strokeWidth={2.6} fill="currentColor" />
              </span>
              Ver cómo funciona
            </button>
          </div>
        </section>

        {/* ------------------------- Lado derecho: panel de cristal ----------------------- */}
        <section className="rep-panel" aria-labelledby="rep-panel-titulo">
          <span className="rep-panel-brillo" aria-hidden="true" />

          <header className="rep-panel-cabecera">
            <div className="rep-marca">
              <span className="rep-marca-icono" aria-hidden="true">
                <Leaf size={18} strokeWidth={2.4} />
              </span>
              <span className="rep-marca-nombre">
                Huella<span>Verde</span>
              </span>
            </div>

            <div className="rep-cabecera-estado">
              <span className="rep-chip">
                <Calendar size={13} strokeWidth={2.4} aria-hidden="true" />
                Resumen anual
              </span>
              {periodos.length > 0 ? (
                <span className="rep-chip rep-chip--ok">
                  <Leaf size={13} strokeWidth={2.4} aria-hidden="true" />
                  ¡Vas por buen camino!
                </span>
              ) : null}
              <span className="rep-tendencia" aria-hidden="true">
                <TrendingUp size={16} strokeWidth={2.4} />
              </span>
            </div>
          </header>

          <div className="rep-panel-titulo">
            <h2 id="rep-panel-titulo">Tu impacto ambiental</h2>
            <div className="vst-campo rep-selector">
              <label htmlFor="rep-org">Organización</label>
              <select
                id="rep-org"
                className="vst-select"
                value={organizacionId}
                onChange={(evento) => setOrganizacionId(evento.target.value)}
              >
                {organizaciones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ------------------------------ Tarjetas KPI ------------------------------ */}
          <section className="rep-kpis" aria-label="Indicadores de impacto">
            <article className="rep-kpi rep-kpi--carbono">
              <span className="rep-kpi-icono" aria-hidden="true">
                <Leaf size={22} strokeWidth={2.2} />
              </span>
              <h3 className="rep-kpi-titulo">Huella de carbono</h3>
              <p className="rep-kpi-valor">
                {cargando ? '…' : seleccionado ? formato(seleccionado.toneladasCo2e) : '—'}
              </p>
              <p className="rep-kpi-unidad">t CO₂ eq/año</p>
              {chipCarbono}
            </article>

            {/* El API de resumen todavía no expone huella hídrica: sin datos reales no se
                muestra ningún valor (solo el estado vacío). */}
            <article className="rep-kpi rep-kpi--hidrico">
              <span className="rep-kpi-icono" aria-hidden="true">
                <Droplets size={22} strokeWidth={2.2} />
              </span>
              <h3 className="rep-kpi-titulo">Huella hídrica</h3>
              <p className="rep-kpi-valor rep-kpi-valor--vacio">—</p>
              <p className="rep-kpi-unidad">m³/año</p>
              <span className="rep-kpi-chip rep-kpi-chip--info">
                <Droplets size={13} strokeWidth={2.5} aria-hidden="true" />
                Sin datos disponibles
              </span>
            </article>
          </section>

          {/* ------------------------------- Evolución ------------------------------- */}
          <article className="rep-bloque rep-evolucion" aria-labelledby="rep-evolucion-titulo">
            <header className="rep-bloque-cabecera">
              <div>
                <h3 id="rep-evolucion-titulo">Evolución</h3>
                <p>Toneladas de CO2e de cada periodo calculado.</p>
              </div>
            </header>
            {serie.length ? (
              <GraficaEvolucion datos={serie} />
            ) : (
              <p className="rep-vacio">{cargando ? 'Cargando datos…' : 'Todavía no hay cálculos.'}</p>
            )}
          </article>

          {/* --------------------------- Principales fuentes -------------------------- */}
          <article className="rep-bloque rep-fuentes" aria-labelledby="rep-fuentes-titulo">
            <header className="rep-bloque-cabecera rep-fuentes-cabecera">
              <span className="rep-bloque-icono" aria-hidden="true">
                <TreePine size={17} strokeWidth={2.2} />
              </span>
              <div>
                <h3 id="rep-fuentes-titulo">Principales fuentes</h3>
                <p>
                  {seleccionado
                    ? `${seleccionado.periodoNombre}: ${seleccionado.totalCo2e} ${seleccionado.unidadResultado}`
                    : 'Sin cálculo para mostrar.'}
                </p>
              </div>
            </header>

            {fuentes.length ? (
              <div className="rep-fuentes-cuerpo">
                <GraficaDonut datos={fuentes} />
                <ul className="rep-barras">
                  {barras.map((fuente) => {
                    const Icono = iconoFuente(fuente.nombre)
                    const porcentaje = Math.round(fuente.porcentaje)
                    return (
                      <li
                        key={`${organizacionId}-${periodoId}-${fuente.nombre}`}
                        className="rep-barra-fila"
                      >
                        <span className="rep-barra-icono" aria-hidden="true">
                          <Icono size={16} strokeWidth={2.2} />
                        </span>
                        <div className="rep-barra-cuerpo">
                          <div className="rep-barra-meta">
                            <span className="rep-barra-nombre">{fuente.nombre}</span>
                            <span className="rep-barra-porcentaje">{porcentaje} %</span>
                          </div>
                          <div
                            className="rep-barra-pista"
                            role="img"
                            aria-label={`${fuente.nombre}: ${porcentaje} por ciento`}
                          >
                            <span
                              className="rep-barra-relleno"
                              style={{ '--ancho': `${fuente.porcentaje}%` } as CSSProperties}
                            />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <p className="rep-vacio">{cargando ? 'Cargando datos…' : 'Sin fuentes para mostrar.'}</p>
            )}
          </article>

          {/* ------------------------- Descarga del informe PDF ------------------------ */}
          <TarjetaInforme
            activo={generado}
            onGenerar={() => void descargar()}
            controles={selectorPeriodo}
          />
        </section>
      </div>
    </PlantillaVista>
  )
}
