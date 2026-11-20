import { useCallback, useEffect, useState } from 'react'
import { Contact, Plus, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import PestanasGestion from '../components/PestanasGestion'
import TablaPerfiles from './components/TablaPerfiles'
import ModalPerfil from './components/ModalPerfil'
import { usePerfil } from '../../../context/PerfilContext'
import {
  actualizarPerfil,
  cambiarEstadoPerfil,
  crearPerfil,
  eliminarPerfil,
  listarPerfiles,
} from '../../../services/perfilesService'
import type { Estado, Perfil, PerfilFormulario } from '../../../services/tipos'
import './Perfiles.css'

/**
 * Vista de Gestión de Perfiles.
 *
 * Alta, edición, activación/desactivación y borrado con confirmación de los
 * perfiles de acceso. Comparte pestañas con la vista de Roles y Permisos.
 */
export default function Perfiles() {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeCrear = puede('rol.crear')
  const puedeEditar = puede('rol.editar')

  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [perfilEdicion, setPerfilEdicion] = useState<Perfil | null>(null)
  const [confirmacion, setConfirmacion] = useState<Perfil | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const recargar = useCallback(async () => {
    try {
      setPerfiles(await listarPerfiles())
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cargar los perfiles.')
    } finally {
      setCargando(false)
    }
  }, [avisar])

  useEffect(() => {
    void recargar()
  }, [recargar])

  function abrirAlta() {
    setPerfilEdicion(null)
    setModalAbierto(true)
  }

  function abrirEdicion(perfil: Perfil) {
    setPerfilEdicion(perfil)
    setModalAbierto(true)
  }

  async function guardar(datos: PerfilFormulario): Promise<boolean> {
    try {
      if (perfilEdicion) {
        await actualizarPerfil(perfilEdicion.id, datos)
        avisar(`Perfil «${datos.nombre}» actualizado correctamente.`)
      } else {
        await crearPerfil(datos)
        avisar(`Perfil «${datos.nombre}» creado correctamente.`)
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible guardar el perfil.')
      return false
    }
  }

  async function alternarEstado(perfil: Perfil) {
    const nuevo: Estado = perfil.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await cambiarEstadoPerfil(perfil.id, nuevo)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible cambiar el estado del perfil.')
      return
    }
    avisar(
      nuevo === 'activo'
        ? `Perfil «${perfil.nombre}» activado.`
        : `Perfil «${perfil.nombre}» desactivado.`,
    )
    await recargar()
  }

  async function confirmarEliminacion() {
    if (!confirmacion) return
    setEliminando(true)
    try {
      await eliminarPerfil(confirmacion.id)
      avisar(`Perfil «${confirmacion.nombre}» desactivado.`)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible desactivar el perfil.')
    }
    setEliminando(false)
    setConfirmacion(null)
    await recargar()
  }

  const activos = perfiles.filter((perfil) => perfil.estado === 'activo').length

  return (
    <PlantillaVista titulo="Gestión de Perfiles" className="gst gst-perfiles">
      <PageHeader
        titulo="Gestión de Perfiles"
        subtitulo="Administra los perfiles y sus autorizaciones dentro de la plataforma."
        acciones={
          puedeCrear ? (
            <Button onClick={abrirAlta}>
              <Plus size={16} />
              Nuevo Perfil
            </Button>
          ) : null
        }
      />

      <PestanasGestion />

      <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Listado de perfiles">
        <div className="gst-barra gst-barra--resumen">
          <span className="gst-contador">
            <Contact size={14} aria-hidden="true" />
            {perfiles.length} {perfiles.length === 1 ? 'perfil' : 'perfiles'}
          </span>
          <span className="gst-contador">
            <ShieldCheck size={14} aria-hidden="true" />
            {activos} activos
          </span>
        </div>

        {cargando ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando perfiles…
          </div>
        ) : perfiles.length === 0 ? (
          <div className="gst-vacio">
            <span className="gst-vacio-icono" aria-hidden="true">
              <Contact size={26} />
            </span>
            <h3>Aún no hay perfiles</h3>
            <p>
              {puedeCrear
                ? 'Crea el primer perfil con el botón «Nuevo Perfil» para poder asignarlo a los usuarios.'
                : 'Cuando existan perfiles, aparecerán en este listado.'}
            </p>
            {puedeCrear ? (
              <Button variante="contorno" onClick={abrirAlta}>
                <Plus size={15} />
                Nuevo Perfil
              </Button>
            ) : null}
          </div>
        ) : (
          <TablaPerfiles
            perfiles={perfiles}
            puedeEditar={puedeEditar}
            onEditar={abrirEdicion}
            onAlternarEstado={alternarEstado}
            onEliminar={(perfil) => setConfirmacion(perfil)}
          />
        )}

        <p className="gst-demo">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>
            Los perfiles se guardan en el servidor. Los cuatro roles del sistema no se pueden
            renombrar ni desactivar.
          </span>
        </p>
      </section>

      <ModalPerfil
        abierto={modalAbierto}
        perfil={perfilEdicion}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardar}
      />

      <Modal
        abierto={confirmacion !== null}
        titulo="Desactivar perfil"
        onCerrar={() => setConfirmacion(null)}
        ancho="420px"
      >
        <div className="gst-confirmar">
          <span className="gst-confirmar-icono" aria-hidden="true">
            <Trash2 size={26} />
          </span>
          <h4>¿Desactivar este perfil?</h4>
          <p>
            <b>{confirmacion?.nombre}</b> dejará de poder asignarse. Los roles del sistema no se
            pueden desactivar.
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
