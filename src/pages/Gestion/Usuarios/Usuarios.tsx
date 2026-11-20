import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search, Trash2, TriangleAlert, Users, X } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import TablaUsuarios from './components/TablaUsuarios'
import ModalUsuario from './components/ModalUsuario'
import { usePerfil } from '../../../context/PerfilContext'
import {
  cambiarEstadoUsuario,
  crearUsuario,
  eliminarUsuario,
  actualizarUsuario,
  listarOpcionesPerfil,
  listarUsuarios,
} from '../../../services/usuariosService'
import type { Estado, Perfil, Usuario, UsuarioFormulario } from '../../../services/tipos'
import './Usuarios.css'

/** Registros por página. */
const POR_PAGINA = 8

/** Quita tildes y pasa a minúsculas para comparar de forma tolerante. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

interface Confirmacion {
  usuario: Usuario
}

/**
 * Vista de Gestión de Usuarios.
 *
 * Búsqueda, filtros, paginación, alta, edición, activación/desactivación y
 * borrado con confirmación. Los datos provienen de `usuariosService`
 * (demostración local con la forma de una API real).
 */
export default function Usuarios() {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrear = puede('usuario.crear')
  const puedeEditar = puede('usuario.editar')

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)

  const [busqueda, setBusqueda] = useState('')
  const [filtroPerfil, setFiltroPerfil] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | Estado>('todos')
  const [pagina, setPagina] = useState(1)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioEdicion, setUsuarioEdicion] = useState<Usuario | null>(null)
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)
  const [eliminando, setEliminando] = useState(false)

  /** Recarga la lista desde el servicio. */
  const recargar = useCallback(async () => {
    try {
      const [listaUsuarios, listaPerfiles] = await Promise.all([
        listarUsuarios(),
        listarOpcionesPerfil(),
      ])
      setUsuarios(listaUsuarios)
      setPerfiles(listaPerfiles)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar los usuarios.')
    } finally {
      setCargando(false)
    }
  }, [avisar])

  useEffect(() => {
    void recargar()
  }, [recargar])

  // Vuelve a la primera página cuando cambian los criterios de filtrado.
  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroPerfil, filtroEstado])

  /** Perfiles filtrables en la barra (solo los que existen hoy). */
  const opcionesPerfil = useMemo(() => {
    const nombres = new Set(perfiles.map((perfil) => perfil.nombre))
    for (const usuario of usuarios) nombres.add(usuario.perfil)
    return Array.from(nombres).sort((a, b) => a.localeCompare(b, 'es'))
  }, [perfiles, usuarios])

  /** Lista resultante de aplicar búsqueda y filtros. */
  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda.trim())
    return usuarios.filter((usuario) => {
      if (filtroPerfil !== 'todos' && usuario.perfil !== filtroPerfil) return false
      if (filtroEstado !== 'todos' && usuario.estado !== filtroEstado) return false
      if (!texto) return true
      const candidatos = [
        usuario.nombres,
        usuario.apellidos,
        `${usuario.nombres} ${usuario.apellidos}`,
        usuario.correo,
        usuario.perfil,
      ]
      return candidatos.some((candidato) => normalizar(candidato).includes(texto))
    })
  }, [usuarios, busqueda, filtroPerfil, filtroEstado])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = filtrados.length === 0 ? 0 : (paginaSegura - 1) * POR_PAGINA + 1
  const hasta = Math.min(paginaSegura * POR_PAGINA, filtrados.length)
  const visibles = filtrados.slice(desde - 1, hasta)

  /** Abre el modal en modo alta. */
  function abrirAlta() {
    setUsuarioEdicion(null)
    setModalAbierto(true)
  }

  /** Abre el modal en modo edición con el usuario elegido. */
  function abrirEdicion(usuario: Usuario) {
    setUsuarioEdicion(usuario)
    setModalAbierto(true)
  }

  /** Guarda alta o edición según corresponda. */
  async function guardar(datos: UsuarioFormulario): Promise<boolean> {
    try {
      if (usuarioEdicion) {
        await actualizarUsuario(usuarioEdicion.id, datos)
        avisar(`Usuario «${datos.nombres} ${datos.apellidos}» actualizado correctamente.`)
      } else {
        await crearUsuario(datos)
        avisar(`Usuario «${datos.nombres} ${datos.apellidos}» registrado correctamente.`)
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible guardar el usuario.')
      return false
    }
  }

  /** Activa o desactiva un usuario. */
  async function alternarEstado(usuario: Usuario) {
    const nuevo: Estado = usuario.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await cambiarEstadoUsuario(usuario.id, nuevo)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cambiar el estado del usuario.')
      return
    }
    avisar(
      nuevo === 'activo'
        ? `«${usuario.nombres} ${usuario.apellidos}» fue activado.`
        : `«${usuario.nombres} ${usuario.apellidos}» fue desactivado.`,
    )
    await recargar()
  }

  /** Confirma y ejecuta el borrado. */
  async function confirmarEliminacion() {
    if (!confirmacion) return
    setEliminando(true)
    const { usuario } = confirmacion
    try {
      await eliminarUsuario(usuario.id)
      avisar(`Usuario «${usuario.nombres} ${usuario.apellidos}» desactivado.`)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible desactivar el usuario.')
    }
    setEliminando(false)
    setConfirmacion(null)
    await recargar()
  }

  /** Indica si hay algún criterio de filtrado activo. */
  const hayFiltros = busqueda.trim() !== '' || filtroPerfil !== 'todos' || filtroEstado !== 'todos'

  return (
    <PlantillaVista titulo="Gestión de Usuarios" className="gst gst-usuarios">
      <PageHeader
        titulo="Gestión de Usuarios"
        subtitulo="Administra los usuarios registrados en la plataforma HuellaVerde."
        acciones={
          puedeCrear ? (
            <Button onClick={abrirAlta}>
              <Plus size={16} />
              Nuevo Usuario
            </Button>
          ) : null
        }
      />

      <section className="vst-tarjeta gst-barra" aria-label="Búsqueda y filtros de usuarios">
        <div className="gst-buscador">
          <Search size={17} aria-hidden="true" />
          <input
            className="vst-input"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o perfil…"
            aria-label="Buscar por nombre, correo electrónico o perfil"
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
            <span>Perfil</span>
            <select
              className="vst-select"
              value={filtroPerfil}
              onChange={(e) => setFiltroPerfil(e.target.value)}
            >
              <option value="todos">Todos los perfiles</option>
              {opcionesPerfil.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="gst-filtro">
            <span>Estado</span>
            <select
              className="vst-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'todos' | Estado)}
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </label>
        </div>

        <span className="gst-contador" aria-live="polite">
          <Users size={14} aria-hidden="true" />
          {filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </section>

      <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Listado de usuarios">
        {cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando usuarios…
          </div>
        ) : visibles.length === 0 ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <Users size={26} />
            </span>
            <h3>{hayFiltros ? 'Sin coincidencias' : 'Aún no hay usuarios'}</h3>
            <p>
              {hayFiltros
                ? 'Ningún usuario coincide con la búsqueda o los filtros aplicados. Ajusta los criterios para ver más resultados.'
                : puedeCrear
                  ? 'Registra el primer usuario con el botón «Nuevo Usuario».'
                  : 'Cuando existan usuarios, aparecerán en este listado.'}
            </p>
            {hayFiltros && (
              <Button
                variante="contorno"
                onClick={() => {
                  setBusqueda('')
                  setFiltroPerfil('todos')
                  setFiltroEstado('todos')
                }}
              >
                <X size={15} />
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <TablaUsuarios
              usuarios={visibles}
              puedeEditar={puedeEditar}
              onEditar={abrirEdicion}
              onAlternarEstado={alternarEstado}
              onEliminar={(usuario) => setConfirmacion({ usuario })}
            />

            <div className="gst-paginacion">
              <p className="gst-paginacion-info">
                Mostrando <b>{desde}–{hasta}</b> de <b>{filtrados.length}</b>{' '}
                {filtrados.length === 1 ? 'usuario' : 'usuarios'}
              </p>
              <nav className="gst-paginacion-botones" aria-label="Paginación de usuarios">
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
          <TriangleAlert size={14} aria-hidden="true" />
          <span>
            Los usuarios se leen y guardan en el servidor. Desactivar una cuenta no borra su
            historial.
          </span>
        </p>
      </section>

      <ModalUsuario
        abierto={modalAbierto}
        usuario={usuarioEdicion}
        perfiles={perfiles}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardar}
      />

      <Modal
        abierto={confirmacion !== null}
        titulo="Desactivar usuario"
        onCerrar={() => setConfirmacion(null)}
        ancho="420px"
      >
        <div className="gst-confirmar">
          <span className="gst-confirmar-icono" aria-hidden="true">
            <Trash2 size={26} />
          </span>
          <h4>¿Desactivar este usuario?</h4>
          <p>
            <b>{confirmacion?.usuario.nombres} {confirmacion?.usuario.apellidos}</b>{' '}
            ({confirmacion?.usuario.correo}) no podrá iniciar sesión. Puedes activarlo de nuevo
            después.
          </p>
          <div className="gst-confirmar-pie">
            <Button variante="contorno" onClick={() => setConfirmacion(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button onClick={confirmarEliminacion} disabled={eliminando}>
              {eliminando ? 'Desactivando…' : 'Sí, desactivar'}
            </Button>
          </div>
        </div>
      </Modal>
    </PlantillaVista>
  )
}
