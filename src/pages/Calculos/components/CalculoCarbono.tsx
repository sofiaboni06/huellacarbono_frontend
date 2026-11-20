import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  FileDown,
  FileText,
  Info,
  RotateCcw,
} from 'lucide-react'
import Button from '../../../components/common/Button'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { ErrorApi } from '../../../services/api'
import {
  calcularCarbono,
  listarOrganizacionesCalculo,
  listarReduccion,
  obtenerInformeCarbono,
  opcionesCalculo,
} from '../../../services/calculosService'
import type {
  AccionReduccion,
  CalculoCarbono as Resultado,
  PeriodoCalculo,
  VersionCalculo,
} from '../../../services/calculosService'
import { lineasInforme } from '../../../utils/informeCarbono'
import { crearPdf, descargarArchivo } from '../../../utils/generarPdf'
import type { Organizacion } from '../../../services/organizacionesService'
import PapelesCarbono from './PapelesCarbono'

type PasoCarbono = 1 | 2 | 3 | 4

const PASOS: { n: PasoCarbono; titulo: string; detalle: string; nota: string }[] = [
  {
    n: 1,
    titulo: 'Empresa y periodo',
    detalle: 'Elige a quién y qué mes medir',
    nota: 'De acuerdo con la guía, el inventario empieza por el objetivo y el alcance: qué organización se mide (límite organizacional) y en qué periodo (límite temporal).',
  },
  {
    n: 2,
    titulo: 'Consumos del mes',
    detalle: 'Carga las facturas o soportes',
    nota: 'De acuerdo con la guía, cada fila es un dato de actividad: cantidad, unidad, fuente y alcance. El alcance 1 es directo, el 2 es energía adquirida y el 3 es la cadena de valor. La factura o el soporte queda como evidencia.',
  },
  {
    n: 3,
    titulo: 'Metodología y cálculo',
    detalle: 'Aplica factores y calcula',
    nota: 'De acuerdo con la guía, las emisiones salen de dato de actividad × factor de emisión de la metodología elegida, ya en kg CO₂e. Esa versión trae el factor vigente de cada fuente y unidad. Si indicas las unidades producidas, el total también se expresa como intensidad por unidad funcional.',
  },
  {
    n: 4,
    titulo: 'Resultado y plan',
    detalle: 'Revisa el CO₂e y descarga PDF',
    nota: 'De acuerdo con la guía, el total se consolida en kg CO₂e y toneladas, se clasifica por fuente y alcance, y las fuentes que más aportan alimentan el plan de reducción y el informe.',
  },
]

function PlanReduccion({
  calculoId,
  acciones,
}: {
  calculoId: string
  acciones: AccionReduccion[]
}) {
  const avisar = useAviso()

  async function descargar() {
    try {
      const informe = await obtenerInformeCarbono(calculoId)
      const blob = crearPdf(lineasInforme(informe), 'HuellaVerde · Informe de huella de carbono.')
      descargarArchivo(`informe-carbono-${calculoId}.pdf`, blob)
      avisar('Informe PDF descargado.')
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo armar el informe.')
    }
  }

  return (
    <div className="cal-carbono-resultado">
      <header className="cal-bloque-cabecera">
        <h3>Plan de reducción de emisiones</h3>
        <p>
          {acciones.length
            ? 'El sistema armó estas acciones con las fuentes que más aportan a la huella. Ya quedan incluidas en el informe PDF.'
            : 'No hay recomendaciones porque ninguna fuente entró en la suma. Elige la metodología que tiene factores para estos consumos y vuelve a calcular.'}
        </p>
      </header>

      {acciones.length ? (
        <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla cal-plan-tabla">
            <thead>
              <tr>
                <th>Fuente</th>
                <th>Estrategia</th>
                <th>Indicador</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {acciones.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.fuenteNombre || 'Fuente'}</td>
                  <td>{fila.estrategia}</td>
                  <td>{fila.indicador}</td>
                  <td>{fila.meta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="cal-papeles-acciones">
        <Button variante="contorno" onClick={() => void descargar()} disabled={!acciones.length}>
          <FileDown size={15} strokeWidth={2.3} aria-hidden="true" />
          Descargar informe PDF
        </Button>
      </div>
    </div>
  )
}

export default function CalculoCarbono() {
  const avisar = useAviso()
  const [paso, setPaso] = useState<PasoCarbono>(1)
  const [verGuia, setVerGuia] = useState(false)

  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [periodos, setPeriodos] = useState<PeriodoCalculo[]>([])
  const [versiones, setVersiones] = useState<VersionCalculo[]>([])
  const [cargandoOpciones, setCargandoOpciones] = useState(false)

  const [organizacionId, setOrganizacionId] = useState('')
  const [periodoId, setPeriodoId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [unidades, setUnidades] = useState('')
  const [unidadFuncional, setUnidadFuncional] = useState('')

  const [registrosActivos, setRegistrosActivos] = useState<number | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [acciones, setAcciones] = useState<AccionReduccion[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    void listarOrganizacionesCalculo()
      .then(setOrganizaciones)
      .catch((error: unknown) => {
        avisar(error instanceof ErrorApi ? error.message : 'No se pudieron cargar las organizaciones.')
      })
  }, [avisar])

  useEffect(() => {
    if (!organizacionId) return
    let activo = true
    void opcionesCalculo(organizacionId)
      .then((opciones) => {
        if (!activo) return
        setPeriodos(opciones.periodos)
        setVersiones(opciones.versiones)
        if (opciones.versiones.length === 1) {
          setVersionId(opciones.versiones[0].id)
        }
      })
      .catch((error: unknown) => {
        if (activo) avisar(error instanceof ErrorApi ? error.message : 'No se pudieron cargar los periodos.')
      })
      .finally(() => {
        if (activo) setCargandoOpciones(false)
      })
    return () => {
      activo = false
    }
  }, [organizacionId, avisar])

  function seleccionarOrganizacion(id: string) {
    setOrganizacionId(id)
    setPeriodoId('')
    setVersionId('')
    setResultado(null)
    setAcciones([])
    setRegistrosActivos(null)
    setPeriodos([])
    setVersiones([])
    setCargandoOpciones(Boolean(id))
  }

  const organizacionActual = useMemo(
    () => organizaciones.find((item) => item.id === organizacionId) ?? null,
    [organizaciones, organizacionId],
  )
  const periodoActual = useMemo(
    () => periodos.find((item) => item.id === periodoId) ?? null,
    [periodos, periodoId],
  )
  const versionActual = useMemo(
    () => versiones.find((item) => item.id === versionId) ?? null,
    [versiones, versionId],
  )

  const alCambiarPapeles = useCallback((cantidad: number) => {
    setRegistrosActivos(cantidad)
  }, [])

  const paso1Completo = Boolean(organizacionId && periodoId)
  const paso2Desbloqueado = paso1Completo
  const paso3Desbloqueado = paso1Completo
  const paso4Desbloqueado = Boolean(resultado)

  function puedeIrAPaso(destino: PasoCarbono): boolean {
    if (destino === 1) return true
    if (destino === 2) return paso2Desbloqueado
    if (destino === 3) return paso3Desbloqueado
    return paso4Desbloqueado
  }

  async function calcular() {
    const producidas = unidades.trim()
    const funcional = unidadFuncional.trim()
    const cantidadValida = producidas !== '' && Number(producidas) > 0
    const enviaIntensidad = cantidadValida && funcional !== ''
    const avisoIntensidad = enviaIntensidad
      ? ''
      : producidas === '' && funcional === ''
        ? ' No escribiste las unidades producidas: el total sí quedó, y la intensidad no, porque ese dato es opcional.'
        : ' Para la intensidad hacen falta la cantidad y el nombre, por ejemplo 10000 empaques. El total sí se calculó.'
    setCargando(true)
    try {
      const calculo = await calcularCarbono({
        organizacionId,
        periodoId,
        versionId,
        unidadesProducidas: enviaIntensidad ? producidas : undefined,
        unidadFuncional: enviaIntensidad ? funcional : undefined,
      })
      setResultado(calculo)
      setAcciones(await listarReduccion(calculo.id))
      setPaso(4)
      avisar(
        calculo.totalCo2e
          ? `Resultado: ${calculo.totalCo2e} ${calculo.unidadResultado}${calculo.toneladasCo2e ? `, ${calculo.toneladasCo2e} t CO2e` : ''}.${avisoIntensidad}`
          : `El cálculo se guardó. Revisa las filas que no entraron en la suma.${avisoIntensidad}`,
      )
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo calcular.')
    } finally {
      setCargando(false)
    }
  }

  function reiniciar() {
    setPaso(1)
    setOrganizacionId('')
    setPeriodoId('')
    setVersionId('')
    setUnidades('')
    setUnidadFuncional('')
    setRegistrosActivos(null)
    setResultado(null)
    setAcciones([])
  }

  return (
    <div className="cal-carbono">
      {/* Barra compacta de guía rápida + ejemplo plegable (no obstruye el formulario) */}
      <section className="vst-tarjeta cal-guia-barra" aria-label="Guía rápida del cálculo">
        <div className="cal-guia-barra-fila">
          <div className="cal-guia-barra-texto">
            <BookOpen size={17} strokeWidth={2.2} aria-hidden="true" />
            <span>
              <strong>¿Primera vez calculando?</strong> Sigue los 4 pasos en orden. El recorrido está armado de acuerdo con las{' '}
              <Link to="/guias">guías de cálculo</Link>.
            </span>
          </div>
          <Button
            variante="contorno"
            className="cal-btn-compacto"
            aria-expanded={verGuia}
            onClick={() => setVerGuia((estado) => !estado)}
          >
            {verGuia ? 'Ocultar guía y ejemplo' : 'Ver guía y ejemplo'}
            {verGuia ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
          </Button>
        </div>

        {verGuia ? (
          <div className="cal-guia-contenido">
            <ol className="cal-guia-pasos">
              {PASOS.map((item) => (
                <li key={item.n}>
                  <span className="cal-guia-num">{item.n}</span>
                  <div>
                    <strong>{item.titulo}</strong>
                    <span>{item.detalle}</span>
                  </div>
                </li>
              ))}
            </ol>

            <div className="cal-guia-ejemplo">
              <p className="cal-ayuda">
                <strong>Ejemplo de referencia (Fábrica de Empaques · enero 2026 · GHG Protocol 2026):</strong>{' '}
                el cálculo debe dar <strong>1090.8 kg CO₂e</strong> (<strong>1.0908 t CO₂e</strong>). Con{' '}
                <strong>10000 empaques</strong>, la intensidad es <strong>0.10908 kg CO₂e/empaque</strong>.
                El lote de «Empaque de cartón» da <strong>130 kg CO₂e</strong> y{' '}
                <strong>0.13 kg CO₂e/empaque</strong>.
              </p>
              <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
                <table className="cal-historial-tabla">
                  <thead>
                    <tr>
                      <th>Consumo</th>
                      <th>Cantidad</th>
                      <th>Factor</th>
                      <th>Alcance</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Consumo eléctrico</td>
                      <td className="cal-num">2500 kWh</td>
                      <td className="cal-num">0.20</td>
                      <td>Alcance 2</td>
                      <td className="cal-resultado cal-num">500 kg CO₂e</td>
                    </tr>
                    <tr>
                      <td>Gasolina de vehículos propios</td>
                      <td className="cal-num">180 L</td>
                      <td className="cal-num">2.31</td>
                      <td>Alcance 1</td>
                      <td className="cal-resultado cal-num">415.8 kg CO₂e</td>
                    </tr>
                    <tr>
                      <td>Residuos orgánicos</td>
                      <td className="cal-num">350 kg</td>
                      <td className="cal-num">0.50</td>
                      <td>Alcance 3</td>
                      <td className="cal-resultado cal-num">175 kg CO₂e</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Tarjeta principal con asistente paso a paso */}
      <section className="vst-tarjeta cal-form-principal" aria-label="Asistente de huella de carbono">
        <ol className="cal-pasos cal-pasos--carbono" aria-label="Progreso del cálculo de carbono">
          {PASOS.map((item, indice) => {
            const completado =
              (item.n === 1 && paso1Completo && paso > 1) ||
              (item.n === 2 && (registrosActivos ?? 0) > 0 && paso > 2) ||
              (item.n === 3 && Boolean(resultado) && paso > 3)
            const estado = completado ? 'hecho' : item.n === paso ? 'activo' : 'pendiente'
            const habilitado = puedeIrAPaso(item.n)

            return (
              <li key={item.n} className={`cal-paso ${estado}`}>
                <button
                  type="button"
                  className="cal-paso-boton"
                  disabled={!habilitado}
                  aria-current={item.n === paso ? 'step' : undefined}
                  onClick={() => {
                    if (habilitado) setPaso(item.n)
                  }}
                >
                  <span className="cal-paso-numero">
                    {completado ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : item.n}
                  </span>
                  <span className="cal-paso-etiqueta">{item.titulo}</span>
                </button>
                {indice < PASOS.length - 1 ? (
                  <span className={`cal-conector ${completado ? 'hecho' : ''}`} aria-hidden="true" />
                ) : null}
              </li>
            )
          })}
        </ol>

        {/* Franja de contexto activo para no perder de vista qué se está calculando */}
        {paso > 1 && organizacionActual && periodoActual ? (
          <div className="cal-contexto" aria-label="Resumen de selección actual">
            <span className="cal-contexto-chip">
              <Building2 size={14} aria-hidden="true" />
              {organizacionActual.nombre}
            </span>
            <span className="cal-contexto-chip">
              Periodo: <strong>{periodoActual.nombre}</strong>
            </span>
            {registrosActivos !== null ? (
              <span className="cal-contexto-chip">
                <FileText size={14} aria-hidden="true" />
                {registrosActivos} {registrosActivos === 1 ? 'registro activo' : 'registros activos'}
              </span>
            ) : null}
            {versionActual ? (
              <span className="cal-contexto-chip">
                <Calculator size={14} aria-hidden="true" />
                {versionActual.metodologiaNombre} {versionActual.numeroVersion}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* PASO 1: Empresa y periodo */}
        {paso === 1 ? (
          <div className="cal-seccion">
            <header className="cal-bloque-cabecera">
              <h2>Paso 1 · Selecciona empresa y periodo</h2>
              <p>
                Elige la organización y el mes o periodo que vas a medir. Luego pasarás a cargar o revisar sus consumos.
              </p>
            </header>
            <p className="cal-nota-guia">{PASOS[0].nota}</p>

            <div className="cal-carbono-campos cal-carbono-campos--dos">
              <div className="vst-campo">
                <label htmlFor="cal-org">Organización *</label>
                <select
                  id="cal-org"
                  className="vst-select"
                  value={organizacionId}
                  onChange={(evento) => seleccionarOrganizacion(evento.target.value)}
                >
                  <option value="">Selecciona una organización</option>
                  {organizaciones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="vst-campo">
                <label htmlFor="cal-periodo">Periodo de medición *</label>
                <select
                  id="cal-periodo"
                  className="vst-select"
                  value={periodoId}
                  onChange={(evento) => {
                    setPeriodoId(evento.target.value)
                    setResultado(null)
                    setAcciones([])
                  }}
                  disabled={!organizacionId || cargandoOpciones}
                >
                  <option value="">
                    {!organizacionId
                      ? 'Primero elige una organización'
                      : cargandoOpciones
                        ? 'Cargando periodos…'
                        : periodos.length
                          ? 'Selecciona un periodo'
                          : 'Sin periodos disponibles'}
                  </option>
                  {periodos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} ({item.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {organizacionId && !cargandoOpciones && periodos.length === 0 ? (
              <div className="cal-aviso-caja cal-aviso-caja--alerta">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>
                  Esta organización aún no tiene periodos configurados. Créalos en{' '}
                  <strong>Gestión → Organizaciones</strong> antes de continuar.
                </span>
              </div>
            ) : null}

            {periodoActual ? (
              <div className="cal-resumen-paso">
                <Info size={17} aria-hidden="true" />
                <div>
                  <strong>
                    {organizacionActual?.nombre} · {periodoActual.nombre}
                  </strong>
                  <span>
                    Vigencia: {periodoActual.fechaInicio} a {periodoActual.fechaFin} · Estado:{' '}
                    {periodoActual.estado === 'ABIERTO'
                      ? 'Abierto (recibe nuevos consumos)'
                      : 'Cerrado (solo lectura para calcular)'}
                    {' · '}
                    {versiones.length}{' '}
                    {versiones.length === 1 ? 'metodología disponible' : 'metodologías disponibles'}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="cal-acciones">
              <Button
                variante="primario"
                disabled={!paso1Completo}
                onClick={() => setPaso(2)}
              >
                Continuar a consumos del mes
                <ArrowRight size={15} strokeWidth={2.3} aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* PASO 2: Registros de consumo (Papeles) */}
        {paso === 2 && organizacionId && periodoId ? (
          <div className="cal-seccion">
            <p className="cal-nota-guia">{PASOS[1].nota}</p>
            <PapelesCarbono
              key={`${organizacionId}-${periodoId}`}
              organizacionId={organizacionId}
              periodoId={periodoId}
              abierto={periodoActual?.estado === 'ABIERTO'}
              onPapelesCambio={alCambiarPapeles}
            />

            <div className="cal-acciones cal-acciones--entre">
              <Button variante="contorno" onClick={() => setPaso(1)}>
                <ArrowLeft size={15} strokeWidth={2.3} aria-hidden="true" />
                Cambiar empresa o periodo
              </Button>

              <div className="cal-acciones-grupo">
                {registrosActivos === 0 ? (
                  <span className="cal-ayuda-inline">
                    Agrega al menos 1 registro para calcular emisiones.
                  </span>
                ) : null}
                <Button
                  variante="primario"
                  disabled={registrosActivos === 0}
                  onClick={() => setPaso(3)}
                >
                  Continuar a metodología y cálculo
                  <ArrowRight size={15} strokeWidth={2.3} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* PASO 3: Metodología y cálculo */}
        {paso === 3 ? (
          <div className="cal-seccion">
            <header className="cal-bloque-cabecera">
              <h2>Paso 3 · Metodología y cálculo</h2>
              <p>
                Selecciona la metodología con los factores de emisión. Las unidades producidas son opcionales: si las escribes, sale la intensidad; si las dejas vacías, el total se calcula igual.
              </p>
            </header>
            <p className="cal-nota-guia cal-nota-guia--formula">{PASOS[2].nota}</p>

            <div className="cal-carbono-campos">
              <div className="vst-campo">
                <label htmlFor="cal-version">Metodología de cálculo *</label>
                <select
                  id="cal-version"
                  className="vst-select"
                  value={versionId}
                  onChange={(evento) => setVersionId(evento.target.value)}
                  disabled={!organizacionId || versiones.length === 0}
                >
                  <option value="">
                    {versiones.length ? 'Selecciona una metodología' : 'Sin versiones disponibles'}
                  </option>
                  {versiones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.metodologiaNombre} {item.numeroVersion}
                    </option>
                  ))}
                </select>
              </div>

              <div className="vst-campo">
                <label htmlFor="cal-unidades">Unidades producidas (opcional)</label>
                <input
                  id="cal-unidades"
                  className="vst-input"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={unidades}
                  onChange={(evento) => setUnidades(evento.target.value)}
                  placeholder="Ej. 10000"
                />
              </div>

              <div className="vst-campo">
                <label htmlFor="cal-unidad-funcional">Unidad funcional (opcional)</label>
                <input
                  id="cal-unidad-funcional"
                  className="vst-input"
                  value={unidadFuncional}
                  onChange={(evento) => setUnidadFuncional(evento.target.value)}
                  placeholder="Ej. empaques"
                />
              </div>
            </div>

            {versiones.length === 0 ? (
              <div className="cal-aviso-caja cal-aviso-caja--alerta">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>
                  No hay versiones de metodología activas para esta organización. Configúralas en{' '}
                  <strong>Gestión → Catálogos</strong>.
                </span>
              </div>
            ) : null}

            <div className="cal-acciones cal-acciones--entre">
              <Button variante="contorno" onClick={() => setPaso(2)}>
                <ArrowLeft size={15} strokeWidth={2.3} aria-hidden="true" />
                Volver a consumos
              </Button>

              <Button
                variante="primario"
                onClick={() => void calcular()}
                disabled={cargando || !organizacionId || !periodoId || !versionId}
              >
                <Calculator size={15} strokeWidth={2.3} aria-hidden="true" />
                {cargando ? 'Calculando…' : 'Calcular huella de carbono'}
              </Button>
            </div>
          </div>
        ) : null}

        {/* PASO 4: Resultados y plan de reducción */}
        {paso === 4 && resultado ? (
          <div className="cal-seccion">
            <div className="cal-resultado">
              <span className="cal-resultado-icono" aria-hidden="true">
                <Check size={22} strokeWidth={3} />
              </span>
              <div>
                <p className="cal-resultado-etiqueta">Cálculo de carbono completado</p>
                <h2 className="cal-resultado-titulo">
                  {resultado.organizacionNombre} · {resultado.periodoNombre}
                </h2>
              </div>
              <p className="cal-resultado-valor">
                {resultado.totalCo2e || '0'} {resultado.unidadResultado}
              </p>
            </div>

            <p className="cal-nota-guia">{PASOS[3].nota}</p>

            <dl className="cal-indicadores">
              <div className="cal-indicador">
                <dt>Equivalente en toneladas</dt>
                <dd className="cal-num">
                  {resultado.toneladasCo2e ? `${resultado.toneladasCo2e} t CO₂e` : '—'}
                </dd>
              </div>
              <div className="cal-indicador">
                <dt>Intensidad por unidad</dt>
                <dd className="cal-num">
                  {resultado.intensidadCo2e
                    ? `${resultado.intensidadCo2e} kg/${resultado.unidadFuncional || 'unidad'}`
                    : 'Sin dato: no escribiste las unidades producidas'}
                </dd>
              </div>
              <div className="cal-indicador">
                <dt>Metodología aplicada</dt>
                <dd>
                  {resultado.metodologiaNombre} {resultado.numeroVersion}
                </dd>
              </div>
              <div className="cal-indicador">
                <dt>Fuentes calculadas</dt>
                <dd className="cal-num">{resultado.lineas.length}</dd>
              </div>
            </dl>

            {resultado.observacion ? (
              <div className="cal-aviso-caja">
                <Info size={17} aria-hidden="true" />
                <span>{resultado.observacion}</span>
              </div>
            ) : null}

            {resultado.omitidos.length ? (
              <div className="cal-aviso-caja cal-aviso-caja--alerta">
                <AlertTriangle size={18} aria-hidden="true" />
                <div>
                  <strong>Registros omitidos en el cálculo ({resultado.omitidos.length})</strong>
                  <ul className="cal-omitidos">
                    {resultado.omitidos.map((fila) => (
                      <li key={fila.datoId}>
                        {fila.actividadNombre} ({fila.cantidad} {fila.unidadSimbolo} · {fila.fuenteNombre}):{' '}
                        {fila.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            <div className="cal-bloque-tabla">
              <h3 className="cal-subtitulo">Desglose de emisiones</h3>
              <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
                <table className="cal-historial-tabla">
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>Proceso</th>
                      <th>Alcance</th>
                      <th>Fuente</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.lineas.map((linea) => (
                      <tr key={linea.id}>
                        <td>{linea.actividadNombre}</td>
                        <td>{linea.procesoNombre || '—'}</td>
                        <td>{linea.alcanceNombre || linea.alcanceCodigo}</td>
                        <td>{linea.fuenteNombre}</td>
                        <td className="cal-resultado cal-num">
                          {linea.valorCo2e} {linea.unidad}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <PlanReduccion key={resultado.id} calculoId={resultado.id} acciones={acciones} />

            <div className="cal-acciones cal-acciones--entre">
              <Button variante="contorno" onClick={() => setPaso(3)}>
                <ArrowLeft size={15} strokeWidth={2.3} aria-hidden="true" />
                Ajustar metodología o producción
              </Button>

              <Button variante="contorno" onClick={reiniciar}>
                <RotateCcw size={15} strokeWidth={2.3} aria-hidden="true" />
                Iniciar nuevo cálculo
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
