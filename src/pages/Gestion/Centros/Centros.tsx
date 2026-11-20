import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Landmark, Pencil, Plus, Power } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { usePerfil } from '../../../context/PerfilContext'
import {
  actualizarCentro,
  actualizarRegional,
  crearCentro,
  crearRegional,
  listarCentros,
  listarRegionales,
} from '../../../services/centrosService'
import type { CentroFormacion, Regional } from '../../../services/centrosService'
import '../Usuarios/Usuarios.css'

export default function Centros() {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrearRegional = puede('regional.crear')
  const puedeEditarRegional = puede('regional.editar')
  const puedeCrearCentro = puede('centro.crear')
  const puedeEditarCentro = puede('centro.editar')

  const [regionales, setRegionales] = useState<Regional[]>([])
  const [centros, setCentros] = useState<CentroFormacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [regionalModal, setRegionalModal] = useState<Regional | null | undefined>(undefined)
  const [centroModal, setCentroModal] = useState<CentroFormacion | null | undefined>(undefined)

  const recargar = useCallback(async () => {
    try {
      const [listaRegionales, listaCentros] = await Promise.all([
        listarRegionales(true),
        listarCentros(true),
      ])
      setRegionales(listaRegionales)
      setCentros(listaCentros)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar los centros.')
    } finally {
      setCargando(false)
    }
  }, [avisar])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function guardarRegional(datos: { codigo: string; nombre: string }) {
    try {
      if (regionalModal) {
        await actualizarRegional(regionalModal.id, datos)
        avisar('Regional actualizada.')
      } else {
        await crearRegional(datos)
        avisar('Regional creada.')
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar la regional.')
      return false
    }
  }

  async function guardarCentro(datos: { regionalId: string; codigo: string; nombre: string }) {
    try {
      if (centroModal) {
        await actualizarCentro(centroModal.id, datos)
        avisar('Centro de formación actualizado.')
      } else {
        await crearCentro(datos)
        avisar('Centro de formación creado.')
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar el centro.')
      return false
    }
  }

  async function alternarRegional(regional: Regional) {
    try {
      await actualizarRegional(regional.id, { activo: !regional.activo })
      avisar(regional.activo ? 'Regional desactivada.' : 'Regional activada.')
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado de la regional.')
    }
  }

  async function alternarCentro(centro: CentroFormacion) {
    try {
      await actualizarCentro(centro.id, { activo: !centro.activo })
      avisar(centro.activo ? 'Centro desactivado.' : 'Centro activado.')
      await recargar()
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo cambiar el estado del centro.')
    }
  }

  return (
    <PlantillaVista titulo="Centros de formación" className="gst gst-usuarios">
      <PageHeader
        titulo="Centros de formación"
        subtitulo="Cada centro pertenece a una regional. El administrador de ese centro crea a los profesionales que calculan la huella."
      />

      <section className="vst-tarjeta gst-tabla-tarjeta">
        <div className="gst-acciones" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Regionales</h2>
          {puedeCrearRegional ? (
            <Button onClick={() => setRegionalModal(null)}>
              <Plus size={16} />
              Nueva regional
            </Button>
          ) : null}
        </div>
        {cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando…
          </div>
        ) : regionales.length === 0 ? (
          <div className="gst-vacio">
            <Landmark size={28} />
            <p>Todavía no hay regionales.</p>
          </div>
        ) : (
          <TablaSimple
            columnas={['Código', 'Regional', 'Estado', 'Acciones']}
            filas={regionales.map((regional) => ({
              id: regional.id,
              inactiva: !regional.activo,
              celdas: [
                regional.codigo,
                regional.nombre,
                regional.activo ? 'Activa' : 'Inactiva',
              ],
              acciones: puedeEditarRegional ? (
                <Acciones
                  nombre={regional.nombre}
                  activo={regional.activo}
                  onEditar={() => setRegionalModal(regional)}
                  onAlternar={() => void alternarRegional(regional)}
                />
              ) : null,
            }))}
          />
        )}
      </section>

      <section className="vst-tarjeta gst-tabla-tarjeta" style={{ marginTop: 16 }}>
        <div className="gst-acciones" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Centros</h2>
          {puedeCrearCentro ? (
            <Button onClick={() => setCentroModal(null)} disabled={regionales.every((item) => !item.activo)}>
              <Plus size={16} />
              Nuevo centro
            </Button>
          ) : null}
        </div>
        {cargando ? null : centros.length === 0 ? (
          <div className="gst-vacio">
            <p>Todavía no hay centros de formación.</p>
          </div>
        ) : (
          <TablaSimple
            columnas={['Código', 'Centro', 'Regional', 'Estado', 'Acciones']}
            filas={centros.map((centro) => ({
              id: centro.id,
              inactiva: !centro.activo,
              celdas: [
                centro.codigo,
                centro.nombre,
                centro.regionalNombre,
                centro.activo ? 'Activo' : 'Inactivo',
              ],
              acciones: puedeEditarCentro ? (
                <Acciones
                  nombre={centro.nombre}
                  activo={centro.activo}
                  onEditar={() => setCentroModal(centro)}
                  onAlternar={() => void alternarCentro(centro)}
                />
              ) : null,
            }))}
          />
        )}
      </section>

      <ModalCatalogo
        abierto={regionalModal !== undefined}
        titulo={regionalModal ? 'Editar regional' : 'Nueva regional'}
        codigo={regionalModal?.codigo ?? ''}
        nombre={regionalModal?.nombre ?? ''}
        onCerrar={() => setRegionalModal(undefined)}
        onGuardar={guardarRegional}
      />
      <ModalCentro
        abierto={centroModal !== undefined}
        centro={centroModal ?? null}
        regionales={regionales.filter((item) => item.activo || item.id === centroModal?.regionalId)}
        onCerrar={() => setCentroModal(undefined)}
        onGuardar={guardarCentro}
      />
    </PlantillaVista>
  )
}

function Acciones({
  nombre,
  activo,
  onEditar,
  onAlternar,
}: {
  nombre: string
  activo: boolean
  onEditar: () => void
  onAlternar: () => void
}) {
  return (
    <span className="gst-acciones">
      <button type="button" className="gst-accion" title={`Editar ${nombre}`} aria-label={`Editar ${nombre}`} onClick={onEditar}>
        <Pencil size={15} />
      </button>
      <button
        type="button"
        className="gst-accion"
        title={activo ? `Desactivar ${nombre}` : `Activar ${nombre}`}
        aria-label={activo ? `Desactivar ${nombre}` : `Activar ${nombre}`}
        onClick={onAlternar}
      >
        <Power size={15} />
      </button>
    </span>
  )
}

function TablaSimple({
  columnas,
  filas,
}: {
  columnas: string[]
  filas: { id: string; inactiva: boolean; celdas: string[]; acciones: React.ReactNode }[]
}) {
  return (
    <div className="gst-tabla-envoltura">
      <table className="gst-tabla">
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th key={columna} scope="col">{columna}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className={fila.inactiva ? 'gst-fila--inactiva' : ''}>
              {fila.celdas.map((celda) => (
                <td key={celda}>{celda}</td>
              ))}
              <td>{fila.acciones}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ModalCatalogo({
  abierto,
  titulo,
  codigo,
  nombre,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean
  titulo: string
  codigo: string
  nombre: string
  onCerrar: () => void
  onGuardar: (datos: { codigo: string; nombre: string }) => Promise<boolean>
}) {
  const [datos, setDatos] = useState({ codigo, nombre })
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setDatos({ codigo, nombre })
    setEnviando(false)
  }, [abierto, codigo, nombre])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!datos.codigo.trim() || !datos.nombre.trim()) return
    setEnviando(true)
    const ok = await onGuardar({ codigo: datos.codigo.trim(), nombre: datos.nombre.trim() })
    setEnviando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCerrar} ancho="520px">
      <form className="gst-modal" onSubmit={enviar}>
        <div className="vst-campo">
          <label htmlFor="reg-codigo">Código *</label>
          <input id="reg-codigo" className="vst-input" value={datos.codigo} onChange={(evento) => setDatos((prev) => ({ ...prev, codigo: evento.target.value }))} />
        </div>
        <div className="vst-campo">
          <label htmlFor="reg-nombre">Nombre *</label>
          <input id="reg-nombre" className="vst-input" value={datos.nombre} onChange={(evento) => setDatos((prev) => ({ ...prev, nombre: evento.target.value }))} />
        </div>
        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>Cancelar</Button>
          <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function ModalCentro({
  abierto,
  centro,
  regionales,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean
  centro: CentroFormacion | null
  regionales: Regional[]
  onCerrar: () => void
  onGuardar: (datos: { regionalId: string; codigo: string; nombre: string }) => Promise<boolean>
}) {
  const [datos, setDatos] = useState({
    regionalId: centro?.regionalId ?? '',
    codigo: centro?.codigo ?? '',
    nombre: centro?.nombre ?? '',
  })
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setDatos({
      regionalId: centro?.regionalId ?? regionales[0]?.id ?? '',
      codigo: centro?.codigo ?? '',
      nombre: centro?.nombre ?? '',
    })
    setEnviando(false)
  }, [abierto, centro, regionales])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!datos.regionalId || !datos.codigo.trim() || !datos.nombre.trim()) return
    setEnviando(true)
    const ok = await onGuardar({
      regionalId: datos.regionalId,
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
    })
    setEnviando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal abierto={abierto} titulo={centro ? 'Editar centro' : 'Nuevo centro'} onCerrar={onCerrar} ancho="560px">
      <form className="gst-modal" onSubmit={enviar}>
        <div className="vst-campo">
          <label htmlFor="cen-regional">Regional *</label>
          <select id="cen-regional" className="vst-select" value={datos.regionalId} onChange={(evento) => setDatos((prev) => ({ ...prev, regionalId: evento.target.value }))}>
            <option value="">Selecciona una regional…</option>
            {regionales.map((regional) => (
              <option key={regional.id} value={regional.id}>{regional.nombre}</option>
            ))}
          </select>
        </div>
        <div className="vst-campo">
          <label htmlFor="cen-codigo">Código *</label>
          <input id="cen-codigo" className="vst-input" value={datos.codigo} onChange={(evento) => setDatos((prev) => ({ ...prev, codigo: evento.target.value }))} />
        </div>
        <div className="vst-campo">
          <label htmlFor="cen-nombre">Nombre *</label>
          <input id="cen-nombre" className="vst-input" value={datos.nombre} onChange={(evento) => setDatos((prev) => ({ ...prev, nombre: evento.target.value }))} />
        </div>
        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>Cancelar</Button>
          <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</Button>
        </div>
      </form>
    </Modal>
  )
}
