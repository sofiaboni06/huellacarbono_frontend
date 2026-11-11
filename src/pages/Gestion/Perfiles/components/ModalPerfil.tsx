import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import { nombreDuplicado } from '../../../../services/perfilesService'
import type { Estado, Perfil, PerfilFormulario } from '../../../../services/tipos'

const VACIO: PerfilFormulario = {
  nombre: '',
  descripcion: '',
  estado: 'activo',
}

type Errores = Partial<Record<keyof PerfilFormulario, string>>

interface ModalPerfilProps {
  abierto: boolean
  perfil?: Perfil | null
  onCerrar: () => void
  onGuardar: (datos: PerfilFormulario) => Promise<boolean>
}

function validar(datos: PerfilFormulario, idExcluido?: string): Errores {
  const errores: Errores = {}
  const nombre = datos.nombre.trim()

  if (!nombre) errores.nombre = 'El nombre del perfil es obligatorio.'
  else if (nombre.length < 3) errores.nombre = 'Ingresa al menos 3 caracteres.'
  else if (nombreDuplicado(nombre, idExcluido)) errores.nombre = 'Ya existe un perfil con ese nombre.'

  const descripcion = datos.descripcion.trim()
  if (!descripcion) errores.descripcion = 'La descripción es obligatoria.'
  else if (descripcion.length < 10) errores.descripcion = 'Describe el perfil en al menos 10 caracteres.'

  return errores
}

/** Modal de alta y edición de perfiles (ambos flujos comparten el formulario). */
export default function ModalPerfil({ abierto, perfil, onCerrar, onGuardar }: ModalPerfilProps) {
  const editando = Boolean(perfil)
  const [datos, setDatos] = useState<PerfilFormulario>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    if (perfil) {
      const { id: _id, ...resto } = perfil
      setDatos({ ...resto })
    } else {
      setDatos({ ...VACIO })
    }
    setErrores({})
    setEnviando(false)
  }, [abierto, perfil])

  function cambiar(campo: keyof PerfilFormulario, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validar(datos, perfil?.id)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    const ok = await onGuardar({
      ...datos,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
    })
    setEnviando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar perfil' : 'Nuevo perfil'}
      onCerrar={onCerrar}
      ancho="520px"
    >
      <form className="gst-modal" onSubmit={enviar} noValidate>
        <div className="vst-campo">
          <label htmlFor="per-nombre">Nombre del perfil *</label>
          <input
            id="per-nombre"
            className="vst-input"
            type="text"
            autoComplete="off"
            placeholder="Analista Ambiental"
            value={datos.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            aria-invalid={errores.nombre ? 'true' : undefined}
          />
          {errores.nombre && <span className="vst-error">{errores.nombre}</span>}
        </div>

        <div className="vst-campo">
          <label htmlFor="per-descripcion">Descripción *</label>
          <textarea
            id="per-descripcion"
            className="vst-textarea"
            placeholder="Describe qué puede hacer este perfil dentro de la plataforma…"
            value={datos.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            aria-invalid={errores.descripcion ? 'true' : undefined}
          />
          {errores.descripcion && <span className="vst-error">{errores.descripcion}</span>}
        </div>

        <div className="vst-campo">
          <label htmlFor="per-estado">Estado</label>
          <select
            id="per-estado"
            className="vst-select"
            value={datos.estado}
            onChange={(e) => cambiar('estado', e.target.value as Estado)}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
