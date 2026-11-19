import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Power } from 'lucide-react'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { usePerfil } from '../../../context/PerfilContext'
import {
  actualizarFactor,
  crearFactor,
  listarFactores,
  listarMetodologias,
  listarOpcionesFactor,
  listarVersiones,
} from '../../../services/catalogosService'
import type {
  FactorEmision,
  FactorFormulario,
  Metodologia,
  OpcionReferencia,
  VersionMetodologia,
} from '../../../services/catalogosService'

const VACIO: FactorFormulario = {
  versionId: '',
  fuenteEmisionId: '',
  unidadEntradaId: '',
  unidadSalidaId: '',
  codigo: '',
  nombre: '',
  valor: '',
  fuente: '',
  region: '',
  fechaInicioVigencia: '',
  fechaFinVigencia: '',
  estado: 'activo',
}

export default function PanelFactores() {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrear = puede('factor_emision.crear')
  const puedeEditar = puede('factor_emision.editar')
  const [factores, setFactores] = useState<FactorEmision[]>([])
  const [metodologias, setMetodologias] = useState<Metodologia[]>([])
  const [versiones, setVersiones] = useState<VersionMetodologia[]>([])
  const [fuentes, setFuentes] = useState<OpcionReferencia[]>([])
  const [unidades, setUnidades] = useState<OpcionReferencia[]>([])
  const [metodologiaId, setMetodologiaId] = useState('')
  const [filtroMetodologia, setFiltroMetodologia] = useState('')
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [edicion, setEdicion] = useState<FactorEmision | null>(null)
  const [datos, setDatos] = useState<FactorFormulario>(VACIO)
  const [enviando, setEnviando] = useState(false)

  async function recargar() {
    try {
      const [lista, metodos, opciones] = await Promise.all([
        listarFactores(),
        listarMetodologias(),
        listarOpcionesFactor(),
      ])
      setFactores(lista)
      setMetodologias(metodos.filter((item) => item.estado === 'activo' || item.versionesActivas > 0))
      setFuentes(opciones.fuentes)
      setUnidades(opciones.unidades)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar los factores.')
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
    () => factores.filter((factor) => !filtroMetodologia || factor.metodologiaId === filtroMetodologia),
    [factores, filtroMetodologia],
  )

  function abrir(factor: FactorEmision | null) {
    setEdicion(factor)
    setMetodologiaId(factor?.metodologiaId ?? '')
    setDatos(
      factor
        ? {
            versionId: factor.versionId,
            fuenteEmisionId: factor.fuenteEmisionId,
            unidadEntradaId: factor.unidadEntradaId,
            unidadSalidaId: factor.unidadSalidaId,
            codigo: factor.codigo,
            nombre: factor.nombre,
            valor: factor.valor,
            fuente: factor.fuente,
            region: factor.region,
            fechaInicioVigencia: factor.fechaInicioVigencia,
            fechaFinVigencia: factor.fechaFinVigencia,
            estado: factor.estado,
          }
        : VACIO,
    )
    setAbierto(true)
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    try {
      if (edicion) await actualizarFactor(edicion.id, datos)
      else await crearFactor(datos)
      avisar(edicion ? 'Factor actualizado.' : 'Factor creado.')
      setAbierto(false)
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar el factor.')
    } finally {
      setEnviando(false)
    }
  }

  const faltanReferencias = fuentes.length === 0 || unidades.length === 0

  return (
    <>
      <p className="cat-ayuda">
        Convierte una cantidad consumida en CO₂ equivalente. La unidad y la fuente de emisión se eligen de los catálogos que carga tu compañera.
      </p>
      {faltanReferencias ? (
        <p className="cat-nota">Para crear un factor hacen falta unidades de medida y fuentes de emisión activas.</p>
      ) : null}
      <div className="cat-cabecera">
        <label className="gst-filtro">
          <span>Metodología</span>
          <select className="vst-select" value={filtroMetodologia} onChange={(evento) => setFiltroMetodologia(evento.target.value)}>
            <option value="">Todas</option>
            {metodologias.map((metodologia) => (
              <option key={metodologia.id} value={metodologia.id}>{metodologia.nombre}</option>
            ))}
          </select>
        </label>
        {puedeCrear ? (
          <Button onClick={() => abrir(null)} disabled={faltanReferencias}>
            <Plus size={16} />
            Nuevo factor
          </Button>
        ) : null}
      </div>
      <section className="vst-tarjeta gst-tabla-tarjeta">
        {cargando ? (
          <div className="gst-cargando" role="status">Cargando…</div>
        ) : visibles.length === 0 ? (
          <div className="gst-vacio"><p>No hay factores de emisión.</p></div>
        ) : (
          <div className="gst-tabla-envoltura">
            <table className="gst-tabla">
              <thead>
                <tr>
                  <th scope="col">Factor</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Vigencia</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((factor) => (
                  <tr key={factor.id} className={factor.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}>
                    <td>
                      <b>{factor.nombre}</b>
                      <div className="gst-correo">
                        {factor.codigo} · {factor.fuenteEmisionNombre} · {factor.metodologiaNombre} {factor.numeroVersion}
                      </div>
                    </td>
                    <td>
                      {factor.valor} {factor.unidadSalidaSimbolo}/{factor.unidadEntradaSimbolo}
                      <div className="gst-correo">{factor.region || factor.fuente}</div>
                    </td>
                    <td>{factor.fechaInicioVigencia}{factor.fechaFinVigencia ? ` – ${factor.fechaFinVigencia}` : ''}</td>
                    <td>
                      <span className={`gst-estado gst-estado--${factor.estado}`}>
                        {factor.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {puedeEditar ? (
                        <span className="gst-acciones">
                          <button type="button" className="gst-accion" aria-label={`Editar ${factor.nombre}`} onClick={() => abrir(factor)}>
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`gst-accion ${factor.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                            aria-label={factor.estado === 'activo' ? 'Desactivar factor' : 'Activar factor'}
                            onClick={() =>
                              void actualizarFactor(factor.id, {
                                ...factor,
                                estado: factor.estado === 'activo' ? 'inactivo' : 'activo',
                              })
                                .then(async () => {
                                  avisar('Factor actualizado.')
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

      <Modal abierto={abierto} titulo={edicion ? 'Editar factor' : 'Nuevo factor'} onCerrar={() => setAbierto(false)} ancho="720px">
        <form className="gst-modal" onSubmit={guardar}>
          <div className="gst-rejilla">
            <div className="vst-campo">
              <label htmlFor="fac-met">Metodología *</label>
              <select
                id="fac-met"
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
              <label htmlFor="fac-ver">Versión *</label>
              <select id="fac-ver" className="vst-select" value={datos.versionId} onChange={(evento) => setDatos((previo) => ({ ...previo, versionId: evento.target.value }))} required>
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
              <label htmlFor="fac-fuente">Fuente de emisión *</label>
              <select id="fac-fuente" className="vst-select" value={datos.fuenteEmisionId} onChange={(evento) => setDatos((previo) => ({ ...previo, fuenteEmisionId: evento.target.value }))} required>
                <option value="">Selecciona</option>
                {fuentes.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-entrada">Unidad de entrada *</label>
              <select id="fac-entrada" className="vst-select" value={datos.unidadEntradaId} onChange={(evento) => setDatos((previo) => ({ ...previo, unidadEntradaId: evento.target.value }))} required>
                <option value="">Selecciona</option>
                {unidades.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre} ({item.simbolo})</option>
                ))}
              </select>
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-salida">Unidad de salida *</label>
              <select id="fac-salida" className="vst-select" value={datos.unidadSalidaId} onChange={(evento) => setDatos((previo) => ({ ...previo, unidadSalidaId: evento.target.value }))} required>
                <option value="">Selecciona</option>
                {unidades.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre} ({item.simbolo})</option>
                ))}
              </select>
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-codigo">Código *</label>
              <input id="fac-codigo" className="vst-input" value={datos.codigo} onChange={(evento) => setDatos((previo) => ({ ...previo, codigo: evento.target.value.toUpperCase() }))} required />
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-valor">Valor *</label>
              <input id="fac-valor" className="vst-input" inputMode="decimal" value={datos.valor} placeholder="0.126" onChange={(evento) => setDatos((previo) => ({ ...previo, valor: evento.target.value }))} required />
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="fac-nombre">Nombre *</label>
              <input id="fac-nombre" className="vst-input" value={datos.nombre} onChange={(evento) => setDatos((previo) => ({ ...previo, nombre: evento.target.value }))} required />
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-bib">Fuente bibliográfica</label>
              <input id="fac-bib" className="vst-input" value={datos.fuente} placeholder="UPME" onChange={(evento) => setDatos((previo) => ({ ...previo, fuente: evento.target.value }))} />
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-region">Región</label>
              <input id="fac-region" className="vst-input" value={datos.region} placeholder="Colombia" onChange={(evento) => setDatos((previo) => ({ ...previo, region: evento.target.value }))} />
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-inicio">Inicio de vigencia *</label>
              <input id="fac-inicio" className="vst-input" type="date" value={datos.fechaInicioVigencia} onChange={(evento) => setDatos((previo) => ({ ...previo, fechaInicioVigencia: evento.target.value }))} required />
            </div>
            <div className="vst-campo">
              <label htmlFor="fac-fin">Fin de vigencia</label>
              <input id="fac-fin" className="vst-input" type="date" value={datos.fechaFinVigencia} onChange={(evento) => setDatos((previo) => ({ ...previo, fechaFinVigencia: evento.target.value }))} />
            </div>
            {edicion ? (
              <div className="vst-campo">
                <label htmlFor="fac-estado">Estado</label>
                <select id="fac-estado" className="vst-select" value={datos.estado} onChange={(evento) => setDatos((previo) => ({ ...previo, estado: evento.target.value as FactorFormulario['estado'] }))}>
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
