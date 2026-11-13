import { useCallback, useEffect, useState } from 'react'
import { Contact, Plus, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import Modal from '../../../components/common/Modal'
import PestanasGestion from '../components/PestanasGestion'
import TablaPerfiles from './components/TablaPerfiles'
import ModalPerfil from './components/ModalPerfil'
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

  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [perfilEdicion, setPerfilEdicion] = useState<Perfil | null>(null)
  const [confirmacion, setConfirmacion] = useState<Perfil | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const recargar = useCallback(async () => {
    setPerfiles(await listarPerfiles())
    setCargando(false)
  }, [])

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
    if (perfilEdicion) {
      const actualizado = await actualizarPerfil(perfilEdicion.id, datos)
      if (!actualizado) {
        avisar('No fue posible actualizar el perfil.')
        return false
      }
      avisar(`Perfil «${datos.nombre}» actualizado correctamente.`)
    } else {
      const creado = await crearPerfil(datos)
      avisar(`Perfil «${creado.nombre}» creado correctamente.`)
    }
    await recargar()
    return true
  }

  async function alternarEstado(perfil: Perfil) {
    const nuevo: Estado = perfil.estado === 'activo' ? 'inactivo' : 'activo'
    const resultado = await cambiarEstadoPerfil(perfil.id, nuevo)
    if (!resultado) {
      avisar('No fue posible cambiar el estado del perfil.')
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
    const ok = await eliminarPerfil(confirmacion.id)
    setEliminando(false)
    setConfirmacion(null)
    if (!ok) {
      avisar('No fue posible eliminar el perfil.')
      return
    }
    avisar(`Perfil «${confirmacion.nombre}» eliminado.`)
    await recargar()
  }

  const activos = perfiles.filter((perfil) => perfil.estado === 'activo').length

  return (
    <PlantillaVista titulo="Gestión de Perfiles" className="gst gst-perfiles">
      <PageHeader
        titulo="Gestión de Perfiles"
        subtitulo="Administra los perfiles y sus autorizaciones dentro de la plataforma."
        acciones={
          <Button onClick={abrirAlta}>
            <Plus size={16} />
            Nuevo Perfil
          </Button>
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
            <p>Crea el primer perfil con el botón «Nuevo Perfil» para poder asignarlo a los usuarios.</p>
            <Button variante="contorno" onClick={abrirAlta}>
              <Plus size={15} />
              Nuevo Perfil
            </Button>
          </div>
        ) : (
          <TablaPerfiles
            perfiles={perfiles}
            onEditar={abrirEdicion}
            onAlternarEstado={alternarEstado}
            onEliminar={(perfil) => setConfirmacion(perfil)}
          />
        )}

        <p className="gst-demo">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>
            Datos de demostración guardados en este navegador (<code>src/services/perfilesService.ts</code>
            ). Los permisos que se asignen a cada perfil se administran en la pestaña «Roles y
            Permisos».
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
        titulo="Eliminar perfil"
        onCerrar={() => setConfirmacion(null)}
        ancho="420px"
      >
        <div className="gst-confirmar">
          <span className="gst-confirmar-icono" aria-hidden="true">
            <Trash2 size={26} />
          </span>
          <h4>¿Eliminar este perfil?</h4>
          <p>
            Se eliminará <b>{confirmacion?.nombre}</b> junto con sus permisos asociados. Esta acción
            no se puede deshacer.
          </p>
          <div className="gst-confirmar-pie">
            <Button variante="contorno" onClick={() => setConfirmacion(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button onClick={confirmarEliminacion} disabled={eliminando}>
              {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </PlantillaVista>
  )
}
