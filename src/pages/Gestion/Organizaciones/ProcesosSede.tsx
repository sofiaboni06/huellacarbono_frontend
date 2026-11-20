import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ListTree, Pencil, Plus, Power } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import { usePerfil } from '../../../context/PerfilContext'
import ModalFicha from './components/ModalFicha'
import { obtenerOrganizacion, obtenerSede } from '../../../services/organizacionesService'
import type { Organizacion, Sede } from '../../../services/organizacionesService'
import {
  actualizarActividad,
  actualizarProceso,
  cambiarEstadoActividad,
  cambiarEstadoProceso,
  crearActividad,
  crearProceso,
  listarActividades,
  listarProcesos,
} from '../../../services/procesosService'
import type { Ficha, FichaFormulario } from '../../../services/procesosService'
import './Organizaciones.css'

export default function ProcesosSede() {
  const { id = '', sedeId = '' } = useParams()
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrearProceso = puede('proceso.crear')
  const puedeEditarProceso = puede('proceso.editar')
  const puedeCrearActividad = puede('actividad.crear')
  const puedeEditarActividad = puede('actividad.editar')

  const [organizacion, setOrganizacion] = useState<Organizacion | null>(null)
  const [sede, setSede] = useState<Sede | null>(null)
  const [procesos, setProcesos] = useState<Ficha[]>([])
  const [actividades, setActividades] = useState<Ficha[]>([])
  const [procesoActivo, setProcesoActivo] = useState<Ficha | null>(null)
  const [cargando, setCargando] = useState(true)
  const [modalProceso, setModalProceso] = useState(false)
  const [edicionProceso, setEdicionProceso] = useState<Ficha | null>(null)
  const [modalActividad, setModalActividad] = useState(false)
  const [edicionActividad, setEdicionActividad] = useState<Ficha | null>(null)

  const cargarActividades = useCallback(
    async (proceso: Ficha | null) => {
      if (!proceso) {
        setActividades([])
        return
      }
      const lista = await listarActividades(proceso.id)
      setActividades(lista)
    },
    [],
  )

  const recargar = useCallback(async () => {
    try {
      const [ficha, lugar, lista] = await Promise.all([
        obtenerOrganizacion(id),
        obtenerSede(sedeId),
        listarProcesos(sedeId),
      ])
      setOrganizacion(ficha)
      setSede(lugar)
      setProcesos(lista)
      setProcesoActivo((actual) => {
        if (!actual) return null
        return lista.find((proceso) => proceso.id === actual.id) ?? null
      })
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar los procesos.')
    } finally {
      setCargando(false)
    }
  }, [avisar, id, sedeId])

  useEffect(() => {
    void recargar()
  }, [recargar])

  useEffect(() => {
    void cargarActividades(procesoActivo).catch((error: unknown) => {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar las actividades.')
    })
  }, [procesoActivo, cargarActividades, avisar])

  async function guardarProceso(datos: FichaFormulario) {
    try {
      if (edicionProceso) {
        const actualizado = await actualizarProceso(edicionProceso.id, datos)
        if (procesoActivo?.id === actualizado.id) setProcesoActivo(actualizado)
        avisar('Proceso actualizado.')
      } else {
        await crearProceso(sedeId, datos)
        avisar('Proceso creado.')
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar el proceso.')
      return false
    }
  }

  async function alternarProceso(proceso: Ficha) {
    const siguiente = proceso.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      const actualizado = await cambiarEstadoProceso(proceso, siguiente)
      if (procesoActivo?.id === actualizado.id) setProcesoActivo(actualizado)
      avisar(siguiente === 'activo' ? 'Proceso activado.' : 'Proceso desactivado.')
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado del proceso.')
    }
  }

  async function guardarActividad(datos: FichaFormulario) {
    if (!procesoActivo) return false
    try {
      if (edicionActividad) {
        await actualizarActividad(edicionActividad.id, datos)
        avisar('Actividad actualizada.')
      } else {
        await crearActividad(procesoActivo.id, datos)
        avisar('Actividad creada.')
      }
      await cargarActividades(procesoActivo)
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar la actividad.')
      return false
    }
  }

  async function alternarActividad(actividad: Ficha) {
    const siguiente = actividad.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await cambiarEstadoActividad(actividad, siguiente)
      avisar(siguiente === 'activo' ? 'Actividad activada.' : 'Actividad desactivada.')
      await cargarActividades(procesoActivo)
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado de la actividad.')
    }
  }

  const titulo = sede ? `Procesos de ${sede.nombre}` : 'Procesos'

  return (
    <PlantillaVista titulo={titulo} className="gst gst-usuarios">
      <PageHeader
        titulo={titulo}
        subtitulo={
          organizacion && sede
            ? `${organizacion.nombre} · ${organizacion.municipioNombre}`
            : 'Procesos y actividades de la sede'
        }
        acciones={
          <div className="gst-acciones">
            <Link to={`/gestion/organizaciones/${id}`} className="hv-btn hv-btn-contorno">
              <ArrowLeft size={16} />
              Sedes
            </Link>
            {puedeCrearProceso && sede?.estado === 'activo' ? (
              <Button
                onClick={() => {
                  setEdicionProceso(null)
                  setModalProceso(true)
                }}
              >
                <Plus size={16} />
                Nuevo proceso
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="vst-tarjeta gst-tabla-tarjeta">
        {cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando procesos…
          </div>
        ) : procesos.length === 0 ? (
          <div className="gst-vacio">
            <p>Esta sede todavía no tiene procesos.</p>
          </div>
        ) : (
          <div className="gst-tabla-envoltura">
            <table className="gst-tabla">
              <caption className="gst-sr-only">Procesos de la sede</caption>
              <thead>
                <tr>
                  <th scope="col">Proceso</th>
                  <th scope="col">Actividades</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {procesos.map((proceso) => (
                  <tr
                    key={proceso.id}
                    className={proceso.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}
                  >
                    <td>
                      <b>{proceso.nombre}</b>
                      {proceso.descripcion ? <div className="gst-correo">{proceso.descripcion}</div> : null}
                    </td>
                    <td>{proceso.actividadesActivas ?? 0}</td>
                    <td>
                      <span className={`gst-estado gst-estado--${proceso.estado}`}>
                        {proceso.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <span className="gst-acciones">
                        <button
                          type="button"
                          className="gst-accion"
                          aria-label={`Ver actividades de ${proceso.nombre}`}
                          onClick={() => setProcesoActivo(proceso)}
                        >
                          <ListTree size={15} />
                        </button>
                        {puedeEditarProceso ? (
                          <>
                            <button
                              type="button"
                              className="gst-accion"
                              aria-label={`Editar ${proceso.nombre}`}
                              onClick={() => {
                                setEdicionProceso(proceso)
                                setModalProceso(true)
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className={`gst-accion ${proceso.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                              aria-label={
                                proceso.estado === 'activo'
                                  ? `Desactivar ${proceso.nombre}`
                                  : `Activar ${proceso.nombre}`
                              }
                              onClick={() => void alternarProceso(proceso)}
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
        )}
      </section>

      <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Actividades del proceso">
        <div className="org-resumen">
          <b>{procesoActivo ? `Actividades de ${procesoActivo.nombre}` : 'Actividades'}</b>
          {puedeCrearActividad && procesoActivo?.estado === 'activo' ? (
            <Button
              onClick={() => {
                setEdicionActividad(null)
                setModalActividad(true)
              }}
            >
              <Plus size={16} />
              Nueva actividad
            </Button>
          ) : null}
        </div>
        {!procesoActivo ? (
          <div className="gst-vacio">
            <p>Elige un proceso para ver sus actividades.</p>
          </div>
        ) : actividades.length === 0 ? (
          <div className="gst-vacio">
            <p>Este proceso todavía no tiene actividades.</p>
          </div>
        ) : (
          <div className="gst-tabla-envoltura">
            <table className="gst-tabla">
              <caption className="gst-sr-only">Actividades del proceso</caption>
              <thead>
                <tr>
                  <th scope="col">Actividad</th>
                  <th scope="col">Estado</th>
                  {puedeEditarActividad ? <th scope="col">Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {actividades.map((actividad) => (
                  <tr
                    key={actividad.id}
                    className={actividad.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}
                  >
                    <td>
                      <b>{actividad.nombre}</b>
                      {actividad.descripcion ? (
                        <div className="gst-correo">{actividad.descripcion}</div>
                      ) : null}
                    </td>
                    <td>
                      <span className={`gst-estado gst-estado--${actividad.estado}`}>
                        {actividad.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {puedeEditarActividad ? (
                      <td>
                        <span className="gst-acciones">
                          <button
                            type="button"
                            className="gst-accion"
                            aria-label={`Editar ${actividad.nombre}`}
                            onClick={() => {
                              setEdicionActividad(actividad)
                              setModalActividad(true)
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`gst-accion ${actividad.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                            aria-label={
                              actividad.estado === 'activo'
                                ? `Desactivar ${actividad.nombre}`
                                : `Activar ${actividad.nombre}`
                            }
                            onClick={() => void alternarActividad(actividad)}
                          >
                            <Power size={15} />
                          </button>
                        </span>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ModalFicha
        abierto={modalProceso}
        titulo={edicionProceso ? 'Editar proceso' : 'Nuevo proceso'}
        ficha={edicionProceso}
        onCerrar={() => setModalProceso(false)}
        onGuardar={guardarProceso}
      />
      <ModalFicha
        abierto={modalActividad}
        titulo={edicionActividad ? 'Editar actividad' : 'Nueva actividad'}
        ficha={edicionActividad}
        onCerrar={() => setModalActividad(false)}
        onGuardar={guardarActividad}
      />
    </PlantillaVista>
  )
}
