import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListTree, Pencil, Plus, Power } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import { usePerfil } from '../../../context/PerfilContext'
import ModalSede from './components/ModalSede'
import PeriodosOrganizacion from './components/PeriodosOrganizacion'
import {
  actualizarSede,
  cambiarEstadoSede,
  crearSede,
  etiquetaTipo,
  listarSedes,
  obtenerOrganizacion,
} from '../../../services/organizacionesService'
import type { Organizacion, Sede, SedeFormulario } from '../../../services/organizacionesService'
import './Organizaciones.css'

export default function OrganizacionDetalle() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrear = puede('sede.crear')
  const puedeEditar = puede('sede.editar')
  const puedeVerProcesos = puede('proceso.ver')

  const [organizacion, setOrganizacion] = useState<Organizacion | null>(null)
  const [sedes, setSedes] = useState<Sede[]>([])
  const [cargando, setCargando] = useState(true)
  const [modalSede, setModalSede] = useState(false)
  const [edicion, setEdicion] = useState<Sede | null>(null)

  const recargar = useCallback(async () => {
    try {
      const [ficha, lista] = await Promise.all([obtenerOrganizacion(id), listarSedes(id)])
      setOrganizacion(ficha)
      setSedes(lista)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar la organización.')
    } finally {
      setCargando(false)
    }
  }, [avisar, id])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function guardarSede(datos: SedeFormulario) {
    try {
      if (edicion) {
        await actualizarSede(edicion.id, datos)
        avisar('Sede actualizada.')
      } else {
        await crearSede(id, datos)
        avisar('Sede creada.')
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar la sede.')
      return false
    }
  }

  async function alternar(sede: Sede) {
    const siguiente = sede.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await cambiarEstadoSede(sede, siguiente)
      avisar(siguiente === 'activo' ? 'Sede activada.' : 'Sede desactivada.')
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado de la sede.')
    }
  }

  const titulo = organizacion?.nombre ?? 'Organización'

  return (
    <PlantillaVista titulo={titulo} className="gst gst-usuarios">
      <PageHeader
        titulo={titulo}
        subtitulo={
          organizacion
            ? `${organizacion.municipioNombre}, ${organizacion.departamentoNombre} · ${etiquetaTipo(organizacion.tipo)}`
            : 'Sedes de la organización'
        }
        acciones={
          <div className="gst-acciones">
            <Link to="/gestion/organizaciones" className="hv-btn hv-btn-contorno">
              <ArrowLeft size={16} />
              Organizaciones
            </Link>
            {puedeCrear && organizacion?.estado === 'activo' ? (
              <Button
                onClick={() => {
                  setEdicion(null)
                  setModalSede(true)
                }}
              >
                <Plus size={16} />
                Nueva sede
              </Button>
            ) : null}
          </div>
        }
      />

      {organizacion ? (
        <p className="org-resumen">
          <span>
            NIT <b>{organizacion.nit}</b>
          </span>
          {organizacion.nombreCorto ? (
            <span>
              Nombre corto <b>{organizacion.nombreCorto}</b>
            </span>
          ) : null}
          <span>
            Estado <b>{organizacion.estado === 'activo' ? 'Activa' : 'Inactiva'}</b>
          </span>
        </p>
      ) : null}

      {organizacion ? <PeriodosOrganizacion organizacionId={id} /> : null}

      <section className="vst-tarjeta gst-tabla-tarjeta">
        {cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando sedes…
          </div>
        ) : sedes.length === 0 ? (
          <div className="gst-vacio">
            <p>Esta organización todavía no tiene sedes.</p>
          </div>
        ) : (
          <div className="gst-tabla-envoltura">
            <table className="gst-tabla">
              <caption className="gst-sr-only">Sedes de la organización</caption>
              <thead>
                <tr>
                  <th scope="col">Sede</th>
                  <th scope="col">Responsable</th>
                  <th scope="col">Procesos</th>
                  <th scope="col">Estado</th>
                  {puedeEditar || puedeVerProcesos ? <th scope="col">Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {sedes.map((sede) => (
                  <tr key={sede.id} className={sede.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}>
                    <td>
                      <b>{sede.nombre}</b>
                      <div className="gst-correo">{sede.codigo || sede.direccion || 'Sin código'}</div>
                    </td>
                    <td>
                      {sede.responsableNombre || 'Sin responsable'}
                      <div className="gst-correo">{sede.responsableCargo}</div>
                    </td>
                    <td>{sede.procesosActivos}</td>
                    <td>
                      <span className={`gst-estado gst-estado--${sede.estado}`}>
                        {sede.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {puedeEditar || puedeVerProcesos ? (
                      <td>
                        <span className="gst-acciones">
                          {puedeVerProcesos ? (
                            <button
                              type="button"
                              className="gst-accion"
                              aria-label={`Ver procesos de ${sede.nombre}`}
                              title="Procesos"
                              onClick={() => navigate(`/gestion/organizaciones/${id}/sedes/${sede.id}`)}
                            >
                              <ListTree size={15} />
                            </button>
                          ) : null}
                          {puedeEditar ? (
                            <>
                          <button
                            type="button"
                            className="gst-accion"
                            aria-label={`Editar ${sede.nombre}`}
                            onClick={() => {
                              setEdicion(sede)
                              setModalSede(true)
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`gst-accion ${sede.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                            aria-label={sede.estado === 'activo' ? `Desactivar ${sede.nombre}` : `Activar ${sede.nombre}`}
                            onClick={() => void alternar(sede)}
                          >
                            <Power size={15} />
                          </button>
                            </>
                          ) : null}
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

      <ModalSede
        abierto={modalSede}
        sede={edicion}
        onCerrar={() => setModalSede(false)}
        onGuardar={guardarSede}
      />
    </PlantillaVista>
  )
}
