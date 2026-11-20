import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Pencil, Plus, Power, Search, X } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import { usePerfil } from '../../../context/PerfilContext'
import ModalOrganizacion from './components/ModalOrganizacion'
import {
  actualizarOrganizacion,
  cambiarEstadoOrganizacion,
  crearOrganizacion,
  etiquetaTipo,
  listarDepartamentos,
  listarMunicipios,
  listarOrganizaciones,
} from '../../../services/organizacionesService'
import type {
  Departamento,
  Municipio,
  Organizacion,
  OrganizacionFormulario,
} from '../../../services/organizacionesService'
import './Organizaciones.css'

const POR_PAGINA = 8

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function Organizaciones() {
  const avisar = useAviso()
  const navigate = useNavigate()
  const { puede } = usePerfil()
  const puedeCrear = puede('organizacion.crear')
  const puedeEditar = puede('organizacion.editar')
  const puedeVerSedes = puede('sede.ver')

  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [departamentoId, setDepartamentoId] = useState('')
  const [municipioId, setMunicipioId] = useState('')
  const [estado, setEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [pagina, setPagina] = useState(1)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [edicion, setEdicion] = useState<Organizacion | null>(null)

  const recargar = useCallback(async () => {
    try {
      const [lista, territorios] = await Promise.all([listarOrganizaciones(), listarDepartamentos()])
      setOrganizaciones(lista)
      setDepartamentos(territorios)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar las organizaciones.')
    } finally {
      setCargando(false)
    }
  }, [avisar])

  useEffect(() => {
    void recargar()
  }, [recargar])

  useEffect(() => {
    if (!departamentoId) {
      setMunicipios([])
      setMunicipioId('')
      return
    }
    let vivo = true
    void listarMunicipios(departamentoId)
      .then((lista) => {
        if (!vivo) return
        setMunicipios(lista)
        setMunicipioId((actual) => (lista.some((item) => item.id === actual) ? actual : ''))
      })
      .catch((error: unknown) => {
        if (vivo) avisar(error instanceof Error ? error.message : 'No fue posible cargar los municipios.')
      })
    return () => {
      vivo = false
    }
  }, [departamentoId, avisar])

  useEffect(() => {
    setPagina(1)
  }, [busqueda, departamentoId, municipioId, estado])

  const filtradas = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return organizaciones.filter((organizacion) => {
      if (departamentoId && organizacion.departamentoId !== departamentoId) return false
      if (municipioId && organizacion.municipioId !== municipioId) return false
      if (estado !== 'todos' && organizacion.estado !== estado) return false
      if (!texto) return true
      return [organizacion.nombre, organizacion.nombreCorto, organizacion.nit, organizacion.municipioNombre]
        .some((valor) => normalizar(valor).includes(texto))
    })
  }, [organizaciones, busqueda, departamentoId, municipioId, estado])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = filtradas.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1
  const hasta = Math.min(paginaSegura * POR_PAGINA, filtradas.length)
  const visibles = filtradas.slice(desde - 1, hasta)

  async function guardar(datos: OrganizacionFormulario) {
    try {
      if (edicion) {
        await actualizarOrganizacion(edicion.id, datos)
        avisar('Organización actualizada.')
      } else {
        await crearOrganizacion(datos)
        avisar('Organización creada.')
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar la organización.')
      return false
    }
  }

  async function alternar(organizacion: Organizacion) {
    const siguiente = organizacion.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await cambiarEstadoOrganizacion(organizacion, siguiente)
      avisar(siguiente === 'activo' ? 'Organización activada.' : 'Organización desactivada.')
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado.')
    }
  }

  return (
    <PlantillaVista titulo="Organizaciones" className="gst gst-usuarios">
      <PageHeader
        titulo="Organizaciones"
        subtitulo="Departamento, municipio y organización. Las sedes viven dentro de cada una."
        acciones={
          puedeCrear ? (
            <Button
              onClick={() => {
                setEdicion(null)
                setModalAbierto(true)
              }}
            >
              <Plus size={16} />
              Nueva organización
            </Button>
          ) : null
        }
      />

      <section className="vst-tarjeta gst-barra" aria-label="Búsqueda y filtros de organizaciones">
        <div className="gst-buscador">
          <Search size={17} aria-hidden="true" />
          <input
            className="vst-input"
            type="search"
            value={busqueda}
            placeholder="Buscar por nombre, NIT o municipio…"
            aria-label="Buscar organizaciones"
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda ? (
            <button type="button" className="gst-buscador-limpiar" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
              <X size={14} />
            </button>
          ) : null}
        </div>
        <div className="gst-filtros">
          <label className="gst-filtro">
            <span>Departamento</span>
            <select className="vst-select" value={departamentoId} onChange={(e) => setDepartamentoId(e.target.value)}>
              <option value="">Todos</option>
              {departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="gst-filtro">
            <span>Municipio</span>
            <select
              className="vst-select"
              value={municipioId}
              disabled={!departamentoId}
              onChange={(e) => setMunicipioId(e.target.value)}
            >
              <option value="">Todos</option>
              {municipios.map((municipio) => (
                <option key={municipio.id} value={municipio.id}>
                  {municipio.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="gst-filtro">
            <span>Estado</span>
            <select className="vst-select" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </label>
        </div>
        <span className="gst-contador" aria-live="polite">
          {filtradas.length} {filtradas.length === 1 ? 'organización' : 'organizaciones'}
        </span>
      </section>

      <section className="vst-tarjeta gst-tabla-tarjeta">
        {cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando organizaciones…
          </div>
        ) : visibles.length === 0 ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <Building2 size={28} />
            </span>
            <p>No hay organizaciones con esos filtros.</p>
          </div>
        ) : (
          <>
            <div className="gst-tabla-envoltura">
              <table className="gst-tabla">
                <caption className="gst-sr-only">Organizaciones registradas</caption>
                <thead>
                  <tr>
                    <th scope="col">Organización</th>
                    <th scope="col">Territorio</th>
                    <th scope="col">NIT</th>
                    <th scope="col">Sedes</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((organizacion) => (
                    <tr key={organizacion.id} className={organizacion.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}>
                      <td>
                        <b>{organizacion.nombre}</b>
                        <div className="gst-correo">{etiquetaTipo(organizacion.tipo)}</div>
                      </td>
                      <td>
                        {organizacion.municipioNombre}
                        <div className="gst-correo">{organizacion.departamentoNombre}</div>
                      </td>
                      <td>{organizacion.nit}</td>
                      <td>{organizacion.sedesActivas}</td>
                      <td>
                        <span className={`gst-estado gst-estado--${organizacion.estado}`}>
                          {organizacion.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <span className="gst-acciones">
                          {puedeVerSedes ? (
                            <button
                              type="button"
                              className="gst-accion"
                              aria-label={`Ver sedes de ${organizacion.nombre}`}
                              title="Sedes"
                              onClick={() => navigate(`/gestion/organizaciones/${organizacion.id}`)}
                            >
                              <Building2 size={15} />
                            </button>
                          ) : null}
                          {puedeEditar ? (
                            <>
                              <button
                                type="button"
                                className="gst-accion"
                                aria-label={`Editar ${organizacion.nombre}`}
                                onClick={() => {
                                  setEdicion(organizacion)
                                  setModalAbierto(true)
                                }}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className={`gst-accion ${organizacion.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                                aria-label={
                                  organizacion.estado === 'activo'
                                    ? `Desactivar ${organizacion.nombre}`
                                    : `Activar ${organizacion.nombre}`
                                }
                                onClick={() => void alternar(organizacion)}
                              >
                                <Power size={15} />
                              </button>
                            </>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="gst-paginacion">
              <p className="gst-paginacion-info">
                Mostrando <b>{desde}–{hasta}</b> de <b>{filtradas.length}</b>
              </p>
              <nav className="gst-paginacion-botones" aria-label="Paginación de organizaciones">
                <button type="button" className="gst-pagina" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaSegura <= 1} aria-label="Página anterior">
                  ‹
                </button>
                <button type="button" className="gst-pagina" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaSegura >= totalPaginas} aria-label="Página siguiente">
                  ›
                </button>
              </nav>
            </div>
          </>
        )}
      </section>

      <ModalOrganizacion
        abierto={modalAbierto}
        organizacion={edicion}
        departamentos={departamentos}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardar}
      />
    </PlantillaVista>
  )
}
