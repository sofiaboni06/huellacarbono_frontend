import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Layers, Pencil, Plus, Power } from 'lucide-react'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { usePerfil } from '../../../context/PerfilContext'
import {
  actualizarMetodologia,
  actualizarVersion,
  crearMetodologia,
  crearVersion,
  listarMetodologias,
  listarVersiones,
} from '../../../services/catalogosService'
import type {
  Metodologia,
  MetodologiaFormulario,
  VersionFormulario,
  VersionMetodologia,
} from '../../../services/catalogosService'

const VACIA: MetodologiaFormulario = {
  codigo: '',
  nombre: '',
  tipo: 'CARBONO',
  descripcion: '',
  entidadFuente: '',
  estado: 'activo',
}

const VERSION_VACIA: VersionFormulario = {
  numeroVersion: '',
  descripcion: '',
  fechaInicioVigencia: '',
  fechaFinVigencia: '',
  estado: 'activo',
}

export default function PanelMetodologias() {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrear = puede('metodologia.crear')
  const puedeEditar = puede('metodologia.editar')
  const [filas, setFilas] = useState<Metodologia[]>([])
  const [versiones, setVersiones] = useState<VersionMetodologia[]>([])
  const [seleccion, setSeleccion] = useState<Metodologia | null>(null)
  const [cargando, setCargando] = useState(true)
  const [modalMetodo, setModalMetodo] = useState(false)
  const [edicion, setEdicion] = useState<Metodologia | null>(null)
  const [datos, setDatos] = useState<MetodologiaFormulario>(VACIA)
  const [modalVersion, setModalVersion] = useState(false)
  const [versionEdicion, setVersionEdicion] = useState<VersionMetodologia | null>(null)
  const [versionDatos, setVersionDatos] = useState<VersionFormulario>(VERSION_VACIA)
  const [enviando, setEnviando] = useState(false)

  async function recargar() {
    try {
      const lista = await listarMetodologias()
      setFilas(lista)
      setSeleccion((actual) => lista.find((item) => item.id === actual?.id) ?? lista[0] ?? null)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar las metodologías.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void recargar()
  }, [])

  useEffect(() => {
    if (!seleccion) {
      setVersiones([])
      return
    }
    let vivo = true
    void listarVersiones(seleccion.id)
      .then((lista) => {
        if (vivo) setVersiones(lista)
      })
      .catch((error: unknown) => {
        if (vivo) avisar(error instanceof Error ? error.message : 'No fue posible cargar las versiones.')
      })
    return () => {
      vivo = false
    }
  }, [seleccion, avisar])

  function abrirMetodo(metodologia: Metodologia | null) {
    setEdicion(metodologia)
    setDatos(
      metodologia
        ? {
            codigo: metodologia.codigo,
            nombre: metodologia.nombre,
            tipo: metodologia.tipo,
            descripcion: metodologia.descripcion,
            entidadFuente: metodologia.entidadFuente,
            estado: metodologia.estado,
          }
        : VACIA,
    )
    setModalMetodo(true)
  }

  async function guardarMetodo(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    try {
      if (edicion) await actualizarMetodologia(edicion.id, datos)
      else await crearMetodologia(datos)
      avisar(edicion ? 'Metodología actualizada.' : 'Metodología creada.')
      setModalMetodo(false)
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar la metodología.')
    } finally {
      setEnviando(false)
    }
  }

  function abrirVersion(version: VersionMetodologia | null) {
    setVersionEdicion(version)
    setVersionDatos(
      version
        ? {
            numeroVersion: version.numeroVersion,
            descripcion: version.descripcion,
            fechaInicioVigencia: version.fechaInicioVigencia,
            fechaFinVigencia: version.fechaFinVigencia,
            estado: version.estado,
          }
        : VERSION_VACIA,
    )
    setModalVersion(true)
  }

  async function guardarVersion(evento: FormEvent) {
    evento.preventDefault()
    if (!seleccion) return
    setEnviando(true)
    try {
      if (versionEdicion) await actualizarVersion(seleccion.id, versionEdicion.id, versionDatos)
      else await crearVersion(seleccion.id, versionDatos)
      avisar(versionEdicion ? 'Versión actualizada.' : 'Versión creada.')
      setModalVersion(false)
      setVersiones(await listarVersiones(seleccion.id))
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar la versión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <p className="cat-ayuda">
        La norma o la guía, y cada edición vigente. Los factores y los parámetros cuelgan de una versión, no de la metodología.
      </p>
      <div className="cat-cabecera">
        {puedeCrear ? (
          <Button onClick={() => abrirMetodo(null)}>
            <Plus size={16} />
            Nueva metodología
          </Button>
        ) : null}
      </div>
      <section className="vst-tarjeta gst-tabla-tarjeta">
        {cargando ? (
          <div className="gst-cargando" role="status">Cargando…</div>
        ) : filas.length === 0 ? (
          <div className="gst-vacio"><p>Todavía no hay metodologías.</p></div>
        ) : (
          <div className="gst-tabla-envoltura">
            <table className="gst-tabla">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Versiones</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => (
                  <tr key={fila.id} className={seleccion?.id === fila.id ? 'cat-fila-activa' : ''}>
                    <td><b>{fila.codigo}</b></td>
                    <td>
                      {fila.nombre}
                      <div className="gst-correo">{fila.entidadFuente || 'Sin entidad fuente'}</div>
                    </td>
                    <td>{fila.tipo === 'HIDRICA' ? 'Hídrica' : 'Carbono'}</td>
                    <td>{fila.versionesActivas}</td>
                    <td>
                      <span className={`gst-estado gst-estado--${fila.estado}`}>
                        {fila.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <span className="gst-acciones">
                        <button type="button" className="gst-accion" aria-label={`Ver versiones de ${fila.nombre}`} onClick={() => setSeleccion(fila)}>
                          <Layers size={15} />
                        </button>
                        {puedeEditar ? (
                          <button type="button" className="gst-accion" aria-label={`Editar ${fila.nombre}`} onClick={() => abrirMetodo(fila)}>
                            <Pencil size={15} />
                          </button>
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

      {seleccion ? (
        <section className="vst-tarjeta gst-tabla-tarjeta cat-bloque">
          <div className="cat-cabecera">
            <h2>Versiones de {seleccion.nombre}</h2>
            {puedeCrear ? (
              <Button onClick={() => abrirVersion(null)} disabled={seleccion.estado === 'inactivo'}>
                <Plus size={16} />
                Nueva versión
              </Button>
            ) : null}
          </div>
          {versiones.length === 0 ? (
            <div className="gst-vacio"><p>Esta metodología no tiene versiones.</p></div>
          ) : (
            <div className="gst-tabla-envoltura">
              <table className="gst-tabla">
                <thead>
                  <tr>
                    <th scope="col">Versión</th>
                    <th scope="col">Inicio</th>
                    <th scope="col">Fin</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {versiones.map((version) => (
                    <tr key={version.id}>
                      <td><b>{version.numeroVersion}</b></td>
                      <td>{version.fechaInicioVigencia}</td>
                      <td>{version.fechaFinVigencia || 'Abierta'}</td>
                      <td>
                        <span className={`gst-estado gst-estado--${version.estado}`}>
                          {version.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {puedeEditar ? (
                          <span className="gst-acciones">
                            <button type="button" className="gst-accion" aria-label={`Editar versión ${version.numeroVersion}`} onClick={() => abrirVersion(version)}>
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className={`gst-accion ${version.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                              aria-label={version.estado === 'activo' ? 'Desactivar versión' : 'Activar versión'}
                              onClick={() =>
                                void actualizarVersion(seleccion.id, version.id, {
                                  ...version,
                                  estado: version.estado === 'activo' ? 'inactivo' : 'activo',
                                })
                                  .then(async () => {
                                    avisar('Versión actualizada.')
                                    setVersiones(await listarVersiones(seleccion.id))
                                    await recargar()
                                  })
                                  .catch((error: unknown) => {
                                    avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado.')
                                  })
                              }
                            >
                              <Power size={15} />
                            </button>
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <Modal abierto={modalMetodo} titulo={edicion ? 'Editar metodología' : 'Nueva metodología'} onCerrar={() => setModalMetodo(false)} ancho="640px">
        <form className="gst-modal" onSubmit={guardarMetodo}>
          <div className="gst-rejilla">
            <div className="vst-campo">
              <label htmlFor="met-codigo">Código *</label>
              <input id="met-codigo" className="vst-input" value={datos.codigo} onChange={(evento) => setDatos((previo) => ({ ...previo, codigo: evento.target.value.toUpperCase() }))} required />
            </div>
            <div className="vst-campo">
              <label htmlFor="met-tipo">Tipo *</label>
              <select id="met-tipo" className="vst-select" value={datos.tipo} onChange={(evento) => setDatos((previo) => ({ ...previo, tipo: evento.target.value as MetodologiaFormulario['tipo'] }))}>
                <option value="CARBONO">Carbono</option>
                <option value="HIDRICA">Hídrica</option>
              </select>
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="met-nombre">Nombre *</label>
              <input id="met-nombre" className="vst-input" value={datos.nombre} onChange={(evento) => setDatos((previo) => ({ ...previo, nombre: evento.target.value }))} required />
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="met-entidad">Entidad fuente</label>
              <input id="met-entidad" className="vst-input" value={datos.entidadFuente} placeholder="ISO, UPME, GHG Protocol" onChange={(evento) => setDatos((previo) => ({ ...previo, entidadFuente: evento.target.value }))} />
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="met-desc">Descripción</label>
              <textarea id="met-desc" className="vst-input" rows={3} value={datos.descripcion} onChange={(evento) => setDatos((previo) => ({ ...previo, descripcion: evento.target.value }))} />
            </div>
            {edicion ? (
              <div className="vst-campo">
                <label htmlFor="met-estado">Estado</label>
                <select id="met-estado" className="vst-select" value={datos.estado} onChange={(evento) => setDatos((previo) => ({ ...previo, estado: evento.target.value as MetodologiaFormulario['estado'] }))}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            ) : null}
          </div>
          <div className="gst-modal-pie">
            <Button variante="contorno" onClick={() => setModalMetodo(false)} disabled={enviando}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal abierto={modalVersion} titulo={versionEdicion ? 'Editar versión' : 'Nueva versión'} onCerrar={() => setModalVersion(false)} ancho="560px">
        <form className="gst-modal" onSubmit={guardarVersion}>
          <div className="vst-campo">
            <label htmlFor="ver-numero">Número de versión *</label>
            <input id="ver-numero" className="vst-input" value={versionDatos.numeroVersion} placeholder="2024" onChange={(evento) => setVersionDatos((previo) => ({ ...previo, numeroVersion: evento.target.value }))} required />
          </div>
          <div className="gst-rejilla">
            <div className="vst-campo">
              <label htmlFor="ver-inicio">Inicio de vigencia *</label>
              <input id="ver-inicio" className="vst-input" type="date" value={versionDatos.fechaInicioVigencia} onChange={(evento) => setVersionDatos((previo) => ({ ...previo, fechaInicioVigencia: evento.target.value }))} required />
            </div>
            <div className="vst-campo">
              <label htmlFor="ver-fin">Fin de vigencia</label>
              <input id="ver-fin" className="vst-input" type="date" value={versionDatos.fechaFinVigencia} onChange={(evento) => setVersionDatos((previo) => ({ ...previo, fechaFinVigencia: evento.target.value }))} />
            </div>
          </div>
          <div className="vst-campo">
            <label htmlFor="ver-desc">Descripción</label>
            <textarea id="ver-desc" className="vst-input" rows={3} value={versionDatos.descripcion} onChange={(evento) => setVersionDatos((previo) => ({ ...previo, descripcion: evento.target.value }))} />
          </div>
          {versionEdicion ? (
            <div className="vst-campo">
              <label htmlFor="ver-estado">Estado</label>
              <select id="ver-estado" className="vst-select" value={versionDatos.estado} onChange={(evento) => setVersionDatos((previo) => ({ ...previo, estado: evento.target.value as VersionFormulario['estado'] }))}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          ) : null}
          <div className="gst-modal-pie">
            <Button variante="contorno" onClick={() => setModalVersion(false)} disabled={enviando}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
