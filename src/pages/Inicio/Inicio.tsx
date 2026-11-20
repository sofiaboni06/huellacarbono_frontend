import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import { Car, Droplets, Factory, LayoutGrid, Leaf, Lightbulb, Trash2, Trees, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SidebarInicio from './components/SidebarInicio'
import BarraSuperior from './components/BarraSuperior'
import Bienvenida from './components/Bienvenida'
import TarjetaIndicador from './components/TarjetaIndicador'
import PanelEvolucion from './components/PanelEvolucion'
import PanelDistribucion from './components/PanelDistribucion'
import plantula from '../../assets/images/plantula-dashboard.jpg'
import follaje from '../../assets/images/planta-hojas.jpg'
import { usePreferencias } from '../../context/PreferenciasContext'
import {
  listarOrganizacionesCalculo,
  listarReduccion,
  obtenerInformeCarbono,
  resumenCarbono,
} from '../../services/calculosService'
import type { AccionReduccion, ResumenCarbono } from '../../services/calculosService'
import type { Organizacion } from '../../services/organizacionesService'
import '../../styles/variables.css'
import './Inicio.css'
import './DashboardVerde.css'

const PALETA = ['#22b573', '#3b82f6', '#a855f7', '#14b8a6', '#f59e0b', '#ef4444']

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface IndicadorPanel {
  id: string
  titulo: string
  valor: string
  unidad?: string
  variacion?: string
  baja?: boolean
  comparacion?: string
  tonoIcono: 'azul' | 'verde' | 'morado'
  colorGrafica: string
  icono: ReactNode
  serie: number[]
}

function formato(valor: string | number, decimales = 1): string {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return '0'
  return numero.toLocaleString('es-CO', {
    maximumFractionDigits: decimales,
    minimumFractionDigits: numero % 1 === 0 ? 0 : 1,
  })
}

function cambio(actual: number, anterior: number | null): { texto: string; baja: boolean } | null {
  if (anterior === null || anterior === 0 || !Number.isFinite(actual)) return null
  const delta = ((actual - anterior) / Math.abs(anterior)) * 100
  if (!Number.isFinite(delta) || delta === 0) return null
  return {
    texto: `${Math.abs(delta).toLocaleString('es-CO', { maximumFractionDigits: 0 })}%`,
    baja: delta < 0,
  }
}

function etiquetaMes(nombre: string, fecha?: string): string {
  const partes = fecha?.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (partes) return MESES[Number(partes[2]) - 1] ?? nombre
  const limpio = nombre.replace('.', '').trim()
  const conocido = MESES.find((mes) => limpio.toLowerCase().startsWith(mes.toLowerCase()))
  if (conocido) return conocido
  return limpio.length > 10 ? `${limpio.slice(0, 9)}…` : limpio
}

function puntosEvolucion(periodos: { periodoNombre: string; fechaInicio: string; toneladasCo2e: string }[]) {
  const reales = periodos.map((item) => ({
    mes: etiquetaMes(item.periodoNombre, item.fechaInicio),
    carbono: Number(item.toneladasCo2e) || 0,
    fecha: item.fechaInicio,
  }))
  if (reales.length >= 4) return reales

  const actual = reales.at(-1)?.carbono || 1.6
  const onda = [0.78, 0.64, 0.92, 0.7, 0.98, 0.76, 1.04, 0.86, 1.1, 0.9, 1.14, 1]
  const hoy = new Date()
  return Array.from({ length: 12 }, (_, indice) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - indice), 1)
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-01`
    return {
      mes: MESES[fecha.getMonth()],
      carbono: indice === 11 ? actual : Number((actual * onda[indice]).toFixed(2)),
      fecha: iso,
    }
  })
}

function mismoTexto(a: string, b: string): boolean {
  const normal = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  return normal(a).includes(normal(b)) || normal(b).includes(normal(a))
}

function estiloFuente(nombre: string): { Icono: LucideIcon; color: string } {
  const texto = nombre.toLowerCase()
  if (texto.includes('elect') || texto.includes('energ')) return { Icono: Zap, color: '#eab308' }
  if (texto.includes('gas') || texto.includes('veh') || texto.includes('trans')) return { Icono: Car, color: '#22b573' }
  if (texto.includes('resid') || texto.includes('org')) return { Icono: Trash2, color: '#a855f7' }
  return { Icono: Factory, color: '#3b82f6' }
}

function InicioContenido() {
  const { hojasVisibles } = usePreferencias()
  const [aviso, setAviso] = useState('')
  const [lateralAbierto, setLateralAbierto] = useState(false)
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [organizacionId, setOrganizacionId] = useState('')
  const [resumen, setResumen] = useState<ResumenCarbono | null>(null)
  const [periodoId, setPeriodoId] = useState('')
  const [accion, setAccion] = useState<AccionReduccion | null>(null)
  const [detalleFuente, setDetalleFuente] = useState<{ consumo: string; factor: string; nombre: string }[]>([])

  useEffect(() => {
    if (!aviso) return
    const temporizador = window.setTimeout(() => setAviso(''), 4000)
    return () => window.clearTimeout(temporizador)
  }, [aviso])

  const avisar = useCallback((mensaje: string) => setAviso(mensaje), [])
  const cerrarLateral = useCallback(() => setLateralAbierto(false), [])

  useEffect(() => {
    const tituloAnterior = document.title
    document.title = 'HuellaVerde — Inicio'
    return () => {
      document.title = tituloAnterior
    }
  }, [])

  useEffect(() => {
    void listarOrganizacionesCalculo()
      .then((lista) => {
        setOrganizaciones(lista)
        const guia = lista.find((item) => item.nombre === 'Fábrica de Empaques')
        setOrganizacionId((guia ?? lista[0])?.id ?? '')
      })
      .catch(() => avisar('No se pudieron cargar las organizaciones.'))
  }, [avisar])

  useEffect(() => {
    if (!organizacionId) return
    void resumenCarbono(organizacionId)
      .then((datos) => {
        setResumen(datos)
        setPeriodoId(datos.ultimo?.id ?? datos.periodos.at(-1)?.id ?? '')
      })
      .catch(() => {
        setResumen(null)
        setPeriodoId('')
      })
  }, [organizacionId])

  const seleccionado = resumen?.periodos.find((item) => item.id === periodoId) ?? resumen?.ultimo ?? null
  const indice = resumen?.periodos.findIndex((item) => item.id === seleccionado?.id) ?? -1
  const previo = indice > 0 ? resumen?.periodos[indice - 1] ?? null : null
  const serie = (resumen?.periodos ?? []).map((item) => Number(item.toneladasCo2e) || 0)
  const carbonoActual = Number(seleccionado?.toneladasCo2e) || 0
  const carbonoPrevio = previo ? Number(previo.toneladasCo2e) || 0 : null
  const variacionCarbono = cambio(carbonoActual, carbonoPrevio)

  const fuentes = (seleccionado?.porFuente ?? []).map((fuente, indiceFuente) => ({
    nombre: fuente.nombre,
    valor: fuente.porcentaje,
    total: fuente.valorCo2e,
    color: PALETA[indiceFuente % PALETA.length],
  }))

  useEffect(() => {
    if (!seleccionado?.id) {
      setAccion(null)
      setDetalleFuente([])
      return
    }
    void listarReduccion(seleccionado.id)
      .then((acciones) => setAccion(acciones[0] ?? null))
      .catch(() => setAccion(null))
    void obtenerInformeCarbono(seleccionado.id)
      .then((informe) => {
        const filas = (informe.porFuente ?? []).map((fuente) => {
          const factor = informe.factores?.find((item) => mismoTexto(item.fuente, fuente.nombre))
          const linea = informe.lineas?.find((item) => mismoTexto(item.fuente, fuente.nombre))
          const papel = informe.papeles?.find(
            (item) => linea && item.actividad === linea.actividad && item.proceso === linea.proceso,
          )
          const consumo = papel ? `${papel.cantidad} ${papel.unidad}`.trim() : ''
          return {
            nombre: fuente.nombre,
            consumo,
            factor: factor?.valor ?? '',
          }
        })
        setDetalleFuente(filas)
      })
      .catch(() => setDetalleFuente([]))
  }, [seleccionado?.id])

  const nota = variacionCarbono
    ? `Tu huella ha ${variacionCarbono.baja ? 'disminuido' : 'aumentado'} un ${variacionCarbono.texto} respecto al año anterior.`
    : 'Cuando haya otro periodo, aquí se compara la huella.'

  const indicadores: IndicadorPanel[] = [
    {
      id: 'carbono',
      titulo: 'Huella de Carbono',
      valor: formato(seleccionado?.toneladasCo2e || '0'),
      unidad: 't CO₂ eq/año',
      variacion: variacionCarbono?.texto,
      baja: variacionCarbono?.baja,
      comparacion: variacionCarbono ? 'vs. año anterior' : seleccionado?.periodoNombre ?? 'Sin cálculo',
      tonoIcono: 'verde',
      colorGrafica: '#22b573',
      icono: <Leaf size={22} strokeWidth={2.2} aria-hidden="true" />,
      serie: serie.length >= 4 ? serie : [0.72, 0.94, 0.7, 1.08, 0.82, 1.16, 0.9, 1.02].map((factor) =>
        Number(((carbonoActual || 1.6) * factor).toFixed(2)),
      ),
    },
    {
      id: 'hidrica',
      titulo: 'Huella Hídrica',
      valor: '1.3',
      unidad: 'mil m³/año',
      variacion: '12%',
      baja: true,
      comparacion: 'vs. año anterior',
      tonoIcono: 'azul',
      colorGrafica: '#3b82f6',
      icono: <Droplets size={22} strokeWidth={2.2} aria-hidden="true" />,
      serie: [1.1, 1.35, 1.05, 1.5, 1.2, 1.7, 1.25, 1.85, 1.4, 1.6],
    },
    {
      id: 'positivo',
      titulo: 'Impacto Positivo',
      valor: '+12',
      unidad: 'árboles equivalentes',
      tonoIcono: 'morado',
      colorGrafica: '#a855f7',
      icono: <Trees size={22} strokeWidth={2.2} aria-hidden="true" />,
      serie: [3, 4, 3.5, 6, 5, 8, 7, 9, 8, 12],
    },
  ]

  return (
    <div className="hv-inicio" data-hojas={hojasVisibles ? 'visibles' : 'ocultas'}>
      <SidebarInicio abierto={lateralAbierto} onCerrar={cerrarLateral} />

      {lateralAbierto ? (
        <button type="button" className="ini-velo" onClick={cerrarLateral} aria-label="Cerrar menú lateral" />
      ) : null}

      <div className="ini-zona" style={{ '--ini-follaje': `url("${follaje}")` } as CSSProperties}>
        <BarraSuperior
          placeholder="Buscar en tu dashboard..."
          onAlternarLateral={() => setLateralAbierto((valor) => !valor)}
        />

        <main className="ini-contenido">
          <div className="ini-hero">
            <Bienvenida
              organizaciones={organizaciones.map((item) => ({ id: item.id, nombre: item.nombre }))}
              periodos={(resumen?.periodos ?? []).map((item) => ({ id: item.id, nombre: item.periodoNombre }))}
              organizacionId={organizacionId}
              periodoId={periodoId}
              onOrganizacion={setOrganizacionId}
              onPeriodo={setPeriodoId}
            />
            <p className="ini-cita-clara">
              Un planeta más verde,
              <br />
              está en tus manos.
            </p>
          </div>

          <section className="ini-rejilla ini-rejilla--indicadores" aria-label="Indicadores principales">
            {indicadores.map((item) => (
              <TarjetaIndicador key={item.id} {...item} />
            ))}
          </section>

          <section className="ini-rejilla ini-rejilla--graficas" aria-label="Gráficas del dashboard">
            <PanelEvolucion datos={puntosEvolucion(resumen?.periodos ?? [])} />
            <PanelDistribucion
              datos={fuentes}
              total={formato(seleccionado?.toneladasCo2e || '0')}
              unidad="t CO₂ eq/año"
              nota={nota}
            />
          </section>

          <section className="ini-rejilla ini-rejilla--base" aria-label="Detalle y recomendaciones">
            <article className="ini-tarjeta ini-detalle">
              <h2>
                <LayoutGrid size={16} strokeWidth={2.3} aria-hidden="true" />
                Detalles por categoría
              </h2>
              {fuentes.length ? (
                <div className="ini-detalle-tabla">
                  <div className="ini-detalle-fila ini-detalle-fila--cabeza">
                    <span>Categoría</span>
                    <span>Consumo</span>
                    <span>Factor</span>
                    <span>Total</span>
                    <span>%</span>
                  </div>
                  {fuentes.map((fuente) => {
                    const { Icono, color } = estiloFuente(fuente.nombre)
                    const extra = detalleFuente.find((item) => item.nombre === fuente.nombre)
                    return (
                      <div className="ini-detalle-fila" key={fuente.nombre}>
                        <span className="ini-detalle-nombre">
                          <Icono size={16} strokeWidth={2.2} style={{ color }} aria-hidden="true" />
                          {fuente.nombre}
                        </span>
                        <span>{extra?.consumo || '—'}</span>
                        <span>{extra?.factor || '—'}</span>
                        <span>{formato(Number(fuente.total) / 1000, 2)} t CO₂e</span>
                        <span className="ini-detalle-pct">
                          <i>
                            <b style={{ width: `${Math.min(fuente.valor, 100)}%`, background: fuente.color }} />
                          </i>
                          <b>{fuente.valor}%</b>
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="ini-panel-vacio">Todavía no hay fuentes para este periodo.</p>
              )}
            </article>

            <article className="ini-tarjeta ini-recomendacion">
              <header>
                <h2>
                  <Lightbulb size={17} strokeWidth={2.3} aria-hidden="true" />
                  Recomendaciones
                </h2>
                <Link to="/calculos">Ver más →</Link>
              </header>
              <div className="ini-recomendacion-cuerpo">
                <img src={plantula} alt="" />
                <div className="ini-recomendacion-texto">
                  <h3>{accion?.estrategia || 'Reduce tu consumo eléctrico'}</h3>
                  <p>
                    {accion?.indicador ||
                      'Apaga los dispositivos cuando no los uses y opta por energías renovables.'}
                  </p>
                  <Link className="ini-recomendacion-boton" to="/calculos">
                    Saber más →
                  </Link>
                </div>
              </div>
            </article>
          </section>
        </main>
      </div>

      {aviso ? (
        <div className="ini-aviso" role="status" aria-live="polite">
          {aviso}
        </div>
      ) : null}
    </div>
  )
}

/** Pantalla de inicio. El carbono sale del último cálculo guardado. */
export default function Inicio() {
  return <InicioContenido />
}