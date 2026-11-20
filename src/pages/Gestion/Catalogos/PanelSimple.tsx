import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Pencil, Plus, Power, Search, X } from 'lucide-react'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { usePerfil } from '../../../context/PerfilContext'
import {
  actualizarCatalogo,
  crearCatalogo,
  listarCatalogo,
} from '../../../services/catalogosService'
import type { CatalogoFormulario, CatalogoSimple } from '../../../services/catalogosService'

const POR_PAGINA = 8
const VACIO: CatalogoFormulario = { codigo: '', nombre: '', descripcion: '', estado: 'activo' }

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

interface PanelSimpleProps {
  ruta: string
  titulo: string
  descripcion: string
  permisoCrear: string
  permisoEditar: string
}

export default function PanelSimple({
  ruta,
  titulo,
  descripcion,
  permisoCrear,
  permisoEditar,
}: PanelSimpleProps) {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrear = puede(permisoCrear)
  const puedeEditar = puede(permisoEditar)
  const [filas, setFilas] = useState<CatalogoSimple[]>([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [pagina, setPagina] = useState(1)
  const [abierto, setAbierto] = useState(false)
  const [edicion, setEdicion] = useState<CatalogoSimple | null>(null)
  const [datos, setDatos] = useState<CatalogoFormulario>(VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function recargar() {
    try {
      setFilas(await listarCatalogo(ruta))
    } catch (fallo) {
      avisar(fallo instanceof Error ? fallo.message : 'No fue posible cargar el catálogo.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    setCargando(true)
    void recargar()
  }, [ruta])

  useEffect(() => {
    setPagina(1)
  }, [busqueda, estado, ruta])

  const filtradas = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return filas.filter((fila) => {
      if (estado !== 'todos' && fila.estado !== estado) return false
      if (!texto) return true
      return [fila.codigo, fila.nombre, fila.descripcion].some((valor) => normalizar(valor).includes(texto))
    })
  }, [filas, busqueda, estado])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = filtradas.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1
  const hasta = Math.min(paginaSegura * POR_PAGINA, filtradas.length)
  const visibles = filtradas.slice(desde - 1, hasta)

  function abrirAlta() {
    setEdicion(null)
    setDatos(VACIO)
    setError('')
    setAbierto(true)
  }

  function abrirEdicion(fila: CatalogoSimple) {
    setEdicion(fila)
    setDatos({
      codigo: fila.codigo,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      estado: fila.estado,
    })
    setError('')
    setAbierto(true)
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (datos.codigo.trim().length < 2 || datos.nombre.trim().length < 2) {
      setError('El código y el nombre necesitan al menos 2 caracteres.')
      return
    }
    setEnviando(true)
    try {
      if (edicion) {
        await actualizarCatalogo(ruta, edicion.id, datos)
        avisar('Registro actualizado.')
      } else {
        await crearCatalogo(ruta, datos)
        avisar('Registro creado.')
      }
      setAbierto(false)
      await recargar()
    } catch (fallo) {
      avisar(fallo instanceof Error ? fallo.message : 'No se pudo guardar.')
    } finally {
      setEnviando(false)
    }
  }

  async function alternar(fila: CatalogoSimple) {
    try {
      await actualizarCatalogo(ruta, fila.id, {
        codigo: fila.codigo,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        estado: fila.estado === 'activo' ? 'inactivo' : 'activo',
      })
      avisar(fila.estado === 'activo' ? 'Registro desactivado.' : 'Registro activado.')
      await recargar()
    } catch (fallo) {
      avisar(fallo instanceof Error ? fallo.message : 'No se pudo cambiar el estado.')
    }
  }

  return (
    <>
      <p className="cat-ayuda">{descripcion}</p>
      <section className="vst-tarjeta gst-barra" aria-label={`Búsqueda de ${titulo}`}>
        <div className="gst-buscador">
          <Search size={17} aria-hidden="true" />
          <input
            className="vst-input"
            type="search"
            value={busqueda}
            placeholder="Buscar por código o nombre…"
            aria-label={`Buscar ${titulo}`}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
          {busqueda ? (
            <button type="button" className="gst-buscador-limpiar" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
              <X size={14} />
            </button>
          ) : null}
        </div>
        <label className="gst-filtro">
          <span>Estado</span>
          <select className="vst-select" value={estado} onChange={(evento) => setEstado(evento.target.value as typeof estado)}>
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </label>
        <span className="gst-contador">{filtradas.length}</span>
        {puedeCrear ? (
          <Button onClick={abrirAlta}>
            <Plus size={16} />
            Nuevo
          </Button>
        ) : null}
      </section>

      <section className="vst-tarjeta gst-tabla-tarjeta">
        {cargando ? (
          <div className="gst-cargando" role="status">Cargando…</div>
        ) : visibles.length === 0 ? (
          <div className="gst-vacio"><p>No hay registros con esos filtros.</p></div>
        ) : (
          <>
            <div className="gst-tabla-envoltura">
              <table className="gst-tabla">
                <caption className="gst-sr-only">{titulo}</caption>
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((fila) => (
                    <tr key={fila.id} className={fila.estado === 'inactivo' ? 'gst-fila--inactiva' : ''}>
                      <td><b>{fila.codigo}</b></td>
                      <td>{fila.nombre}</td>
                      <td>{fila.descripcion || '—'}</td>
                      <td>
                        <span className={`gst-estado gst-estado--${fila.estado}`}>
                          {fila.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {puedeEditar ? (
                          <span className="gst-acciones">
                            <button type="button" className="gst-accion" aria-label={`Editar ${fila.nombre}`} onClick={() => abrirEdicion(fila)}>
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className={`gst-accion ${fila.estado === 'activo' ? 'gst-accion--apagar' : 'gst-accion--encender'}`}
                              aria-label={fila.estado === 'activo' ? `Desactivar ${fila.nombre}` : `Activar ${fila.nombre}`}
                              onClick={() => void alternar(fila)}
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
            <div className="gst-paginacion">
              <p className="gst-paginacion-info">
                Mostrando <b>{desde}–{hasta}</b> de <b>{filtradas.length}</b>
              </p>
              <nav className="gst-paginacion-botones" aria-label={`Paginación de ${titulo}`}>
                <button type="button" className="gst-pagina" onClick={() => setPagina((actual) => Math.max(1, actual - 1))} disabled={paginaSegura <= 1} aria-label="Página anterior">‹</button>
                <button type="button" className="gst-pagina" onClick={() => setPagina((actual) => Math.min(totalPaginas, actual + 1))} disabled={paginaSegura >= totalPaginas} aria-label="Página siguiente">›</button>
              </nav>
            </div>
          </>
        )}
      </section>

      <Modal abierto={abierto} titulo={edicion ? `Editar ${titulo.toLowerCase()}` : `Nuevo registro`} onCerrar={() => setAbierto(false)} ancho="560px">
        <form className="gst-modal" onSubmit={guardar} noValidate>
          <div className="gst-rejilla">
            <div className="vst-campo">
              <label htmlFor="cat-codigo">Código *</label>
              <input id="cat-codigo" className="vst-input" value={datos.codigo} onChange={(evento) => setDatos((previo) => ({ ...previo, codigo: evento.target.value.toUpperCase() }))} />
            </div>
            <div className="vst-campo">
              <label htmlFor="cat-nombre">Nombre *</label>
              <input id="cat-nombre" className="vst-input" value={datos.nombre} onChange={(evento) => setDatos((previo) => ({ ...previo, nombre: evento.target.value }))} />
            </div>
            <div className="vst-campo gst-ancha">
              <label htmlFor="cat-descripcion">Descripción</label>
              <textarea id="cat-descripcion" className="vst-input" rows={3} value={datos.descripcion} onChange={(evento) => setDatos((previo) => ({ ...previo, descripcion: evento.target.value }))} />
            </div>
            {edicion ? (
              <div className="vst-campo">
                <label htmlFor="cat-estado">Estado</label>
                <select id="cat-estado" className="vst-select" value={datos.estado} onChange={(evento) => setDatos((previo) => ({ ...previo, estado: evento.target.value as CatalogoFormulario['estado'] }))}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            ) : null}
          </div>
          {error ? <span className="vst-error">{error}</span> : null}
          <div className="gst-modal-pie">
            <Button variante="contorno" onClick={() => setAbierto(false)} disabled={enviando}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
