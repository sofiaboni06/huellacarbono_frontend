import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Power, Ruler, Search, TriangleAlert, X } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import TablaUnidadesMedida from './components/TablaUnidadesMedida'
import ModalUnidadMedida from './components/ModalUnidadMedida'
import { usePerfil } from '../../../context/PerfilContext'
import { erroresDeApi, type ErroresUnidad } from './erroresApi'
import { ErrorApi } from '../../../services/api'
import {
  actualizarUnidad,
  cambiarEstadoUnidad,
  crearUnidad,
  listarUnidades,
  obtenerUnidad,
} from '../../../services/unidadesMedidaService'
import type { UnidadMedida, UnidadMedidaFormulario } from '../../../services/tipos'
import './UnidadesMedida.css'

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
  return 'No se pudo completar la operación. Intenta nuevamente.'
}

/** Estado del modal de consulta (GET /measurement-units/:id). */
interface EstadoConsulta {
  /** Fila elegida: aporta el título mientras carga el detalle. */
  seleccion: UnidadMedida
  /** Detalle devuelto por la API (nulo mientras carga o si falla). */
  datos: UnidadMedida | null
  cargando: boolean
  error: string | null
}

/**
 * Vista de Gestión de Unidades de Medida.
 *
 * Listado real contra `GET /api/v1/measurement-units` con búsqueda, filtros y
 * paginación; alta y edición por formulario validado; consulta puntual por
 * identificador; y activación/desactivación mediante `PATCH { active }`, que
 * es el mecanismo que expone el backend.
 */
export default function UnidadesMedida() {
  const avisar = useAviso()
  const navigate = useNavigate()
  const { puede } = usePerfil()

  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [filtroMagnitud, setFiltroMagnitud] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [pagina, setPagina] = useState(1)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [unidadEdicion, setUnidadEdicion] = useState<UnidadMedida | null>(null)
  const [erroresApi, setErroresApi] = useState<ErroresUnidad>({})

  const [consulta, setConsulta] = useState<EstadoConsulta | null>(null)
  const [estadoConfirmacion, setEstadoConfirmacion] = useState<UnidadMedida | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const puedeVer = puede('unidad_medida.ver')
  const puedeCrear = puede('unidad_medida.crear')
  const puedeEditar = puede('unidad_medida.editar')

  /** Recarga el listado completo (incluidas las inactivas). */
  const recargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga(null)
    try {
      const lista = await listarUnidades()
      setUnidades(lista)
    } catch (e) {
      setUnidades([])
      if (e instanceof ErrorApi && e.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      setErrorCarga(mensajeDe(e))
    } finally {
      setCargando(false)
    }
  }, [navigate])

  useEffect(() => {
    if (!puedeVer) return
    void recargar()
  }, [puedeVer, recargar])

  // Vuelve a la primera página cuando cambian los criterios de filtrado.
  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroMagnitud, filtroEstado])

  /** Magnitudes existentes hoy, para el filtro (sin valores inventados). */
  const opcionesMagnitud = useMemo(() => {
    const magnitudes = new Set(unidades.map((unidad) => unidad.magnitude))
    return Array.from(magnitudes).sort((a, b) => a.localeCompare(b, 'es'))
  }, [unidades])

  /** Lista resultante de aplicar búsqueda y filtros. */
  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return unidades.filter((unidad) => {
      if (filtroMagnitud !== 'todas' && unidad.magnitude !== filtroMagnitud) return false
      if (filtroEstado !== 'todos' && (unidad.active ? 'activo' : 'inactivo') !== filtroEstado) {
        return false
      }
      if (!texto) return true
      const candidatos = [unidad.code, unidad.name, unidad.symbol, unidad.magnitude]
      return candidatos.some((candidato) => normalizar(candidato).includes(texto))
    })
  }, [unidades, busqueda, filtroMagnitud, filtroEstado])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = filtrados.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1
  const hasta = Math.min(paginaSegura * POR_PAGINA, filtrados.length)
  const visibles = filtrados.slice(desde - 1, hasta)

  const activas = unidades.filter((unidad) => unidad.active).length

  /** Abre el formulario en modo alta. */
  function abrirAlta() {
    setUnidadEdicion(null)
    setErroresApi({})
    setModalAbierto(true)
  }

  /** Abre el formulario en modo edición con la unidad elegida. */
  function abrirEdicion(unidad: UnidadMedida) {
    setUnidadEdicion(unidad)
    setErroresApi({})
    setModalAbierto(true)
  }

  /**
   * Guarda alta o edición. Devuelve `true` solo si la API confirmó, para que
   * el modal permanezca abierto mostrando los errores por campo (422/409).
   */
  async function guardar(datos: UnidadMedidaFormulario): Promise<boolean> {
    setErroresApi({})
    try {
      if (unidadEdicion) {
        const actualizada = await actualizarUnidad(unidadEdicion.id, datos)
        avisar(`Unidad «${actualizada.name}» actualizada correctamente.`)
      } else {
        const creada = await crearUnidad(datos)
        avisar(`Unidad «${creada.name}» creada correctamente.`)
      }
      await recargar()
      return true
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) {
        navigate('/login', { replace: true })
        return false
      }
      const mensaje = mensajeDe(e)
      const campos = e instanceof ErrorApi ? erroresDeApi(e.campos) : {}
      if (Object.keys(campos).length > 0) {
        setErroresApi(campos)
        return false
      }
      avisar(mensaje)
      return false
    }
  }

  /** Abre la consulta puntual y carga el detalle desde la API. */
  async function consultar(unidad: UnidadMedida) {
    setConsulta({ seleccion: unidad, datos: null, cargando: true, error: null })
    try {
      const detalle = await obtenerUnidad(unidad.id)
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

  /** Pide confirmación antes de alternar el estado (PATCH { active }). */
  function solicitarCambioEstado(unidad: UnidadMedida) {
    setEstadoConfirmacion(unidad)
  }

  /** Ejecuta la activación/desactivación confirmada. */
  async function confirmarCambioEstado() {
    if (!estadoConfirmacion) return
    const activar = !estadoConfirmacion.active
    setCambiandoEstado(true)
    try {
      const actualizada = await cambiarEstadoUnidad(estadoConfirmacion.id, activar)
      avisar(
        activar
          ? `Unidad «${actualizada.name}» activada.`
          : `Unidad «${actualizada.name}» desactivada.`,
      )
      setEstadoConfirmacion(null)
      await recargar()
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      avisar(mensajeDe(e))
    } finally {
      setCambiandoEstado(false)
    }
  }

  /** Abre el formulario de edición desde la consulta detallada. */
  function editarDesdeConsulta() {
    if (!consulta?.datos) return
    const unidad = consulta.datos
    setConsulta(null)
    abrirEdicion(unidad)
  }

  /** Sin permiso de lectura no se pide nada al backend. */
  if (!puedeVer) {
    return (
      <PlantillaVista titulo="Unidades de Medida" className="gst gst-unidades">
        <PageHeader
          titulo="Unidades de Medida"
          subtitulo="Administra las unidades de medida utilizadas en la plataforma."
        />
        <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Acceso restringido">
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <TriangleAlert size={26} />
            </span>
            <h3>Acceso restringido</h3>
            <p>
              Tu sesión no tiene el permiso <code>unidad_medida.ver</code> para consultar las
              unidades de medida. Solicita el acceso a un administrador.
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
    <PlantillaVista titulo="Unidades de Medida" className="gst gst-unidades">
      <PageHeader
        titulo="Unidades de Medida"
        subtitulo="Administra las unidades de medida utilizadas en la plataforma."
        acciones={
          puedeCrear ? (
            <Button onClick={abrirAlta}>
              <Plus size={16} />
              Nueva unidad de medida
            </Button>
          ) : undefined
        }
      />

      <section className="vst-tarjeta gst-barra" aria-label="Búsqueda y filtros de unidades de medida">
        <div className="gst-buscador">
          <Search size={17} aria-hidden="true" />
          <input
            className="vst-input"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, nombre o símbolo…"
            aria-label="Buscar por código, nombre o símbolo"
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
            <span>Magnitud</span>
            <select
              className="vst-select"
              value={filtroMagnitud}
              onChange={(e) => setFiltroMagnitud(e.target.value)}
            >
              <option value="todas">Todas</option>
              {opcionesMagnitud.map((magnitud) => (
                <option key={magnitud} value={magnitud}>
                  {magnitud}
                </option>
              ))}
            </select>
          </label>

          <label className="gst-filtro">
            <span>Estado</span>
            <select
              className="vst-select"
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(e.target.value as 'todos' | 'activo' | 'inactivo')
              }
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </label>
        </div>

        <span className="gst-contador" aria-live="polite">
          <Ruler size={14} aria-hidden="true" />
          {filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </section>

      <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Listado de unidades de medida">
        {cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando unidades de medida…
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
        ) : unidades.length === 0 ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <Ruler size={26} />
            </span>
            <h3>Aún no hay unidades de medida</h3>
            <p>
              {puedeCrear
                ? 'Crea la primera unidad con el botón «Nueva unidad de medida» para poder usarla en los cálculos.'
                : 'Todavía no se han registrado unidades de medida en la plataforma.'}
            </p>
            {puedeCrear && (
              <Button variante="contorno" onClick={abrirAlta}>
                <Plus size={15} />
                Nueva unidad de medida
              </Button>
            )}
          </div>
        ) : visibles.length === 0 ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <Search size={26} />
            </span>
            <h3>Sin coincidencias</h3>
            <p>Ninguna unidad coincide con la búsqueda o los filtros aplicados.</p>
            <Button
              variante="contorno"
              onClick={() => {
                setBusqueda('')
                setFiltroMagnitud('todas')
                setFiltroEstado('todos')
              }}
            >
              <X size={15} />
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <TablaUnidadesMedida
              unidades={visibles}
              puedeEditar={puedeEditar}
              onConsultar={(unidad) => void consultar(unidad)}
              onEditar={abrirEdicion}
              onAlternarEstado={solicitarCambioEstado}
            />

            <div className="gst-paginacion">
              <p className="gst-paginacion-info">
                Mostrando <b>{desde}–{hasta}</b> de <b>{filtrados.length}</b>{' '}
                {filtrados.length === 1 ? 'unidad' : 'unidades'}
                {unidades.length > 0 ? (
                  <>
                    {' · '}
                    <b>{activas}</b> activa{activas === 1 ? '' : 's'}
                  </>
                ) : null}
              </p>
              <nav className="gst-paginacion-botones" aria-label="Paginación de unidades de medida">
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
          <Ruler size={14} aria-hidden="true" />
          <span>
            Datos reales de <code>GET /api/v1/measurement-units</code>. El factor base se muestra
            tal cual llega del backend, como decimal de 24 dígitos con 12 decimales, sin
            convertirlo a número.
          </span>
        </p>
      </section>

      <ModalUnidadMedida
        abierto={modalAbierto}
        unidad={unidadEdicion}
        erroresApi={erroresApi}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardar}
      />

      <Modal
        abierto={consulta !== null}
        titulo={
          consulta ? `Unidad «${consulta.seleccion.name}»` : 'Unidad de medida'
        }
        onCerrar={() => setConsulta(null)}
        ancho="480px"
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
            <h3>No se pudo consultar la unidad</h3>
            <p>{consulta.error}</p>
            <Button variante="contorno" onClick={() => void consultar(consulta.seleccion)}>
              Reintentar
            </Button>
          </div>
        ) : consulta?.datos ? (
          <>
            <dl className="umd-detalle">
              <div>
                <dt>Código</dt>
                <dd className="umd-detalle-mono">{consulta.datos.code}</dd>
              </div>
              <div>
                <dt>Nombre</dt>
                <dd>{consulta.datos.name}</dd>
              </div>
              <div>
                <dt>Símbolo</dt>
                <dd className="umd-detalle-mono">{consulta.datos.symbol}</dd>
              </div>
              <div>
                <dt>Magnitud</dt>
                <dd>{consulta.datos.magnitude}</dd>
              </div>
              <div>
                <dt>Factor base</dt>
                <dd className="umd-detalle-mono">{consulta.datos.baseFactor}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>
                  <span
                    className={`gst-estado gst-estado--${
                      consulta.datos.active ? 'activo' : 'inactivo'
                    }`}
                  >
                    {consulta.datos.active ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Identificador</dt>
                <dd className="umd-detalle-mono">{consulta.datos.id}</dd>
              </div>
            </dl>

            <div className="gst-modal-pie">
              <Button variante="contorno" onClick={() => setConsulta(null)}>
                Cerrar
              </Button>
              {puedeEditar && (
                <Button onClick={editarDesdeConsulta}>Editar unidad</Button>
              )}
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        abierto={estadoConfirmacion !== null}
        titulo={
          estadoConfirmacion?.active ? 'Desactivar unidad de medida' : 'Activar unidad de medida'
        }
        onCerrar={() => setEstadoConfirmacion(null)}
        ancho="420px"
      >
        <div className="gst-confirmar">
          <span className="gst-confirmar-icono" aria-hidden="true">
            <Power size={26} />
          </span>
          <h4>
            {estadoConfirmacion?.active
              ? '¿Desactivar esta unidad?'
              : '¿Activar esta unidad?'}
          </h4>
          <p>
            {estadoConfirmacion?.active ? (
              <>
                La unidad <b>{estadoConfirmacion?.name}</b> quedará marcada como inactiva y no
                podrá usarse en nuevos cálculos. Podrás reactivarla en cualquier momento.
              </>
            ) : (
              <>
                La unidad <b>{estadoConfirmacion?.name}</b> volverá a estar disponible en la
                plataforma.
              </>
            )}
          </p>
          <div className="gst-confirmar-pie">
            <Button
              variante="contorno"
              onClick={() => setEstadoConfirmacion(null)}
              disabled={cambiandoEstado}
            >
              Cancelar
            </Button>
            <Button onClick={() => void confirmarCambioEstado()} disabled={cambiandoEstado}>
              {cambiandoEstado
                ? 'Aplicando…'
                : estadoConfirmacion?.active
                  ? 'Sí, desactivar'
                  : 'Sí, activar'}
            </Button>
          </div>
        </div>
      </Modal>
    </PlantillaVista>
  )
}
