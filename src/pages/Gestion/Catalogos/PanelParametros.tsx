import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Power } from 'lucide-react'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { usePerfil } from '../../../context/PerfilContext'
import {
  actualizarParametro,
  crearParametro,
  listarMetodologias,
  listarOpcionesParametro,
  listarParametros,
  listarVersiones,
} from '../../../services/catalogosService'
import type {
  Metodologia,
  OpcionReferencia,
  ParametroFormulario,
  ParametroHidrico,
  VersionMetodologia,
} from '../../../services/catalogosService'

const VACIO: ParametroFormulario = {
  versionId: '',
  unidadId: '',
  codigo: '',
  nombre: '',
  valor: '',
  fuente: '',
  fechaInicioVigencia: '',
  fechaFinVigencia: '',
  estado: 'activo',
}

export default function PanelParametros() {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrear = puede('parametro_hidrico.crear')
  const puedeEditar = puede('parametro_hidrico.editar')
  const [parametros, setParametros] = useState<ParametroHidrico[]>([])
  const [metodologias, setMetodologias] = useState<Metodologia[]>([])
  const [versiones, setVersiones] = useState<VersionMetodologia[]>([])
  const [unidades, setUnidades] = useState<OpcionReferencia[]>([])
  const [metodologiaId, setMetodologiaId] = useState('')
  const [filtroMetodologia, setFiltroMetodologia] = useState('')
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [edicion, setEdicion] = useState<ParametroHidrico | null>(null)
  const [datos, setDatos] = useState<ParametroFormulario>(VACIO)
  const [enviando, setEnviando] = useState(false)

  async function recargar() {
    try {
      const [lista, metodos, opciones] = await Promise.all([
        listarParametros(),
        listarMetodologias(),
        listarOpcionesParametro(),
      ])
      setParametros(lista)
      setMetodologias(metodos)
      setUnidades(opciones)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar los parámetros.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void recargar()
  }, [])

  useEffect(() => {
    if (!metodologiaId) {
      setVersiones([])
      return
    }
    let vivo = true
    void listarVersiones(metodologiaId)
      .then((lista) => {
        if (vivo) setVersiones(lista.filter((item) => item.estado === 'activo'))
      })
      .catch((error: unknown) => {
        if (vivo) avisar(error instanceof Error ? error.message : 'No fue posible cargar las versiones.')
      })
    return () => {
      vivo = false
    }
  }, [metodologiaId, avisar])

  const visibles = useMemo(
    () => parametros.filter((item) => !filtroMetodologia || item.metodologiaId === filtroMetodologia),
    [parametros, filtroMetodologia],
  )

  function abrir(parametro: ParametroHidrico | null) {
    setEdicion(parametro)
    setMetodologiaId(parametro?.metodologiaId ?? '')
    setDatos(
      parametro
        ? {
            versionId: parametro.versionId,
            unidadId: parametro.unidadId,
            codigo: parametro.codigo,
            nombre: parametro.nombre,
            valor: parametro.valor,
            fuente: parametro.fuente,
            fechaInicioVigencia: parametro.fechaInicioVigencia,
            fechaFinVigencia: parametro.fechaFinVigencia,
            estado: parametro.estado,
          }
        : VACIO,
    )
    setAbierto(true)
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    try {
      if (edicion) await actualizarParametro(edicion.id, datos)
      else await crearParametro(datos)
      avisar(edicion ? 'Parámetro actualizado.' : 'Parámetro creado.')
      setAbierto(false)
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar el parámetro.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <p className="cat-ayuda">
        Coeficientes del cálculo de agua: escasez de la cuenca, consumo o el límite para el agua gris. La unidad es opcional.
      </p>
      <div className="cat-cabecera">
        <label className="gst-filtro">
          <span>Metodología</span>
          <select className="vst-select" value={filtroMetodologia} onChange={(evento) => setFiltroMetodologia(evento.target.value)}>
            <option value="">Todas</option>
            {metodologias.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
        </label>
        {puedeCrear ? (
          <Button onClick={() => abrir(null)}>
            <Plus size={16} />
            Nuevo parámetro
          </Button>
        ) : null}
      </div>
      <section className="vst-tarjeta gst-tabla-tarjeta">
        {cargando ? (
          <div className="gst-cargando" role="status">Cargando…</div>
        ) : visibles.length === 0 ? (
          <div className="gst-vacio"><p>No hay parámetros hídricos.</p></div>
        ) : (
          <div className="gst-tabla-envoltura">
            <table className="gst-tabla">
              <thead>
                <tr>
                  <th scope="col">Parámetro</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Vigencia</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((item) => (
                  <tr key={item.id} className={item.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}>
                    <td>
                      <b>{item.nombre}</b>
                      <div className="gst-correo">{item.codigo} · {item.metodologiaNombre} {item.numeroVersion}</div>
                    </td>
                    <td>{item.valor}{item.unidadSimbolo ? ` ${item.unidadSimbolo}` : ''}</td>
                    <td>{item.fechaInicioVigencia}{item.fechaFinVigencia ? ` – ${item.fechaFinVigencia}` : ''}</td>
                    <td>
                      <span className={`gst-estado gst-estado--${item.estado}`}>
                        {item.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {puedeEditar ? (
                        <span className="gst-acciones">
                          <button type="button" className="gst-accion" aria-label={`Editar ${item.nombre}`} onClick={() => abrir(item)}>
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`gst-accion ${item.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                            aria-label={item.estado === 'activo' ? 'Desactivar parámetro' : 'Activar parámetro'}
                            onClick={() =>
                              void actualizarParametro(item.id, {
                                ...item,
                                estado: item.estado === 'activo' ? 'inactivo' : 'activo',
                              })
                                .then(async () => {
                                  avisar('Parámetro actualizado.')
                                  await recargar()
                                })
                                .catch((error: unknown) => avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado.'))
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

      <Modal abierto={abierto} titulo={edicion ? 'Editar parámetro' : 'Nuevo parámetro'} onCerrar={() => setAbierto(false)} ancho="680px">
        <form className="gst-modal" onSubmit={guardar}>
          <div className="gst-rejilla">
            <div className="vst-campo">
              <label htmlFor="par-met">Metodología *</label>
              <select
                id="par-met"
                className="vst-select"
                value={metodologiaId}
                onChange={(evento) => {
                  setMetodologiaId(evento.target.value)
                  setDatos((previo) => ({ ...previo, versionId: '' }))
                }}
                required
              >
                <option value="">Selecciona</option>
                {metodologias.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </div>
            <div className="vst-campo">
              <label htmlFor="par-ver">Versión *</label>
              <select id="par-ver" className="vst-select" value={datos.versionId} onChange={(evento) => setDatos((previo) => ({ ...previo, versionId: evento.target.value }))} required>
                <option value="">Selecciona</option>
                {versiones.map((item) => (
                  <option key={item.id} value={item.id}>{item.numeroVersion}</option>
                ))}
                {edicion && !versiones.some((item) => item.id === datos.versionId) ? (
                  <option value={datos.versionId}>{edicion.numeroVersion}</option>
                ) : null}
              </select>
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="par-unidad">Unidad</label>
              <select id="par-unidad" className="vst-select" value={datos.unidadId} onChange={(evento) => setDatos((previo) => ({ ...previo, unidadId: evento.target.value }))}>
                <option value="">Sin unidad</option>
                {unidades.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre} ({item.simbolo})</option>
                ))}
              </select>
            </div>
            <div className="vst-campo">
              <label htmlFor="par-codigo">Código *</label>
              <input id="par-codigo" className="vst-input" value={datos.codigo} onChange={(evento) => setDatos((previo) => ({ ...previo, codigo: evento.target.value.toUpperCase() }))} required />
            </div>
            <div className="vst-campo">
              <label htmlFor="par-valor">Valor *</label>
              <input id="par-valor" className="vst-input" inputMode="decimal" value={datos.valor} onChange={(evento) => setDatos((previo) => ({ ...previo, valor: evento.target.value }))} required />
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="par-nombre">Nombre *</label>
              <input id="par-nombre" className="vst-input" value={datos.nombre} onChange={(evento) => setDatos((previo) => ({ ...previo, nombre: evento.target.value }))} required />
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="par-fuente">Fuente</label>
              <input id="par-fuente" className="vst-input" value={datos.fuente} placeholder="IDEAM" onChange={(evento) => setDatos((previo) => ({ ...previo, fuente: evento.target.value }))} />
            </div>
            <div className="vst-campo">
              <label htmlFor="par-inicio">Inicio de vigencia *</label>
              <input id="par-inicio" className="vst-input" type="date" value={datos.fechaInicioVigencia} onChange={(evento) => setDatos((previo) => ({ ...previo, fechaInicioVigencia: evento.target.value }))} required />
            </div>
            <div className="vst-campo">
              <label htmlFor="par-fin">Fin de vigencia</label>
              <input id="par-fin" className="vst-input" type="date" value={datos.fechaFinVigencia} onChange={(evento) => setDatos((previo) => ({ ...previo, fechaFinVigencia: evento.target.value }))} />
            </div>
            {edicion ? (
              <div className="vst-campo">
                <label htmlFor="par-estado">Estado</label>
                <select id="par-estado" className="vst-select" value={datos.estado} onChange={(evento) => setDatos((previo) => ({ ...previo, estado: evento.target.value as ParametroFormulario['estado'] }))}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            ) : null}
          </div>
          <div className="gst-modal-pie">
            <Button variante="contorno" onClick={() => setAbierto(false)} disabled={enviando}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
