import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileText, Info, Plus, Trash2 } from 'lucide-react'
import Button from '../../../components/common/Button'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { ErrorApi } from '../../../services/api'
import { consultarCoberturaFactores, factoresDisponibles } from '../../../services/calculosService'
import { clasificarFactores, mensajeFactores } from '../clasificacionFactores'
import EquivalenciaUnidad from './EquivalenciaUnidad'
import type { CoberturaFuenteFecha, FactorDisponible } from '../../../services/calculosService'
import type { CalculoCarbono as ResultadoCalculo } from '../../../services/calculosService'
import {
  conversionPersistida,
  crearPapel,
  listarPapeles,
  opcionesPapel,
  rechazarPapel,
} from '../../../services/papelesService'
import type {
  EstadoMetodologico,
  FuentePapel,
  OpcionesPapel,
  PapelCarbono,
  ParametrosCalculo,
} from '../../../services/papelesService'
import { listarUnidades } from '../../../services/unidadesMedidaService'

interface Props {
  organizacionId: string
  periodoId: string
  fechaInicio: string
  fechaFin: string
  abierto: boolean
  versionId: string
  versionNombre: string
  /** Último resultado persistido; sus conversiones provienen del factor aplicado. */
  resultadoTrazable?: ResultadoCalculo | null
  errorConsultaTraza?: boolean
  onPapelesCambio?: (cantidadActivos: number) => void
}

const VACIO = {
  alcanceId: '',
  actividadEmisionId: '',
  subcategoriaId: '',
  fuenteId: '',
  actividadId: '',
  unidadId: '',
  cantidad: '',
  fechaDato: '',
  documento: '',
  observacion: '',
}

const PARAMETROS_VACIOS = {
  consumoEspecifico: '',
  unidadConsumoId: '',
  unidadDistanciaId: '',
  densidad: '',
  unidadDensidadId: '',
  poderCalorifico: '',
  unidadPoderCalorificoId: '',
  purezaProducto: '',
  tipoCarbonato: '',
  tipoPlantaNitrica: '',
  abatimiento: '',
  purezaAcido: '',
  purezaCarbonato: '',
  tipoProcesoAcero: '',
  combustible: '',
  fraccionBiocombustible: '',
  procesoAmoniaco: '',
  recuperacionCo2: '',
  ureaProducida: '',
  co2Recuperado: '',
}

type Formulario = typeof VACIO
type Parametros = typeof PARAMETROS_VACIOS

/** Formatos exactos que valida el backend (dato_actividad_carbono validator). */
const RE_CANTIDAD = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/
const RE_PARAMETRO = /^(?:0|[1-9]\d{0,11})(?:\.\d{1,12})?$/
const RE_CONSUMO = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,12})?$/
const RE_FRACCION = /^(?:0?\.\d{1,12}|1(?:\.0{1,12})?)$/
/** Fracción de biocombustible en una mezcla: 0 ≤ x < 1. */
const RE_FRACCION_BIO = /^(?:0(?:\.\d{1,12})?|\.\d{1,12})$/

/** IPCC 2006 Vol. 3 Cap. 3 Tabla 3.1 (A3-11). */
const PROCESOS_AMONIACO = [
  { valor: 'EU_REFORMADO_CONVENCIONAL_GN', texto: 'Planta moderna – reformado convencional, gas natural (1,694 t CO₂/t)' },
  { valor: 'EU_REFORMADO_EXCESO_AIRE_GN', texto: 'Planta moderna – reformado con exceso de aire, gas natural (1,666 t CO₂/t)' },
  { valor: 'EU_REFORMADO_AUTOTERMICO_GN', texto: 'Planta moderna – reformado autotérmico, gas natural (1,694 t CO₂/t)' },
  { valor: 'EU_OXIDACION_PARCIAL', texto: 'Planta moderna – oxidación parcial (2,772 t CO₂/t)' },
  { valor: 'PROMEDIO_GN', texto: 'Promedio – gas natural, plantas modernas y antiguas (2,104 t CO₂/t)' },
  {
    valor: 'PROMEDIO_OXIDACION_PARCIAL',
    texto: 'Promedio – oxidación parcial; usar si no se conoce el proceso (3,273 t CO₂/t)',
  },
]

const PROCESOS_ACERO = [
  { valor: 'BOF', texto: 'Convertidor básico al oxígeno (BOF)' },
  { valor: 'EAF_CHATARRA', texto: 'Horno de arco eléctrico con chatarra (EAF)' },
  { valor: 'OHF', texto: 'Horno de hogar abierto (OHF)' },
]

const ESTADOS_FUENTE: Record<EstadoMetodologico, { texto: string; calcula: boolean }> = {
  EJECUTABLE: { texto: 'Método implementado', calcula: true },
  PENDIENTE_DATOS: { texto: 'Pendiente de datos', calcula: false },
  PENDIENTE_METODOLOGIA: { texto: 'Pendiente de metodología', calcula: false },
  PENDIENTE_DECISION: { texto: 'Pendiente de decisión técnica', calcula: false },
  NO_APLICA: { texto: 'No aplica', calcula: false },
  BLOQUEADA: { texto: 'Bloqueada', calcula: false },
}

const PLANTAS_NITRICAS = [
  { valor: 'L_L', texto: 'Baja presión (L/L)' },
  { valor: 'L_M', texto: 'Combinada baja/media (L/M)' },
  { valor: 'M_M', texto: 'Media presión (M/M)' },
  { valor: 'M_H', texto: 'Combinada media/alta (M/H)' },
  { valor: 'H_H', texto: 'Alta presión (H/H)' },
]

/** Magnitudes entre las que el backend puede convertir con densidad o poder calorífico. */
const MAGNITUDES_ENERGETICAS = ['masa', 'volumen', 'energia', 'volumen estandar de gas']

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

function etiquetaEstado(estado: string): { texto: string; clase: string } {
  const normalizado = estado.toUpperCase()
  if (normalizado === 'RECHAZADO') return { texto: 'Quitado', clase: 'revision' }
  if (normalizado === 'VALIDADO' || normalizado === 'ACTIVO' || normalizado === 'APROBADO') {
    return { texto: 'Validado', clase: 'ok' }
  }
  return { texto: estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase(), clase: 'ok' }
}

function estadoFuente(fuente: FuentePapel | undefined) {
  if (!fuente?.requisitos) return null
  const estado = ESTADOS_FUENTE[fuente.requisitos.estado] ?? null
  return estado
}

type EstadoFactores =
  | { tipo: 'sin-version' }
  | { tipo: 'cargando' }
  | { tipo: 'listo'; factores: FactorDisponible[] }
  | { tipo: 'no-disponible' }

export default function PapelesCarbono({
  organizacionId,
  periodoId,
  fechaInicio,
  fechaFin,
  abierto,
  versionId,
  versionNombre,
  resultadoTrazable = null,
  errorConsultaTraza = false,
  onPapelesCambio,
}: Props) {
  const avisar = useAviso()
  const [opciones, setOpciones] = useState<OpcionesPapel | null>(null)
  const [errorOpciones, setErrorOpciones] = useState('')
  /** id de unidad → magnitud normalizada; `null` si el usuario no puede consultar unidades. */
  const [magnitudes, setMagnitudes] = useState<Map<string, string> | null>(null)
  const [papeles, setPapeles] = useState<PapelCarbono[]>([])
  const [formulario, setFormulario] = useState<Formulario>(VACIO)
  const [parametros, setParametros] = useState<Parametros>(PARAMETROS_VACIOS)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [cargandoLista, setCargandoLista] = useState(true)
  const [factores, setFactores] = useState<EstadoFactores>({ tipo: 'sin-version' })
  const [coberturaFuente, setCoberturaFuente] = useState<CoberturaFuenteFecha | null>(null)
  const [cargandoCobertura, setCargandoCobertura] = useState(false)
  const [errorCobertura, setErrorCobertura] = useState(false)
  /** Parámetros declarados por el backend para la fuente (camposParametros). */
  const [extras, setExtras] = useState<Record<string, string | boolean>>({})

  useEffect(() => {
    let activo = true
    void opcionesPapel(organizacionId)
      .then((datos) => {
        if (activo) setOpciones(datos)
      })
      .catch((error: unknown) => {
        if (!activo) return
        const mensaje =
          error instanceof ErrorApi ? error.message : 'No se pudieron cargar las listas del registro.'
        setErrorOpciones(mensaje)
        avisar(mensaje)
      })
    void listarUnidades()
      .then((lista) => {
        if (!activo) return
        setMagnitudes(new Map(lista.map((unidad) => [String(unidad.id), normalizar(unidad.magnitude ?? '')])))
      })
      .catch(() => {
        // Sin permiso unidad_medida.ver: el formulario muestra todas las unidades
        // y el backend valida la compatibilidad al calcular.
        if (activo) setMagnitudes(null)
      })
    return () => {
      activo = false
    }
  }, [organizacionId, avisar])

  useEffect(() => {
    let activo = true
    void listarPapeles(organizacionId, periodoId)
      .then((lista) => {
        if (!activo) return
        setPapeles(lista)
        onPapelesCambio?.(lista.filter((item) => item.estadoRegistro !== 'RECHAZADO').length)
      })
      .catch((error: unknown) => {
        if (activo) {
          avisar(error instanceof ErrorApi ? error.message : 'No se pudieron cargar los registros del periodo.')
        }
      })
      .finally(() => {
        if (activo) setCargandoLista(false)
      })
    return () => {
      activo = false
    }
  }, [organizacionId, periodoId, avisar, onPapelesCambio])

  // Factores de la fuente en la metodología elegida: solo orientan la unidad.
  useEffect(() => {
    if (!formulario.fuenteId || !versionId) return
    let activo = true
    void factoresDisponibles(versionId, formulario.fuenteId)
      .then((lista) => {
        if (activo) setFactores({ tipo: 'listo', factores: lista })
      })
      .catch(() => {
        if (activo) setFactores({ tipo: 'no-disponible' })
      })
    return () => {
      activo = false
    }
  }, [formulario.fuenteId, versionId])

  /* ---------- Cascada alcance → actividad → subcategoría → fuente ---------- */

  const actividadesDelAlcance = useMemo(
    () => (opciones?.actividadesEmision ?? []).filter((item) => item.alcanceId === formulario.alcanceId),
    [opciones, formulario.alcanceId],
  )
  const actividadEmision = useMemo(
    () => opciones?.actividadesEmision.find((item) => item.id === formulario.actividadEmisionId),
    [opciones, formulario.actividadEmisionId],
  )
  const vinculosActividad = useMemo(
    () => (opciones?.vinculos ?? []).filter((item) => item.actividadEmisionId === formulario.actividadEmisionId),
    [opciones, formulario.actividadEmisionId],
  )
  const subcategorias = useMemo(
    () =>
      (opciones?.subcategorias ?? []).filter(
        (item) =>
          item.actividadEmisionId === formulario.actividadEmisionId &&
          vinculosActividad.some((vinculo) => vinculo.subcategoriaEmisionId === item.id),
      ),
    [opciones, formulario.actividadEmisionId, vinculosActividad],
  )
  const hayFuentesGenerales = vinculosActividad.some((item) => !item.subcategoriaEmisionId)
  const subcategoriaObligatoria = subcategorias.length > 0 && !hayFuentesGenerales
  const fuentesDisponibles = useMemo(
    () =>
      (opciones?.fuentes ?? []).filter((fuente) =>
        vinculosActividad.some(
          (vinculo) =>
            vinculo.fuenteEmisionId === fuente.id &&
            vinculo.subcategoriaEmisionId === formulario.subcategoriaId,
        ),
      ),
    [opciones, vinculosActividad, formulario.subcategoriaId],
  )
  const fuente = opciones?.fuentes.find((item) => item.id === formulario.fuenteId)
  const estadoDeFuente = estadoFuente(fuente)
  const seleccion = fuente?.seleccionCombustible ?? null
  const opcionCombustible = seleccion?.opciones.find((item) => item.codigo === parametros.combustible) ?? null
  const esElectricidad = parametros.combustible === 'ELECTRICIDAD_SIN'
  const esMovil = actividadEmision?.codigo === 'A2' || seleccion?.aplicacion === 'MOVIL'
  const esCombustion = (actividadEmision?.codigo === 'A1' || esMovil || Boolean(seleccion)) && !esElectricidad

  useEffect(() => {
    if (!formulario.fuenteId || !fuente || !versionId || !fechaInicio || !fechaFin) {
      return
    }
    let activo = true
    const desde = formulario.fechaDato || fechaInicio
    const hasta = formulario.fechaDato || fechaFin
    setCargandoCobertura(true)
    setErrorCobertura(false)
    void consultarCoberturaFactores(versionId, desde, hasta, organizacionId)
      .then((filas) => {
        if (activo) setCoberturaFuente(filas.find((fila) => fila.fuenteCodigo === fuente.codigo) ?? null)
      })
      .catch((error: unknown) => {
        console.error('No fue posible consultar la cobertura preliminar de factores', error)
        if (activo) {
          setCoberturaFuente(null)
          setErrorCobertura(true)
        }
      })
      .finally(() => { if (activo) setCargandoCobertura(false) })
    return () => { activo = false }
  }, [formulario.fuenteId, formulario.fechaDato, fuente, versionId, fechaInicio, fechaFin, organizacionId])

  /* ---------- Unidades compatibles ---------- */

  const unidades = opciones?.unidades ?? []
  const magnitudDe = (id: string) => magnitudes?.get(id) ?? ''
  const unidadesPorMagnitud = (lista: string[]) =>
    magnitudes ? unidades.filter((item) => lista.includes(magnitudDe(item.id))) : unidades

  // Con combustible declarado, solo cuentan los factores de ese combustible (o sus componentes).
  const variantesElegidas = new Set(
    esElectricidad
      ? ['ELECTRICIDAD_SIN']
      : parametros.combustible === 'DIESEL_BIODIESEL'
        ? ['DIESEL', 'BIODIESEL_PALMA']
        : parametros.combustible === 'GASOLINA_ETANOL'
          ? ['GASOLINA_MOTOR', 'ETANOL_ANHIDRO']
          : [parametros.combustible],
  )
  const campos = fuente?.camposParametros ?? []
  const opcionFactor = typeof extras.opcionFactor === 'string' ? extras.opcionFactor : ''
  const opcionProceso = typeof extras.opcionProceso === 'string' ? extras.opcionProceso : ''
  // Con fecha del dato se evalúa esa fecha; sin ella, el periodo completo (igual que el motor).
  const referenciaVigencia = {
    desde: formulario.fechaDato || fechaInicio,
    hasta: formulario.fechaDato || fechaFin,
  }
  const referenciaTexto = formulario.fechaDato
    ? `la fecha del dato ${formulario.fechaDato}`
    : `el periodo completo ${fechaInicio} a ${fechaFin}`
  const clasificacion =
    versionId && factores.tipo === 'listo'
      ? clasificarFactores(
          factores.factores,
          referenciaVigencia,
          (item) =>
            (!seleccion || !parametros.combustible || variantesElegidas.has(item.variante)) &&
            (!opcionFactor || item.variante === opcionFactor) &&
            (!opcionProceso || item.variante.startsWith(`${opcionProceso}_`)),
        )
      : null
  // Solo los aprobados Y vigentes orientan las unidades; guardar no depende de ellos.
  const factoresAprobados = clasificacion?.aprobadosVigentes ?? []
  // Unidades de factores con vigencia compatible con la fecha o periodo del dato.
  const unidadesFactor = [
    ...new Map(
      factoresAprobados.map((item) => [
        item.unidadEntradaId,
        { id: item.unidadEntradaId, simbolo: item.unidadEntradaSimbolo },
      ]),
    ).values(),
  ]
  const magnitudesFactor = new Set(factoresAprobados.map((item) => magnitudDe(item.unidadEntradaId)).filter(Boolean))
  const filtrarUnidades = Boolean(magnitudes && magnitudesFactor.size)

  // Fuentes cuyo dato se registra en unidades vendidas y piden el consumo por unidad (C11-02).
  const porUnidadVendida = campos.some((campo) => campo.campo === 'unidadConsumoId')
  const unidadesDirectas = filtrarUnidades
    ? unidades.filter(
        (item) =>
          magnitudesFactor.has(magnitudDe(item.id)) || (porUnidadVendida && magnitudDe(item.id) === 'produccion'),
      )
    : unidades
  const unidadesConvertibles =
    filtrarUnidades && esCombustion && [...magnitudesFactor].some((m) => MAGNITUDES_ENERGETICAS.includes(m))
      ? unidades.filter((item) => {
          const magnitud = magnitudDe(item.id)
          return MAGNITUDES_ENERGETICAS.includes(magnitud) && !magnitudesFactor.has(magnitud)
        })
      : []
  const unidadesDistancia = filtrarUnidades && esMovil ? unidadesPorMagnitud(['distancia']) : []

  const magnitudElegida = magnitudDe(formulario.unidadId)
  const porDistancia = esMovil && magnitudElegida === 'distancia'
  const requiereConversion = unidadesConvertibles.some((item) => item.id === formulario.unidadId)

  /* ---------- Cambios con limpieza de dependientes ---------- */

  function cambiar(campo: keyof Formulario, valor: string) {
    setErrorGuardar('')
    setFormulario((actual) => {
      const siguiente = { ...actual, [campo]: valor }
      if (campo === 'alcanceId') {
        siguiente.actividadEmisionId = ''
        siguiente.subcategoriaId = ''
        siguiente.fuenteId = ''
        siguiente.unidadId = ''
      }
      if (campo === 'actividadEmisionId') {
        siguiente.subcategoriaId = ''
        siguiente.fuenteId = ''
        siguiente.unidadId = ''
      }
      if (campo === 'subcategoriaId') {
        siguiente.fuenteId = ''
        siguiente.unidadId = ''
      }
      if (campo === 'fuenteId') siguiente.unidadId = ''
      return siguiente
    })
    if (campo === 'fuenteId') {
      setFactores(valor && versionId ? { tipo: 'cargando' } : { tipo: 'sin-version' })
    }
    if (['alcanceId', 'actividadEmisionId', 'subcategoriaId', 'fuenteId'].includes(campo)) {
      const sugerido =
        campo === 'fuenteId'
          ? (opciones?.fuentes.find((item) => item.id === valor)?.seleccionCombustible?.sugerido ?? '')
          : ''
      setParametros({ ...PARAMETROS_VACIOS, combustible: sugerido })
      setExtras({})
    }
  }

  function cambiarExtra(campo: string, valor: string | boolean) {
    setErrorGuardar('')
    setExtras((actual) => ({ ...actual, [campo]: valor }))
    if (campo === 'opcionFactor' || campo === 'opcionProceso') {
      setFormulario((actual) => ({ ...actual, unidadId: '' }))
    }
  }

  function cambiarParametro(campo: keyof Parametros, valor: string) {
    setErrorGuardar('')
    setParametros((actual) => ({ ...actual, [campo]: valor }))
    // Cambiar de combustible puede cambiar la unidad del factor.
    if (campo === 'combustible') setFormulario((actual) => ({ ...actual, unidadId: '' }))
  }

  /* ---------- Validación ---------- */

  function validar(): string {
    if (!formulario.alcanceId) return 'Selecciona el alcance.'
    if (!formulario.actividadEmisionId) return 'Selecciona la actividad de emisión.'
    if (subcategoriaObligatoria && !formulario.subcategoriaId) return 'Selecciona la subcategoría.'
    if (!formulario.fuenteId) return 'Selecciona la fuente de emisión.'
    if (!formulario.actividadId) return 'Selecciona la actividad o proceso de la organización.'
    if (!formulario.cantidad.trim()) return 'Indica la cantidad consumida.'
    if (!RE_CANTIDAD.test(formulario.cantidad.trim())) {
      return 'La cantidad debe ser un número con punto decimal y máximo 8 decimales (ej. 2500.5).'
    }
    if (!/[1-9]/.test(formulario.cantidad)) return 'La cantidad debe ser mayor que cero.'
    if (!formulario.unidadId) return 'Selecciona la unidad del dato.'
    if (formulario.fechaDato && (formulario.fechaDato < fechaInicio || formulario.fechaDato > fechaFin)) {
      return `La fecha del dato debe estar entre ${fechaInicio} y ${fechaFin}.`
    }

    if (porDistancia) {
      if (!RE_CONSUMO.test(parametros.consumoEspecifico.trim()) || !/[1-9]/.test(parametros.consumoEspecifico)) {
        return 'Por distancia, indica el consumo específico (rendimiento) como número positivo.'
      }
      if (!parametros.unidadConsumoId || !parametros.unidadDistanciaId) {
        return 'Indica la unidad de combustible y la unidad de distancia del consumo específico.'
      }
    }

    const pares: [string, string, string][] = [
      ['densidad', parametros.densidad, parametros.unidadDensidadId],
      ['poder calorífico', parametros.poderCalorifico, parametros.unidadPoderCalorificoId],
    ]
    for (const [nombre, valor, unidad] of pares) {
      if (!valor && !unidad) continue
      if (!valor || !unidad) return `El parámetro ${nombre} requiere valor y unidad.`
      if (!RE_PARAMETRO.test(valor.trim()) || !/[1-9]/.test(valor)) {
        return `El parámetro ${nombre} debe ser un decimal mayor que cero (hasta 12 decimales).`
      }
    }
    if (requiereConversion && !parametros.densidad && !parametros.poderCalorifico) {
      return 'Esta unidad no coincide con la del factor: registra la densidad o el poder calorífico documentado.'
    }

    for (const campo of campos) {
      const valor = extras[campo.campo]
      const texto = typeof valor === 'string' ? valor.trim() : ''
      if (campo.tipo === 'booleano') continue
      if (!texto) {
        if (campo.requerido) return `Completa «${campo.etiqueta}».`
        continue
      }
      if (campo.tipo === 'decimal' && !RE_PARAMETRO.test(texto)) {
        return `«${campo.etiqueta}» debe ser un número con punto decimal (hasta 12 decimales).`
      }
      if (campo.tipo === 'fraccion' && !/^(?:0(?:\.\d{1,12})?|0?\.\d{1,12}|1(?:\.0{1,12})?)$/.test(texto)) {
        return `«${campo.etiqueta}» debe ser una fracción entre 0 y 1 (ej. 0.25).`
      }
    }
    if (seleccion) {
      if (!opcionCombustible) return 'Selecciona el combustible o tipo de energía consumido.'
      if (opcionCombustible.requiereFraccionBio && !RE_FRACCION_BIO.test(parametros.fraccionBiocombustible.trim())) {
        return 'Indica la fracción de biocombustible de la mezcla (0 a menos de 1, ej. 0.10 para B10/E10).'
      }
    }
    if (fuente?.codigo === 'A3-05') {
      if (!parametros.tipoCarbonato) return 'Indica si el carbonato consumido es caliza o dolomita.'
      if (!RE_FRACCION.test(parametros.purezaCarbonato.trim())) {
        return 'Indica la pureza medida del carbonato como fracción mayor que 0 y hasta 1.'
      }
    }
    if (fuente?.codigo === 'A3-11') {
      if (!parametros.procesoAmoniaco) return 'Selecciona el proceso de producción de amoníaco (Tabla 3.1 IPCC).'
      if (parametros.recuperacionCo2 === 'urea' && !RE_CANTIDAD.test(parametros.ureaProducida.trim())) {
        return 'Indica las toneladas de urea producidas con el CO₂ recuperado.'
      }
      if (parametros.recuperacionCo2 === 'medido' && !RE_CANTIDAD.test(parametros.co2Recuperado.trim())) {
        return 'Indica las toneladas de CO₂ recuperado medidas por la planta.'
      }
    }
    if (fuente?.codigo === 'A3-06' && !parametros.tipoProcesoAcero) {
      return 'Selecciona el proceso de fabricación del acero (un registro por proceso).'
    }
    if (fuente?.codigo === 'A3-14' && !parametros.abatimiento) {
      return 'Indica si hubo abatimiento de N₂O durante el periodo.'
    }
    if (fuente?.codigo === 'A3-15' && !RE_FRACCION.test(parametros.purezaProducto.trim())) {
      return 'Indica la pureza del producto como fracción mayor que 0 y hasta 1 (ej. 0.98).'
    }
    if (fuente?.codigo === 'A5-04' && !parametros.tipoCarbonato) {
      return 'Indica si el material es caliza o dolomita.'
    }
    if (fuente?.codigo === 'A3-13') {
      if (!parametros.tipoPlantaNitrica) return 'Selecciona el tipo de planta de ácido nítrico.'
      if (!parametros.abatimiento) return 'Indica si la planta tiene abatimiento de N₂O activo.'
      if (!RE_FRACCION.test(parametros.purezaAcido.trim())) {
        return 'Indica la pureza del HNO₃ como fracción mayor que 0 y hasta 1.'
      }
    }
    return ''
  }

  function armarParametros(): ParametrosCalculo {
    const salida: ParametrosCalculo = {}
    if (porDistancia) {
      salida.consumoEspecifico = parametros.consumoEspecifico.trim()
      salida.unidadConsumoId = Number(parametros.unidadConsumoId)
      salida.unidadDistanciaId = Number(parametros.unidadDistanciaId)
    }
    if (parametros.densidad && parametros.unidadDensidadId) {
      salida.densidad = parametros.densidad.trim()
      salida.unidadDensidadId = Number(parametros.unidadDensidadId)
    }
    if (parametros.poderCalorifico && parametros.unidadPoderCalorificoId) {
      salida.poderCalorifico = parametros.poderCalorifico.trim()
      salida.unidadPoderCalorificoId = Number(parametros.unidadPoderCalorificoId)
    }
    for (const campo of campos) {
      const valor = extras[campo.campo]
      if (campo.tipo === 'booleano') {
        if (typeof valor === 'boolean') salida[campo.campo] = valor
      } else if (campo.tipo === 'unidad' && typeof valor === 'string' && valor) {
        salida[campo.campo] = Number(valor)
      } else if (typeof valor === 'string' && valor.trim()) {
        salida[campo.campo] = valor.trim()
      }
    }
    if (seleccion && parametros.combustible) {
      salida.combustible = parametros.combustible
      if (opcionCombustible?.requiereFraccionBio) {
        salida.fraccionBiocombustible = parametros.fraccionBiocombustible.trim()
      }
    }
    if (fuente?.codigo === 'A3-05') {
      salida.tipoCarbonato = parametros.tipoCarbonato as 'CALIZA' | 'DOLOMITA'
      salida.purezaCarbonato = parametros.purezaCarbonato.trim()
    }
    if (fuente?.codigo === 'A3-11') {
      salida.procesoAmoniaco = parametros.procesoAmoniaco
      if (parametros.recuperacionCo2 === 'urea') salida.ureaProducida = parametros.ureaProducida.trim()
      if (parametros.recuperacionCo2 === 'medido') salida.co2Recuperado = parametros.co2Recuperado.trim()
    }
    if (fuente?.codigo === 'A3-06') {
      salida.tipoProcesoAcero = parametros.tipoProcesoAcero as ParametrosCalculo['tipoProcesoAcero']
    }
    if (fuente?.codigo === 'A3-14') {
      salida.abatimientoN2OActivo = parametros.abatimiento === 'si'
    }
    if (fuente?.codigo === 'A3-15') {
      salida.tipoProceso = 'NATURAL_TRONA'
      salida.purezaProducto = parametros.purezaProducto.trim()
    }
    if (fuente?.codigo === 'A5-04') {
      salida.tipoCarbonato = parametros.tipoCarbonato as 'CALIZA' | 'DOLOMITA'
    }
    if (fuente?.codigo === 'A3-13') {
      salida.tipoPlantaNitrica = parametros.tipoPlantaNitrica as ParametrosCalculo['tipoPlantaNitrica']
      salida.abatimientoN2OActivo = parametros.abatimiento === 'si'
      salida.purezaAcido = parametros.purezaAcido.trim()
    }
    return salida
  }

  async function recargar() {
    const actualizados = await listarPapeles(organizacionId, periodoId)
    setPapeles(actualizados)
    onPapelesCambio?.(actualizados.filter((item) => item.estadoRegistro !== 'RECHAZADO').length)
  }

  async function guardar() {
    const error = validar()
    if (error) {
      setErrorGuardar(error)
      return
    }
    setGuardando(true)
    try {
      await crearPapel({
        actividadId: formulario.actividadId,
        periodoId,
        fuenteEmisionId: formulario.fuenteId,
        alcanceId: formulario.alcanceId,
        actividadEmisionId: formulario.actividadEmisionId,
        subcategoriaEmisionId: formulario.subcategoriaId,
        unidadId: formulario.unidadId,
        cantidad: formulario.cantidad,
        fechaDato: formulario.fechaDato,
        fuenteDato: formulario.documento,
        observacion: formulario.observacion,
        parametrosCalculo: armarParametros(),
      })
      // Se conservan alcance y actividad para cargar varias facturas seguidas.
      setFormulario((actual) => ({
        ...VACIO,
        alcanceId: actual.alcanceId,
        actividadEmisionId: actual.actividadEmisionId,
        subcategoriaId: actual.subcategoriaId,
        fuenteId: actual.fuenteId,
        actividadId: actual.actividadId,
      }))
      setParametros((actual) => ({
        ...PARAMETROS_VACIOS,
        combustible: actual.combustible,
        fraccionBiocombustible: actual.fraccionBiocombustible,
      }))
      // Se conservan las elecciones (tipo de factor, proceso) para registrar varios datos seguidos.
      setExtras((actual) =>
        Object.fromEntries(
          Object.entries(actual).filter(([campo]) => campo === 'opcionFactor' || campo === 'opcionProceso'),
        ),
      )
      await recargar()
      avisar('Registro guardado. Se incluirá en el cálculo si su fuente tiene metodología y factor aprobados.')
    } catch (error) {
      const mensaje = error instanceof ErrorApi ? error.message : 'No se pudo guardar el registro.'
      setErrorGuardar(mensaje)
      avisar(mensaje)
    } finally {
      setGuardando(false)
    }
  }

  async function rechazar(id: string) {
    try {
      await rechazarPapel(id)
      await recargar()
      avisar('Registro quitado del periodo.')
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo quitar el registro.')
    }
  }

  const activos = papeles.filter((item) => item.estadoRegistro !== 'RECHAZADO')
  const sinCatalogo = Boolean(opciones) && (opciones?.actividadesEmision.length ?? 0) === 0
  const listoBasico =
    abierto &&
    Boolean(
      formulario.alcanceId &&
        formulario.actividadEmisionId &&
        formulario.fuenteId &&
        formulario.actividadId &&
        formulario.unidadId &&
        formulario.cantidad,
    )

  const opcionUnidad = (item: { id: string; nombre: string; detalle: string }) => (
    <option key={item.id} value={item.id}>
      {item.nombre}
      {item.detalle && item.detalle !== item.nombre ? ` · ${item.detalle}` : ''}
    </option>
  )

  return (
    <div className="cal-papeles">
      <header className="cal-bloque-cabecera cal-bloque-cabecera--fila">
        <div>
          <h2>Paso 2 · Datos de actividad del periodo</h2>
          <p>
            Elige el alcance, la actividad y la fuente de emisión. El formulario pide solo los datos que esa fuente
            necesita y te muestra las unidades compatibles con el factor de la metodología elegida.
          </p>
        </div>
        <span className="cal-historial-contador" aria-live="polite">
          {activos.length} {activos.length === 1 ? 'registro activo' : 'registros activos'}
        </span>
      </header>

      {errorOpciones ? (
        <div className="cal-aviso-caja cal-aviso-caja--alerta" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{errorOpciones}</span>
        </div>
      ) : null}

      {sinCatalogo ? (
        <div className="cal-aviso-caja cal-aviso-caja--alerta" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            El backend no devolvió el catálogo de actividades de emisión (<code>actividadesEmision</code>). Sin él
            no es posible clasificar el dato por alcance y fuente; carga el catálogo antes de registrar consumos.
          </span>
        </div>
      ) : null}

      {abierto && opciones && !sinCatalogo ? (
        <div className="cal-papeles-form">
          {/* 1. Alcance */}
          <fieldset className="cal-alcances">
            <legend>Alcance *</legend>
            <div className="cal-alcances-opciones" role="radiogroup">
              {opciones.alcances.map((alcance) => {
                const cuantas = opciones.actividadesEmision.filter((item) => item.alcanceId === alcance.id).length
                return (
                  <button
                    key={alcance.id}
                    type="button"
                    role="radio"
                    aria-checked={formulario.alcanceId === alcance.id}
                    className={`cal-alcance ${formulario.alcanceId === alcance.id ? 'activo' : ''}`}
                    onClick={() => cambiar('alcanceId', alcance.id)}
                    disabled={cuantas === 0}
                  >
                    <strong>{alcance.nombre}</strong>
                    <span>
                      {cuantas} {cuantas === 1 ? 'actividad' : 'actividades'}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* 2. Actividad, subcategoría y fuente */}
          <div className="cal-carbono-campos">
            <div className="vst-campo">
              <label htmlFor="papel-actividad-emision">Actividad de emisión *</label>
              <select
                id="papel-actividad-emision"
                className="vst-select"
                value={formulario.actividadEmisionId}
                onChange={(evento) => cambiar('actividadEmisionId', evento.target.value)}
                disabled={!formulario.alcanceId}
              >
                <option value="">{formulario.alcanceId ? 'Selecciona una actividad' : 'Primero elige el alcance'}</option>
                {actividadesDelAlcance.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.codigo} · {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            {subcategorias.length ? (
              <div className="vst-campo">
                <label htmlFor="papel-subcategoria">Subcategoría {subcategoriaObligatoria ? '*' : ''}</label>
                <select
                  id="papel-subcategoria"
                  className="vst-select"
                  value={formulario.subcategoriaId}
                  onChange={(evento) => cambiar('subcategoriaId', evento.target.value)}
                >
                  <option value="">
                    {subcategoriaObligatoria ? 'Selecciona una subcategoría' : 'Sin subcategoría (fuentes generales)'}
                  </option>
                  {subcategorias.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.codigo} · {item.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="vst-campo">
              <label htmlFor="papel-fuente">Fuente de emisión *</label>
              <select
                id="papel-fuente"
                className="vst-select"
                value={formulario.fuenteId}
                onChange={(evento) => cambiar('fuenteId', evento.target.value)}
                disabled={!formulario.actividadEmisionId || (subcategoriaObligatoria && !formulario.subcategoriaId)}
              >
                <option value="">
                  {!formulario.actividadEmisionId
                    ? 'Primero elige la actividad'
                    : fuentesDisponibles.length
                      ? 'Selecciona una fuente'
                      : 'Sin fuentes vinculadas'}
                </option>
                {fuentesDisponibles.map((item) => {
                  const estado = estadoFuente(item)
                  return (
                    <option key={item.id} value={item.id}>
                      {item.codigo} · {item.nombre}
                      {estado && !estado.calcula ? ` — ${estado.texto}` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Ficha metodológica de la fuente */}
          {fuente ? (
            <div
              className={`cal-aviso-caja ${estadoDeFuente && !estadoDeFuente.calcula ? 'cal-aviso-caja--alerta' : ''}`}
            >
              {estadoDeFuente && !estadoDeFuente.calcula ? (
                <AlertTriangle size={18} aria-hidden="true" />
              ) : (
                <Info size={17} aria-hidden="true" />
              )}
              <div className="cal-ficha-fuente">
                <strong>
                  {fuente.codigo} · {fuente.nombre}
                  {estadoDeFuente ? (
                    <span className={`cal-estado ${estadoDeFuente.calcula ? 'ok' : 'revision'}`}>
                      {estadoDeFuente.texto}
                    </span>
                  ) : null}
                </strong>
                {fuente.requisitos ? (
                  <dl>
                    <div>
                      <dt>Dato que debes registrar</dt>
                      <dd>{fuente.requisitos.datos}</dd>
                    </div>
                    <div>
                      <dt>Unidades admitidas</dt>
                      <dd>{fuente.requisitos.unidades}</dd>
                    </div>
                    <div>
                      <dt>Método</dt>
                      <dd>{fuente.requisitos.metodologia}</dd>
                    </div>
                    <div>
                      <dt>Factor requerido</dt>
                      <dd>{fuente.requisitos.factor}</dd>
                    </div>
                    {fuente.requisitos.pendiente ? (
                      <div>
                        <dt>{estadoDeFuente?.calcula ? 'Condición' : 'Pendiente'}</dt>
                        <dd>{fuente.requisitos.pendiente}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <span>
                    El backend no informó la ficha metodológica de esta fuente; su viabilidad se confirmará al calcular.
                  </span>
                )}
                {estadoDeFuente && !estadoDeFuente.calcula ? (
                  <span>
                    Puedes guardar el dato como evidencia, pero <strong>no entrará en la suma</strong>:{' '}
                    {fuente.requisitos?.estado === 'EJECUTABLE'
                      ? 'el método está implementado, pero no hay un factor oficial aprobado para esta fuente.'
                      : fuente.requisitos?.estado === 'NO_APLICA'
                        ? 'esta fuente no genera emisiones de GEI contabilizables.'
                        : 'la causa se indica arriba en «Pendiente».'}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          {fuente && estadoDeFuente?.calcula !== false ? (
            cargandoCobertura ? (
              <p className="cal-ayuda">Comprobando cobertura de factores para las fechas del registro…</p>
            ) : errorCobertura ? (
              <div className="cal-aviso-caja cal-aviso-caja--alerta" role="status">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>No fue posible consultar la cobertura preliminar. El cálculo seguirá verificando factores, aprobación, vigencia y dimensiones.</span>
              </div>
            ) : coberturaFuente ? (
              <div className={`cal-aviso-caja ${coberturaFuente.aprobadosVigentes > 0 && coberturaFuente.unidadesCompatibles ? '' : 'cal-aviso-caja--alerta'}`} role="status">
                {coberturaFuente.aprobadosVigentes > 0 && coberturaFuente.unidadesCompatibles ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <AlertTriangle size={18} aria-hidden="true" />
                )}
                <span>
                  {coberturaFuente.aprobadosVigentes > 0
                    ? coberturaFuente.unidadesCompatibles
                      ? `Hay ${coberturaFuente.aprobadosVigentes} factor(es) aprobado(s) con vigencia y magnitud compatibles con las fechas consultadas.`
                      : 'Hay factores aprobados en las fechas consultadas, pero no se confirmó una unidad compatible.'
                    : coberturaFuente.aprobadosNoVigentes > 0
                      ? 'Hay factores aprobados registrados, pero sus vigencias no cubren las fechas consultadas.'
                      : coberturaFuente.pendientes > 0
                        ? 'Hay factores pendientes de revisión o aprobación para esta fuente.'
                        : (coberturaFuente.rechazados ?? 0) > 0
                          ? 'Los factores de esta fuente fueron rechazados; hace falta registrar y aprobar uno nuevo.'
                          : coberturaFuente.factorDisponible
                            ? 'Hay registros de factores, pero ninguno aprobado y vigente para estas fechas.'
                            : 'No hay factores registrados para esta fuente y versión.'}{' '}
                  La revisión es preliminar; combustible, variante, región, sector, unidad exacta y metodología se validan al calcular.
                </span>
              </div>
            ) : null
          ) : null}

          {/* Disponibilidad de factores en la metodología elegida */}
          {fuente && estadoDeFuente?.calcula !== false ? (
            !versionId ? (
              <div className="cal-aviso-caja">
                <Info size={17} aria-hidden="true" />
                <span>
                  Elige la metodología en el paso 1 para ver las unidades compatibles con sus factores. Sin ella se
                  muestran todas las unidades y el backend validará la compatibilidad al calcular.
                </span>
              </div>
            ) : factores.tipo === 'cargando' ? (
              <p className="cal-ayuda">Consultando factores de {versionNombre}…</p>
            ) : factores.tipo === 'no-disponible' ? (
              <div className="cal-aviso-caja">
                <Info size={17} aria-hidden="true" />
                <span>
                  No fue posible consultar los factores de emisión con tu perfil. Se muestran todas las unidades; el
                  backend confirmará la compatibilidad al calcular.
                </span>
              </div>
            ) : factores.tipo === 'listo' && clasificacion && clasificacion.caso !== 'VIGENTE' ? (
              <div className="cal-aviso-caja cal-aviso-caja--alerta" data-caso-factores={clasificacion.caso}>
                <AlertTriangle size={18} aria-hidden="true" />
                <span>{mensajeFactores(clasificacion, { versionNombre, referencia: referenciaTexto })}</span>
              </div>
            ) : factores.tipo === 'listo' ? (
              <div className="cal-aviso-caja">
                <CheckCircle2 size={17} aria-hidden="true" />
                <span>
                  {seleccion && !parametros.combustible
                    ? `Elige el combustible para ver su factor oficial (${factoresAprobados.length} factores aprobados en ${versionNombre}).`
                    : `${factoresAprobados.length} factor(es) aprobado(s) en ${versionNombre}`}
                  {factoresAprobados.length ? ' · vigencias: ' : ''}
                  <strong>{[...new Set(factoresAprobados.map((item) => `${item.fechaInicioVigencia}–${item.fechaFinVigencia ?? 'sin fecha final'}`))].join(', ')}</strong>
                  {' · unidad del factor: '}
                  <strong>{[...new Set(factoresAprobados.map((item) => item.unidadEntradaSimbolo))].join(', ')}</strong>
                  {!magnitudes ? ' (no se pudo filtrar unidades por magnitud con tu perfil).' : '.'}
                </span>
              </div>
            ) : null
          ) : null}

          {/* 3. Dato de actividad */}
          {fuente ? (
            <div className="cal-carbono-campos">
              <div className="vst-campo">
                <label htmlFor="papel-actividad">Actividad o proceso de la organización *</label>
                <select
                  id="papel-actividad"
                  className="vst-select"
                  value={formulario.actividadId}
                  onChange={(evento) => cambiar('actividadId', evento.target.value)}
                >
                  <option value="">
                    {opciones.actividades.length ? 'Selecciona dónde ocurre el consumo' : 'Sin actividades registradas'}
                  </option>
                  {opciones.actividades.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.detalle ? `${item.detalle} · ` : ''}
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="vst-campo">
                <label htmlFor="papel-cantidad">
                  {porDistancia ? 'Distancia recorrida *' : 'Cantidad del dato de actividad *'}
                </label>
                <input
                  id="papel-cantidad"
                  className="vst-input"
                  inputMode="decimal"
                  value={formulario.cantidad}
                  onChange={(evento) => cambiar('cantidad', evento.target.value.replace(',', '.'))}
                  placeholder="Ej. 2500"
                />
              </div>

              <div className="vst-campo">
                <label htmlFor="papel-unidad">Unidad *</label>
                <select
                  id="papel-unidad"
                  className="vst-select"
                  value={formulario.unidadId}
                  onChange={(evento) => cambiar('unidadId', evento.target.value)}
                >
                  <option value="">
                    {unidadesDirectas.length ? 'Selecciona la unidad' : 'Sin unidades compatibles'}
                  </option>
                  {filtrarUnidades ? (
                    <>
                      <optgroup label="Compatibles con el factor">{unidadesDirectas.map(opcionUnidad)}</optgroup>
                      {unidadesConvertibles.length ? (
                        <optgroup label="Requieren densidad o poder calorífico">
                          {unidadesConvertibles.map(opcionUnidad)}
                        </optgroup>
                      ) : null}
                      {unidadesDistancia.length && !magnitudesFactor.has('distancia') ? (
                        <optgroup label="Por distancia (requiere consumo específico)">
                          {unidadesDistancia.map(opcionUnidad)}
                        </optgroup>
                      ) : null}
                    </>
                  ) : (
                    unidades.map(opcionUnidad)
                  )}
                </select>
              </div>

              {!porDistancia && !porUnidadVendida ? (
                <div className="vst-campo" style={{ gridColumn: '1 / -1' }}>
                  <EquivalenciaUnidad
                    cantidad={formulario.cantidad}
                    unidadOrigen={
                      formulario.unidadId
                        ? {
                            id: formulario.unidadId,
                            simbolo: unidades.find((item) => item.id === formulario.unidadId)?.nombre ?? '',
                          }
                        : null
                    }
                    unidadesFactor={unidadesFactor}
                    parametros={{
                      densidad: parametros.densidad.trim() || undefined,
                      unidadDensidadId: parametros.unidadDensidadId || undefined,
                      poderCalorifico: parametros.poderCalorifico.trim() || undefined,
                      unidadPoderCalorificoId: parametros.unidadPoderCalorificoId || undefined,
                    }}
                  />
                </div>
              ) : null}

              <div className="vst-campo">
                <label htmlFor="papel-fecha">Fecha del dato (opcional)</label>
                <input
                  id="papel-fecha"
                  className="vst-input"
                  type="date"
                  min={fechaInicio}
                  max={fechaFin}
                  value={formulario.fechaDato}
                  onChange={(evento) => cambiar('fechaDato', evento.target.value)}
                />
              </div>

              <div className="vst-campo">
                <label htmlFor="papel-documento">Soporte / documento (opcional)</label>
                <input
                  id="papel-documento"
                  className="vst-input"
                  maxLength={255}
                  value={formulario.documento}
                  onChange={(evento) => cambiar('documento', evento.target.value)}
                  placeholder="Ej. Factura energía ene 2026"
                />
              </div>

              <div className="vst-campo">
                <label htmlFor="papel-observacion">Observación (opcional)</label>
                <input
                  id="papel-observacion"
                  className="vst-input"
                  maxLength={2000}
                  value={formulario.observacion}
                  onChange={(evento) => cambiar('observacion', evento.target.value)}
                  placeholder="Ej. Lectura del medidor principal"
                />
              </div>
            </div>
          ) : null}

          {/* 4. Parámetros específicos de la fuente o metodología */}
          {fuente && campos.length ? (
            <fieldset className="cal-parametros">
              <legend>Parámetros de la metodología de {fuente.codigo}</legend>
              <p className="cal-ayuda">
                Los define el backend según la ecuación de la fuente; los marcados con * son obligatorios.
              </p>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                {campos.map((campo) => {
                  const id = `par-${campo.campo}`
                  const valor = extras[campo.campo]
                  if (campo.tipo === 'booleano') {
                    return (
                      <div className="vst-campo" key={campo.campo}>
                        <label htmlFor={id}>
                          <input
                            id={id}
                            type="checkbox"
                            checked={valor === true}
                            onChange={(evento) => cambiarExtra(campo.campo, evento.target.checked)}
                          />{' '}
                          {campo.etiqueta}
                        </label>
                        {campo.ayuda ? <span className="cal-ayuda">{campo.ayuda}</span> : null}
                      </div>
                    )
                  }
                  return (
                    <div className="vst-campo" key={campo.campo}>
                      <label htmlFor={id}>
                        {campo.etiqueta}
                        {campo.requerido ? ' *' : ''}
                      </label>
                      {campo.tipo === 'unidad' ? (
                        <select
                          id={id}
                          className="vst-select"
                          value={typeof valor === 'string' ? valor : ''}
                          onChange={(evento) => cambiarExtra(campo.campo, evento.target.value)}
                        >
                          <option value="">Selecciona</option>
                          {unidadesPorMagnitud(campo.magnitudes ?? []).map(opcionUnidad)}
                        </select>
                      ) : campo.tipo === 'seleccion' ? (
                        <select
                          id={id}
                          className="vst-select"
                          value={typeof valor === 'string' ? valor : ''}
                          onChange={(evento) => cambiarExtra(campo.campo, evento.target.value)}
                        >
                          <option value="">Selecciona</option>
                          {(campo.opciones ?? []).map((opcion) => (
                            <option key={opcion.valor} value={opcion.valor}>
                              {opcion.texto}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={id}
                          className="vst-input"
                          inputMode="decimal"
                          value={typeof valor === 'string' ? valor : ''}
                          onChange={(evento) => cambiarExtra(campo.campo, evento.target.value.replace(',', '.'))}
                          placeholder={campo.tipo === 'fraccion' ? 'Ej. 0.25' : 'Ej. 100'}
                        />
                      )}
                      {campo.ayuda ? <span className="cal-ayuda">{campo.ayuda}</span> : null}
                    </div>
                  )
                })}
              </div>
            </fieldset>
          ) : null}
          {fuente && seleccion ? (
            <fieldset className="cal-parametros">
              <legend>Combustible o energía consumido *</legend>
              <p className="cal-ayuda">
                El factor oficial (FECOC 2016 o UPME) se elige por esta declaración; el sistema no supone el combustible.
              </p>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                <div className="vst-campo">
                  <label htmlFor="par-combustible">Combustible / energía *</label>
                  <select
                    id="par-combustible"
                    className="vst-select"
                    value={parametros.combustible}
                    onChange={(evento) => cambiarParametro('combustible', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {seleccion.opciones.map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {opcionCombustible?.requiereFraccionBio ? (
                  <div className="vst-campo">
                    <label htmlFor="par-fraccion-bio">Fracción de biocombustible en la mezcla *</label>
                    <input
                      id="par-fraccion-bio"
                      className="vst-input"
                      inputMode="decimal"
                      value={parametros.fraccionBiocombustible}
                      onChange={(evento) =>
                        cambiarParametro('fraccionBiocombustible', evento.target.value.replace(',', '.'))
                      }
                      placeholder="Ej. 0.10 (B10 / E10)"
                    />
                  </div>
                ) : null}
              </div>
            </fieldset>
          ) : null}

          {fuente?.codigo === 'A3-05' ? (
            <fieldset className="cal-parametros">
              <legend>Carbonato consumido *</legend>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                <div className="vst-campo">
                  <label htmlFor="par-carbonato-ceramica">Tipo de carbonato *</label>
                  <select
                    id="par-carbonato-ceramica"
                    className="vst-select"
                    value={parametros.tipoCarbonato}
                    onChange={(evento) => cambiarParametro('tipoCarbonato', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    <option value="CALIZA">Caliza</option>
                    <option value="DOLOMITA">Dolomita</option>
                  </select>
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-pureza-carbonato">Pureza medida (fracción) *</label>
                  <input
                    id="par-pureza-carbonato"
                    className="vst-input"
                    inputMode="decimal"
                    value={parametros.purezaCarbonato}
                    onChange={(evento) => cambiarParametro('purezaCarbonato', evento.target.value.replace(',', '.'))}
                    placeholder="Ej. 0.95"
                  />
                </div>
              </div>
            </fieldset>
          ) : null}

          {fuente?.codigo === 'A3-11' ? (
            <fieldset className="cal-parametros">
              <legend>Producción de amoníaco (IPCC 2006, Ec. 3.1) *</legend>
              <p className="cal-ayuda">
                La cantidad es el amoníaco producido. El CO₂ recuperado para urea (urea × 44/60) o medido para urea o
                almacenamiento se resta del CO₂ generado. Si lo restas, las emisiones del uso de esa urea deben
                contabilizarse en otra parte del inventario.
              </p>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                <div className="vst-campo">
                  <label htmlFor="par-proceso-amoniaco">Proceso de producción *</label>
                  <select
                    id="par-proceso-amoniaco"
                    className="vst-select"
                    value={parametros.procesoAmoniaco}
                    onChange={(evento) => cambiarParametro('procesoAmoniaco', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {PROCESOS_AMONIACO.map((item) => (
                      <option key={item.valor} value={item.valor}>
                        {item.texto}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-recuperacion">CO₂ recuperado</label>
                  <select
                    id="par-recuperacion"
                    className="vst-select"
                    value={parametros.recuperacionCo2}
                    onChange={(evento) => cambiarParametro('recuperacionCo2', evento.target.value)}
                  >
                    <option value="">No hubo recuperación (R = 0)</option>
                    <option value="urea">Por urea producida (× 44/60)</option>
                    <option value="medido">CO₂ recuperado medido (urea o CCS)</option>
                  </select>
                </div>
                {parametros.recuperacionCo2 === 'urea' ? (
                  <div className="vst-campo">
                    <label htmlFor="par-urea">Urea producida (t) *</label>
                    <input
                      id="par-urea"
                      className="vst-input"
                      inputMode="decimal"
                      value={parametros.ureaProducida}
                      onChange={(evento) => cambiarParametro('ureaProducida', evento.target.value.replace(',', '.'))}
                      placeholder="Ej. 500"
                    />
                  </div>
                ) : null}
                {parametros.recuperacionCo2 === 'medido' ? (
                  <div className="vst-campo">
                    <label htmlFor="par-co2-recuperado">CO₂ recuperado (t) *</label>
                    <input
                      id="par-co2-recuperado"
                      className="vst-input"
                      inputMode="decimal"
                      value={parametros.co2Recuperado}
                      onChange={(evento) => cambiarParametro('co2Recuperado', evento.target.value.replace(',', '.'))}
                      placeholder="Ej. 350"
                    />
                  </div>
                ) : null}
              </div>
            </fieldset>
          ) : null}

          {fuente?.codigo === 'A3-06' ? (
            <fieldset className="cal-parametros">
              <legend>Proceso de fabricación del acero *</legend>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                <div className="vst-campo">
                  <label htmlFor="par-acero">Proceso (un registro por proceso) *</label>
                  <select
                    id="par-acero"
                    className="vst-select"
                    value={parametros.tipoProcesoAcero}
                    onChange={(evento) => cambiarParametro('tipoProcesoAcero', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {PROCESOS_ACERO.map((item) => (
                      <option key={item.valor} value={item.valor}>
                        {item.texto}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>
          ) : null}

          {fuente?.codigo === 'A3-14' ? (
            <fieldset className="cal-parametros">
              <legend>Abatimiento de N₂O *</legend>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                <div className="vst-campo">
                  <label htmlFor="par-abatimiento-adipico">¿Hubo abatimiento de N₂O en el periodo? *</label>
                  <select
                    id="par-abatimiento-adipico"
                    className="vst-select"
                    value={parametros.abatimiento}
                    onChange={(evento) => cambiarParametro('abatimiento', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    <option value="no">No (se calcula con 300 kg N₂O/t)</option>
                    <option value="si">Sí (requiere datos de planta no modelados)</option>
                  </select>
                </div>
              </div>
            </fieldset>
          ) : null}

          {fuente && porDistancia ? (
            <fieldset className="cal-parametros">
              <legend>Consumo específico del vehículo *</legend>
              <p className="cal-ayuda">
                Por distancia solo se calcula con el rendimiento documentado: cantidad de combustible por unidad de
                distancia (ej. 0.08 L/km).
              </p>
              <div className="cal-carbono-campos">
                <div className="vst-campo">
                  <label htmlFor="par-consumo">Consumo específico *</label>
                  <input
                    id="par-consumo"
                    className="vst-input"
                    inputMode="decimal"
                    value={parametros.consumoEspecifico}
                    onChange={(evento) => cambiarParametro('consumoEspecifico', evento.target.value.replace(',', '.'))}
                    placeholder="Ej. 0.08"
                  />
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-unidad-consumo">Unidad de combustible *</label>
                  <select
                    id="par-unidad-consumo"
                    className="vst-select"
                    value={parametros.unidadConsumoId}
                    onChange={(evento) => cambiarParametro('unidadConsumoId', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {unidadesPorMagnitud(MAGNITUDES_ENERGETICAS).map(opcionUnidad)}
                  </select>
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-unidad-distancia">Por unidad de distancia *</label>
                  <select
                    id="par-unidad-distancia"
                    className="vst-select"
                    value={parametros.unidadDistanciaId}
                    onChange={(evento) => cambiarParametro('unidadDistanciaId', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {unidadesPorMagnitud(['distancia']).map(opcionUnidad)}
                  </select>
                </div>
              </div>
            </fieldset>
          ) : null}

          {fuente && esCombustion && !porDistancia ? (
            <fieldset className="cal-parametros">
              <legend>
                Parámetros de conversión {requiereConversion ? '*' : '(opcional)'}
              </legend>
              <p className="cal-ayuda">
                {requiereConversion
                  ? 'La unidad elegida no coincide con la del factor. Registra la densidad o el poder calorífico documentado del combustible para que el backend pueda convertirla.'
                  : 'Solo si cuentas con valores documentados del combustible. Cada parámetro requiere valor y unidad.'}
              </p>
              <div className="cal-carbono-campos cal-carbono-campos--cuatro">
                <div className="vst-campo">
                  <label htmlFor="par-densidad">Densidad</label>
                  <input
                    id="par-densidad"
                    className="vst-input"
                    inputMode="decimal"
                    value={parametros.densidad}
                    onChange={(evento) => cambiarParametro('densidad', evento.target.value.replace(',', '.'))}
                    placeholder="Ej. 0.74"
                  />
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-unidad-densidad">Unidad de densidad</label>
                  <select
                    id="par-unidad-densidad"
                    className="vst-select"
                    value={parametros.unidadDensidadId}
                    onChange={(evento) => cambiarParametro('unidadDensidadId', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {unidadesPorMagnitud(['densidad']).map(opcionUnidad)}
                  </select>
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-pc">Poder calorífico</label>
                  <input
                    id="par-pc"
                    className="vst-input"
                    inputMode="decimal"
                    value={parametros.poderCalorifico}
                    onChange={(evento) => cambiarParametro('poderCalorifico', evento.target.value.replace(',', '.'))}
                    placeholder="Ej. 44.3"
                  />
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-unidad-pc">Unidad de poder calorífico</label>
                  <select
                    id="par-unidad-pc"
                    className="vst-select"
                    value={parametros.unidadPoderCalorificoId}
                    onChange={(evento) => cambiarParametro('unidadPoderCalorificoId', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {unidadesPorMagnitud(['poder calorifico masico', 'poder calorifico volumetrico']).map(opcionUnidad)}
                  </select>
                </div>
              </div>
            </fieldset>
          ) : null}

          {fuente?.codigo === 'A3-15' ? (
            <fieldset className="cal-parametros">
              <legend>Datos del proceso de carbonato de sodio *</legend>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                <div className="vst-campo">
                  <label htmlFor="par-proceso">Ruta del proceso</label>
                  <select id="par-proceso" className="vst-select" value="NATURAL_TRONA" disabled>
                    <option value="NATURAL_TRONA">Trona natural (única ruta implementada)</option>
                  </select>
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-pureza-producto">Pureza del producto (fracción) *</label>
                  <input
                    id="par-pureza-producto"
                    className="vst-input"
                    inputMode="decimal"
                    value={parametros.purezaProducto}
                    onChange={(evento) => cambiarParametro('purezaProducto', evento.target.value.replace(',', '.'))}
                    placeholder="Ej. 0.98"
                  />
                </div>
              </div>
            </fieldset>
          ) : null}

          {fuente?.codigo === 'A5-04' ? (
            <fieldset className="cal-parametros">
              <legend>Material carbonatado *</legend>
              <div className="cal-carbono-campos cal-carbono-campos--dos">
                <div className="vst-campo">
                  <label htmlFor="par-carbonato">Tipo de carbonato *</label>
                  <select
                    id="par-carbonato"
                    className="vst-select"
                    value={parametros.tipoCarbonato}
                    onChange={(evento) => cambiarParametro('tipoCarbonato', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    <option value="CALIZA">Caliza</option>
                    <option value="DOLOMITA">Dolomita</option>
                  </select>
                </div>
              </div>
            </fieldset>
          ) : null}

          {fuente?.codigo === 'A3-13' ? (
            <fieldset className="cal-parametros">
              <legend>Datos de la planta de ácido nítrico *</legend>
              <div className="cal-carbono-campos">
                <div className="vst-campo">
                  <label htmlFor="par-planta">Tipo de planta (IPCC) *</label>
                  <select
                    id="par-planta"
                    className="vst-select"
                    value={parametros.tipoPlantaNitrica}
                    onChange={(evento) => cambiarParametro('tipoPlantaNitrica', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    {PLANTAS_NITRICAS.map((item) => (
                      <option key={item.valor} value={item.valor}>
                        {item.texto}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-abatimiento">Abatimiento de N₂O activo *</label>
                  <select
                    id="par-abatimiento"
                    className="vst-select"
                    value={parametros.abatimiento}
                    onChange={(evento) => cambiarParametro('abatimiento', evento.target.value)}
                  >
                    <option value="">Selecciona</option>
                    <option value="si">Sí, documentado</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="vst-campo">
                  <label htmlFor="par-pureza-acido">Pureza del HNO₃ (fracción) *</label>
                  <input
                    id="par-pureza-acido"
                    className="vst-input"
                    inputMode="decimal"
                    value={parametros.purezaAcido}
                    onChange={(evento) => cambiarParametro('purezaAcido', evento.target.value.replace(',', '.'))}
                    placeholder="Ej. 0.6"
                  />
                </div>
              </div>
            </fieldset>
          ) : null}

          {errorGuardar ? (
            <div className="cal-aviso-caja cal-aviso-caja--alerta" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{errorGuardar}</span>
            </div>
          ) : null}

          <div className="cal-papeles-acciones">
            <Button onClick={() => void guardar()} disabled={guardando || !listoBasico}>
              <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
              {guardando ? 'Guardando…' : 'Registrar dato'}
            </Button>
            {!listoBasico ? (
              <span className="cal-ayuda-inline">Completa los campos marcados con * para registrar el dato.</span>
            ) : null}
          </div>
        </div>
      ) : !abierto ? (
        <div className="cal-aviso-caja">
          <Info size={17} aria-hidden="true" />
          <span>
            Este periodo está cerrado y ya no recibe nuevos registros, pero puedes continuar al paso 3 para calcular
            con los ya cargados.
          </span>
        </div>
      ) : !opciones && !errorOpciones ? (
        <p className="cal-ayuda">Cargando catálogo de alcances, actividades y fuentes…</p>
      ) : null}

      {cargandoLista ? (
        <p className="cal-ayuda">Cargando registros del periodo…</p>
      ) : papeles.length ? (
        <>
        {errorConsultaTraza ? (
          <div className="cal-aviso-caja cal-aviso-caja--alerta" role="status">
            <AlertTriangle size={17} aria-hidden="true" />
            <span>No se pudo consultar la trazabilidad del último cálculo. Las conversiones no se muestran.</span>
          </div>
        ) : null}
        <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla">
            <thead>
              <tr>
                <th>Alcance</th>
                <th>Actividad de emisión</th>
                <th>Fuente</th>
                <th>Cantidad original</th>
                <th>Conversión utilizada</th>
                <th>Actividad / proceso</th>
                <th>Soporte</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {papeles.map((papel) => {
                const badge = etiquetaEstado(papel.estadoRegistro)
                const estadoMetodo = estadoFuente(opciones?.fuentes.find((item) => item.id === papel.fuenteEmisionId))
                return (
                  <tr key={papel.id} className={papel.estadoRegistro === 'RECHAZADO' ? 'cal-fila-inactiva' : undefined}>
                    <td>{papel.alcanceNombre || papel.alcanceCodigo}</td>
                    <td>
                      {papel.actividadEmisionCodigo
                        ? `${papel.actividadEmisionCodigo} · ${papel.actividadEmisionNombre}`
                        : 'Sin clasificar'}
                      {papel.subcategoriaEmisionNombre ? (
                        <span className="cal-celda-detalle">{papel.subcategoriaEmisionNombre}</span>
                      ) : null}
                    </td>
                    <td>
                      {papel.fuenteNombre}
                      {estadoMetodo && !estadoMetodo.calcula ? (
                        <span className="cal-celda-detalle cal-celda-detalle--alerta">{estadoMetodo.texto}</span>
                      ) : null}
                    </td>
                    <td className="cal-num">
                      {papel.cantidad} {papel.unidadSimbolo}
                    </td>
                    <td>
                      {(() => {
                        const conversion = conversionPersistida(
                          papel,
                          resultadoTrazable?.periodoId === periodoId ? resultadoTrazable : null,
                          opciones?.unidades ?? [],
                        )
                        if (!conversion) {
                          return <span className="cal-celda-detalle">Conversión no disponible: aún no hay una traza compatible con este registro.</span>
                        }
                        if (!conversion.requerida) {
                          return <span className="cal-celda-detalle">No se requirió conversión; el factor utilizó la misma unidad.</span>
                        }
                        return (
                          <>
                            <strong className="cal-num">{conversion.cantidadConvertida} {conversion.unidadDestino}</strong>
                            <span className="cal-celda-detalle">Según el cálculo guardado {resultadoTrazable?.fechaCalculo ? `del ${resultadoTrazable.fechaCalculo.slice(0, 10)}` : ''}; factor {conversion.factorCodigo || 'trazado'}.</span>
                          </>
                        )
                      })()}
                    </td>
                    <td>
                      {papel.actividadNombre}
                      {papel.procesoNombre ? <span className="cal-celda-detalle">{papel.procesoNombre}</span> : null}
                    </td>
                    <td>
                      {papel.fuenteDato || '—'}
                      {papel.fechaDato ? <span className="cal-celda-detalle">{papel.fechaDato}</span> : null}
                    </td>
                    <td>
                      <span className={`cal-estado ${badge.clase}`}>{badge.texto}</span>
                    </td>
                    <td>
                      {abierto && papel.estadoRegistro !== 'RECHAZADO' ? (
                        <Button
                          variante="fantasma"
                          className="cal-btn-compacto"
                          onClick={() => void rechazar(papel.id)}
                          aria-label={`Quitar ${papel.actividadNombre}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Quitar
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <div className="cal-vacio-caja">
          <FileText size={20} strokeWidth={1.9} aria-hidden="true" />
          <div>
            <strong>Aún no hay registros en este periodo</strong>
            <p>
              Registra al menos un dato de actividad (por ejemplo, electricidad en kWh o combustible en L) para poder
              calcular la huella de carbono.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
