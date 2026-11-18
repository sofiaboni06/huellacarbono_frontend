import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Plus, Search, TriangleAlert, X } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../components/layout/PlantillaVista'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import TablaDatosActividad from './components/TablaDatosActividad'
import ModalDatoActividad, { type CatalogosFormulario } from './components/ModalDatoActividad'
import { erroresDeApi, type ErroresDato } from './erroresApi'
import { ErrorApi } from '../../services/apiCliente'
import { tienePermiso } from '../../services/sesionService'
import { useProyecto } from '../../context/ProyectoContext'
import {
  actualizarDatoActividad,
  crearDatoActividad,
  eliminarDatoActividad,
  etiquetaProyecto,
  listarActividades,
  listarAlcances,
  listarDatosActividad,
  listarFuentesEmision,
  listarPeriodos,
  listarUnidadesActivas,
  obtenerDatoActividad,
} from '../../services/datosActividadService'
import type { DatoActividad, DatoActividadFormulario } from '../../services/tipos'
import './DatosActividad.css'

/** Registros por página (mismo patrón que Gestión de Usuarios). */
const POR_PAGINA = 8

/** Quita tildes y pasa a minúsculas para comparar de forma tolerante. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/** Mensaje legible de cualquier error lanzado por la capa de servicios. */
function mensajeDe(error: unknown): string {
  if (error instanceof ErrorApi) return error.message
  if (error instanceof Error) return error.message
  return 'No se pudo completar la operación. Intenta nuevamente.'
}

/** Fecha ISO del backend en formato local, o `—` si no está registrada. */
function fechaLegible(iso: string | null): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleString('es-CO')
}

const CATALOGOS_VACIOS: CatalogosFormulario = {
  actividades: [],
  periodos: [],
  fuentes: [],
  alcances: [],
  unidades: [],
}

/** Estado del modal de consulta (GET /activity-data/:id). */
interface EstadoConsulta {
  /** Fila elegida: aporta el título mientras carga el detalle. */
  seleccion: DatoActividad
  datos: DatoActividad | null
  cargando: boolean
  error: string | null
}

export default function DatosActividad() {
  const navigate = useNavigate()
  const avisar = useAviso()
  const { proyectos, proyecto, cargando: cargandoProyectos, error: errorProyecto, recargar: recargarProyectos, seleccionar } =
    useProyecto()

  const [datos, setDatos] = useState<DatoActividad[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [catalogos, setCatalogos] = useState<CatalogosFormulario>(CATALOGOS_VACIOS)
  const [erroresCatalogos, setErroresCatalogos] = useState<
    Partial<Record<keyof CatalogosFormulario, string>>
  >({})
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [filtroActividad, setFiltroActividad] = useState('todos')
  const [filtroFuente, setFiltroFuente] = useState('todos')
  const [filtroAlcance, setFiltroAlcance] = useState('todos')
  const [pagina, setPagina] = useState(1)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [datoEdicion, setDatoEdicion] = useState<DatoActividad | null>(null)
  const [erroresForm, setErroresForm] = useState<ErroresDato>({})

  const [consulta, setConsulta] = useState<EstadoConsulta | null>(null)
  const [confirmacion, setConfirmacion] = useState<DatoActividad | null>(null)
  const [eliminando, setEliminando] = useState(false)

  // Permisos devueltos por el login (`dato_actividad.*`).
  const puedeVer = tienePermiso('dato_actividad.ver')
  const puedeCrear = tienePermiso('dato_actividad.crear')
  const puedeEditar = tienePermiso('dato_actividad.editar')
  const puedeEliminar = tienePermiso('dato_actividad.eliminar')

  // Numeración de peticiones: al cambiar de proyecto, la respuesta de la
  // petición anterior llega después y se descarta en lugar de pisar los datos.
  const peticionDatosRef = useRef(0)
  const peticionCatalogosRef = useRef(0)

  /** Recarga el listado del proyecto con los filtros de servidor actuales. */
  const recargar = useCallback(async () => {
    const numero = ++peticionDatosRef.current
    if (!proyecto) {
      setDatos([])
      setCargando(false)
      setErrorCarga(null)
      return
    }
    setCargando(true)
    setErrorCarga(null)
    try {
      const lista = await listarDatosActividad({
        projectId: proyecto.id,
        periodId: filtroPeriodo === 'todos' ? undefined : Number(filtroPeriodo),
        activityId: filtroActividad === 'todos' ? undefined : Number(filtroActividad),
        emissionSourceId: filtroFuente === 'todos' ? undefined : Number(filtroFuente),
        scopeId: filtroAlcance === 'todos' ? undefined : Number(filtroAlcance),
      })
      if (numero !== peticionDatosRef.current) return
      setDatos(lista)
    } catch (e) {
      if (numero !== peticionDatosRef.current) return
      setDatos([])
      if (e instanceof ErrorApi && e.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setErrorCarga(mensajeDe(e))
    } finally {
      if (numero === peticionDatosRef.current) setCargando(false)
    }
  }, [proyecto, filtroPeriodo, filtroActividad, filtroFuente, filtroAlcance, navigate])

  useEffect(() => {
    if (!puedeVer) return
    void recargar()
  }, [puedeVer, recargar])

  /** Carga los catálogos que alimentan selectores y filtros del proyecto. */
  const recargarCatalogos = useCallback(async () => {
    const numero = ++peticionCatalogosRef.current
    if (!proyecto) {
      setCatalogos(CATALOGOS_VACIOS)
      setErroresCatalogos({})
      setCargandoCatalogos(false)
      return
    }
    setCargandoCatalogos(true)
    const [actividades, periodos, fuentes, alcances, unidades] = await Promise.allSettled([
      listarActividades(proyecto.id),
      listarPeriodos(proyecto.id),
      listarFuentesEmision(),
      listarAlcances(),
      listarUnidadesActivas(),
    ])
    if (numero !== peticionCatalogosRef.current) return

    const nuevos: CatalogosFormulario = { ...CATALOGOS_VACIOS }
    const errores: Partial<Record<keyof CatalogosFormulario, string>> = {}
    if (actividades.status === 'fulfilled') nuevos.actividades = actividades.value
    else errores.actividades = mensajeDe(actividades.reason)
    if (periodos.status === 'fulfilled') nuevos.periodos = periodos.value
    else errores.periodos = mensajeDe(periodos.reason)
    if (fuentes.status === 'fulfilled') nuevos.fuentes = fuentes.value
    else errores.fuentes = mensajeDe(fuentes.reason)
    if (alcances.status === 'fulfilled') nuevos.alcances = alcances.value
    else errores.alcances = mensajeDe(alcances.reason)
    if (unidades.status === 'fulfilled') nuevos.unidades = unidades.value
    else errores.unidades = mensajeDe(unidades.reason)

    setCatalogos(nuevos)
    setErroresCatalogos(errores)
    setCargandoCatalogos(false)
  }, [proyecto])

  useEffect(() => {
    if (!puedeVer) return
    void recargarCatalogos()
  }, [puedeVer, recargarCatalogos])

  // Cambiar de proyecto invalida búsqueda y filtros: pertenecían al anterior.
  useEffect(() => {
    setBusqueda('')
    setFiltroPeriodo('todos')
    setFiltroActividad('todos')
    setFiltroFuente('todos')
    setFiltroAlcance('todos')
    setPagina(1)
  }, [proyecto?.id])

  /** Vuelve a la primera página cuando cambian los criterios de filtrado. */
  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroPeriodo, filtroActividad, filtroFuente, filtroAlcance])

  /** Lista resultante de aplicar la búsqueda local (los filtros ya son del servidor). */
  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    if (!texto) return datos
    return datos.filter((dato) => {
      const candidatos = [
        dato.activityName,
        dato.processName ?? '',
        dato.whatToCopy,
        dato.quantity,
        dato.unitSymbol,
        dato.emissionSourceName,
        dato.scopeCode,
        dato.scopeName,
        dato.document,
        dato.status,
      ]
      return candidatos.some((candidato) => normalizar(candidato).includes(texto))
    })
  }, [datos, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = filtrados.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1
  const hasta = Math.min(paginaSegura * POR_PAGINA, filtrados.length)
  const visibles = filtrados.slice(desde - 1, hasta)

  /** Primera falla del catálogo, para avisar sin bloquear la pantalla. */
  const avisoCatalogo = useMemo(
    () => Object.values(erroresCatalogos).find((mensaje) => mensaje !== undefined) ?? null,
    [erroresCatalogos],
  )

  /** Abre el formulario en modo alta. */
  function abrirAlta() {
    setDatoEdicion(null)
    setErroresForm({})
    setModalAbierto(true)
  }

  /** Abre el formulario en modo edición con el registro elegido. */
  function abrirEdicion(dato: DatoActividad) {
    setDatoEdicion(dato)
    setErroresForm({})
    setModalAbierto(true)
  }

  /**
   * Guarda alta o edición. Devuelve `true` solo si la API confirmó, para que
   * el modal permanezca abierto mostrando los errores por campo (422).
   */
  async function guardar(datos: DatoActividadFormulario): Promise<boolean> {
    setErroresForm({})
    if (!proyecto) return false
    try {
      if (datoEdicion) {
        await actualizarDatoActividad(datoEdicion.id, datos)
        avisar('Registro de dato de actividad actualizado correctamente.')
      } else {
        await crearDatoActividad(proyecto.id, datos)
        avisar('Dato de actividad creado correctamente.')
      }
      await recargar()
      return true
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) {
        navigate('/login', { replace: true })
        return false
      }
      const campos = e instanceof ErrorApi ? erroresDeApi(e.campos) : {}
      if (Object.keys(campos).length > 0) {
        setErroresForm(campos)
        return false
      }
      avisar(mensajeDe(e))
      return false
    }
  }

  /** Abre la consulta puntual y carga el detalle desde la API. */
  async function consultar(dato: DatoActividad) {
    setConsulta({ seleccion: dato, datos: null, cargando: true, error: null })
    try {
      const detalle = await obtenerDatoActividad(dato.id)
      setConsulta((prev) => (prev ? { ...prev, datos: detalle, cargando: false } : null))
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setConsulta((prev) =>
        prev ? { ...prev, cargando: false, error: mensajeDe(e) } : null,
      )
    }
  }

  /** Ejecuta la eliminación confirmada (el backend borra la fila). */
  async function confirmarEliminacion() {
    if (!confirmacion) return
    setEliminando(true)
    try {
      await eliminarDatoActividad(confirmacion.id)
      avisar('Registro de dato de actividad eliminado.')
      setConfirmacion(null)
      await recargar()
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      avisar(mensajeDe(e))
    } finally {
      setEliminando(false)
    }
  }

  /** Abre el formulario de edición desde la consulta detallada. */
  function editarDesdeConsulta() {
    if (!consulta?.datos) return
    const dato = consulta.datos
    setConsulta(null)
    abrirEdicion(dato)
  }

  /** Sin permiso de lectura no se pide nada al backend. */
  if (!puedeVer) {
    return (
      <PlantillaVista titulo="Datos de actividad" className="gst gst-datos">
        <PageHeader
          titulo="Datos de actividad"
          subtitulo="Registra las cantidades de actividad reportadas en cada documento."
        />
        <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Acceso restringido">
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <TriangleAlert size={26} />
            </span>
            <h3>Acceso restringido</h3>
            <p>
              Tu sesión no tiene el permiso <code>dato_actividad.ver</code> para consultar los
              datos de actividad. Solicita el acceso a un administrador.
            </p>
            <Button variante="contorno" onClick={() => navigate('/inicio')}>
              Volver al inicio
            </Button>
          </div>
        </section>
      </PlantillaVista>
    )
  }

  return (
    <PlantillaVista titulo="Datos de actividad" className="gst gst-datos">
      <PageHeader
        titulo="Datos de actividad"
        subtitulo="Registra las cantidades de actividad reportadas en cada documento."
        acciones={
          puedeCrear ? (
            <Button onClick={abrirAlta} disabled={!proyecto}>
              <Plus size={16} />
              Nuevo dato de actividad
            </Button>
          ) : undefined
        }
      />

      <section className="vst-tarjeta gst-barra" aria-label="Búsqueda y filtros de datos de actividad">
        <div className="gst-buscador">
          <Search size={17} aria-hidden="true" />
          <input
            className="vst-input"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por actividad, documento o cantidad…"
            aria-label="Buscar por actividad, documento o cantidad"
          />
          {busqueda && (
            <button
              type="button"
              className="gst-buscador-limpiar"
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="gst-filtros">
          <label className="gst-filtro">
            <span>Proyecto</span>
            <select
              className="vst-select"
              value={proyecto?.id ?? ''}
              onChange={(e) => seleccionar(Number(e.target.value))}
              disabled={cargandoProyectos || proyectos.length === 0}
            >
              {proyectos.length === 0 && <option value="">Sin proyectos</option>}
              {proyectos.map((opcion) => (
                <option key={opcion.id} value={opcion.id}>
                  {etiquetaProyecto(opcion)}
                </option>
              ))}
            </select>
          </label>

          <label className="gst-filtro">
            <span>Periodo</span>
            <select
              className="vst-select"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              disabled={cargandoCatalogos}
            >
              <option value="todos">Todos</option>
              {catalogos.periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {periodo.name}
                </option>
              ))}
            </select>
          </label>

          <label className="gst-filtro">
            <span>Actividad</span>
            <select
              className="vst-select"
              value={filtroActividad}
              onChange={(e) => setFiltroActividad(e.target.value)}
              disabled={cargandoCatalogos}
            >
              <option value="todos">Todas</option>
              {catalogos.actividades.map((actividad) => (
                <option key={actividad.id} value={actividad.id}>
                  {actividad.name}
                </option>
              ))}
            </select>
          </label>

          <label className="gst-filtro">
            <span>Fuente de emisión</span>
            <select
              className="vst-select"
              value={filtroFuente}
              onChange={(e) => setFiltroFuente(e.target.value)}
              disabled={cargandoCatalogos}
            >
              <option value="todos">Todas</option>
              {catalogos.fuentes.map((fuente) => (
                <option key={fuente.id} value={fuente.id}>
                  {fuente.name}
                </option>
              ))}
            </select>
          </label>

          <label className="gst-filtro">
            <span>Alcance</span>
            <select
              className="vst-select"
              value={filtroAlcance}
              onChange={(e) => setFiltroAlcance(e.target.value)}
              disabled={cargandoCatalogos}
            >
              <option value="todos">Todos</option>
              {catalogos.alcances.map((alcance) => (
                <option key={alcance.id} value={alcance.id}>
                  {alcance.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <span className="gst-contador" aria-live="polite">
          <ClipboardList size={14} aria-hidden="true" />
          {filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </section>

      {avisoCatalogo && (
        <p className="dad-aviso-catalogos" role="alert">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>No se pudieron cargar todos los catálogos: {avisoCatalogo}</span>
          <button type="button" onClick={() => void recargarCatalogos()}>
            Reintentar
          </button>
        </p>
      )}

      <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Listado de datos de actividad">
        {cargandoProyectos && !proyecto ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando proyectos…
          </div>
        ) : errorProyecto && !proyecto ? (
          <div className="gst-vacio" role="alert">
            <span className="gst-vacio-icono" aria-hidden="true">
              <TriangleAlert size={26} />
            </span>
            <h3>No se pudo cargar el catálogo de proyectos</h3>
            <p>{errorProyecto}</p>
            <Button variante="contorno" onClick={() => void recargarProyectos()}>
              Reintentar
            </Button>
          </div>
        ) : !proyecto ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <ClipboardList size={26} />
            </span>
            <h3>No hay proyectos disponibles</h3>
            <p>
              Aún no existe ninguna organización activa en la plataforma. Crea un proyecto para
              poder registrar datos de actividad.
            </p>
          </div>
        ) : cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando datos de actividad…
          </div>
        ) : errorCarga ? (
          <div className="gst-vacio" role="alert">
            <span className="gst-vacio-icono" aria-hidden="true">
              <TriangleAlert size={26} />
            </span>
            <h3>No se pudo cargar el listado</h3>
            <p>{errorCarga}</p>
            <Button variante="contorno" onClick={() => void recargar()}>
              Reintentar
            </Button>
          </div>
        ) : datos.length === 0 ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <ClipboardList size={26} />
            </span>
            <h3>Aún no hay datos de actividad</h3>
            <p>
              {puedeCrear
                ? 'Registra el primer dato con el botón «Nuevo dato de actividad» para capturar la cantidad reportada en un documento.'
                : 'Todavía no se han registrado datos de actividad en este proyecto.'}
            </p>
            {puedeCrear && (
              <Button variante="contorno" onClick={abrirAlta}>
                <Plus size={15} />
                Nuevo dato de actividad
              </Button>
            )}
          </div>
        ) : visibles.length === 0 ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <Search size={26} />
            </span>
            <h3>Sin coincidencias</h3>
            <p>Ningún registro coincide con la búsqueda o los filtros aplicados.</p>
            <Button
              variante="contorno"
              onClick={() => {
                setBusqueda('')
                setFiltroPeriodo('todos')
                setFiltroActividad('todos')
                setFiltroFuente('todos')
                setFiltroAlcance('todos')
              }}
            >
              <X size={15} />
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <TablaDatosActividad
              datos={visibles}
              puedeEditar={puedeEditar}
              puedeEliminar={puedeEliminar}
              onConsultar={(dato) => void consultar(dato)}
              onEditar={abrirEdicion}
              onEliminar={setConfirmacion}
            />

            <div className="gst-paginacion">
              <p className="gst-paginacion-info">
                Mostrando <b>{desde}–{hasta}</b> de <b>{filtrados.length}</b>{' '}
                {filtrados.length === 1 ? 'registro' : 'registros'}
                {' · '}
                <b>{datos.length}</b> en total
              </p>
              <nav className="gst-paginacion-botones" aria-label="Paginación de datos de actividad">
                <button
                  type="button"
                  className="gst-pagina"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaSegura <= 1}
                  aria-label="Página anterior"
                >
                  ‹
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                  <button
                    key={numero}
                    type="button"
                    className={`gst-pagina ${numero === paginaSegura ? 'gst-pagina--activo' : ''}`}
                    onClick={() => setPagina(numero)}
                    aria-current={numero === paginaSegura ? 'page' : undefined}
                  >
                    {numero}
                  </button>
                ))}
                <button
                  type="button"
                  className="gst-pagina"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaSegura >= totalPaginas}
                  aria-label="Página siguiente"
                >
                  ›
                </button>
              </nav>
            </div>
          </>
        )}

        <p className="gst-demo">
          <ClipboardList size={14} aria-hidden="true" />
          <span>
            Datos reales de <code>GET /api/v1/activity-data</code>. Se guarda únicamente la
            cantidad original del documento (ej. <code>4000</code> kWh); el factor de emisión y
            el resultado en CO₂e pertenecen al módulo de cálculos.
          </span>
        </p>
      </section>

      <ModalDatoActividad
        abierto={modalAbierto}
        dato={datoEdicion}
        catalogos={catalogos}
        cargandoCatalogos={cargandoCatalogos}
        erroresApi={erroresForm}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardar}
      />

      <Modal
        abierto={consulta !== null}
        titulo={
          consulta ? `Dato de actividad «${consulta.seleccion.activityName}»` : 'Dato de actividad'
        }
        onCerrar={() => setConsulta(null)}
        ancho="560px"
      >
        {consulta?.cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando detalle…
          </div>
        ) : consulta?.error ? (
          <div className="gst-vacio" role="alert">
            <span className="gst-vacio-icono" aria-hidden="true">
              <TriangleAlert size={26} />
            </span>
            <h3>No se pudo consultar el registro</h3>
            <p>{consulta.error}</p>
            <Button variante="contorno" onClick={() => void consultar(consulta.seleccion)}>
              Reintentar
            </Button>
          </div>
        ) : consulta?.datos ? (
          <>
            <dl className="dad-detalle">
              <div>
                <dt>Actividad</dt>
                <dd>{consulta.datos.activityName}</dd>
              </div>
              <div>
                <dt>Proceso</dt>
                <dd>{consulta.datos.processName ?? '—'}</dd>
              </div>
              <div>
                <dt>Periodo de medición</dt>
                <dd>{consulta.datos.periodName}</dd>
              </div>
              <div>
                <dt>Cantidad</dt>
                <dd className="dad-detalle-mono">{consulta.datos.quantity}</dd>
              </div>
              <div>
                <dt>Unidad</dt>
                <dd>
                  {consulta.datos.unitName}
                  {consulta.datos.unitSymbol ? ` (${consulta.datos.unitSymbol})` : ''}
                </dd>
              </div>
              <div>
                <dt>Fuente de emisión</dt>
                <dd>{consulta.datos.emissionSourceName}</dd>
              </div>
              <div>
                <dt>Alcance</dt>
                <dd>
                  {consulta.datos.scopeCode} — {consulta.datos.scopeName}
                </dd>
              </div>
              <div>
                <dt>Qué se copia</dt>
                <dd>{consulta.datos.whatToCopy}</dd>
              </div>
              <div>
                <dt>Documento</dt>
                <dd>{consulta.datos.document}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <span className="gst-estado gst-estado--activo">{consulta.datos.status}</span>
                </dd>
              </div>
              <div>
                <dt>Registrado por</dt>
                <dd>{consulta.datos.registeredBy?.name ?? '—'}</dd>
              </div>
              <div>
                <dt>Creado</dt>
                <dd>{fechaLegible(consulta.datos.createdAt)}</dd>
              </div>
              <div>
                <dt>Actualizado</dt>
                <dd>{fechaLegible(consulta.datos.updatedAt)}</dd>
              </div>
              <div>
                <dt>Identificador</dt>
                <dd className="dad-detalle-mono">{consulta.datos.id}</dd>
              </div>
            </dl>

            <div className="gst-modal-pie">
              <Button variante="contorno" onClick={() => setConsulta(null)}>
                Cerrar
              </Button>
              {puedeEditar && <Button onClick={editarDesdeConsulta}>Editar registro</Button>}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        abierto={confirmacion !== null}
        titulo="Eliminar dato de actividad"
        onCerrar={() => setConfirmacion(null)}
        ancho="440px"
      >
        <div className="gst-confirmar">
          <span className="gst-confirmar-icono" aria-hidden="true">
            <TriangleAlert size={26} />
          </span>
          <h4>¿Eliminar este registro?</h4>
          <p>
            El dato de actividad <b>{confirmacion?.whatToCopy}</b> del documento{' '}
            <b>{confirmacion?.document}</b> se eliminará de forma permanente. Esta acción no se
            puede deshacer.
          </p>
          <div className="gst-confirmar-pie">
            <Button
              variante="contorno"
              onClick={() => setConfirmacion(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button onClick={() => void confirmarEliminacion()} disabled={eliminando}>
              {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </PlantillaVista>
  )
}
