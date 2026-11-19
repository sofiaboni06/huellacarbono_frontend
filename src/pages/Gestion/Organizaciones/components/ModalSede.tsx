import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import type { Sede, SedeFormulario } from '../../../../services/organizacionesService'

const VACIO: SedeFormulario = {
  nombre: '',
  codigo: '',
  direccion: '',
  telefono: '',
  correo: '',
  responsableNombre: '',
  responsableCargo: '',
  responsableCorreo: '',
  responsableTelefono: '',
  estado: 'activo',
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Errores = Partial<Record<keyof SedeFormulario, string>>

interface ModalSedeProps {
  abierto: boolean
  sede?: Sede | null
  onCerrar: () => void
  onGuardar: (datos: SedeFormulario) => Promise<boolean>
}

function validar(datos: SedeFormulario): Errores {
  const errores: Errores = {}
  if (datos.nombre.trim().length < 2) errores.nombre = 'Ingresa el nombre de la sede.'
  if (datos.correo.trim() && !CORREO_RE.test(datos.correo.trim())) {
    errores.correo = 'Ingresa un correo válido.'
  }
  if (datos.responsableCorreo.trim() && !CORREO_RE.test(datos.responsableCorreo.trim())) {
    errores.responsableCorreo = 'Ingresa un correo válido.'
  }
  return errores
}

export default function ModalSede({ abierto, sede, onCerrar, onGuardar }: ModalSedeProps) {
  const editando = Boolean(sede)
  const [datos, setDatos] = useState<SedeFormulario>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setErrores({})
    if (sede) {
      setDatos({
        nombre: sede.nombre,
        codigo: sede.codigo,
        direccion: sede.direccion,
        telefono: sede.telefono,
        correo: sede.correo,
        responsableNombre: sede.responsableNombre,
        responsableCargo: sede.responsableCargo,
        responsableCorreo: sede.responsableCorreo,
        responsableTelefono: sede.responsableTelefono,
        estado: sede.estado,
      })
      return
    }
    setDatos(VACIO)
  }, [abierto, sede])

  function cambiar<K extends keyof SedeFormulario>(campo: K, valor: SedeFormulario[K]) {
    setDatos((previo) => ({ ...previo, [campo]: valor }))
    setErrores((previo) => ({ ...previo, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const encontrados = validar(datos)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return
    setEnviando(true)
    const ok = await onGuardar(datos)
    setEnviando(false)
    if (ok) onCerrar()
  }

  const invalido = (campo: keyof SedeFormulario) =>
    errores[campo] ? { 'aria-invalid': 'true' as const } : {}

  return (
    <Modal abierto={abierto} titulo={editando ? 'Editar sede' : 'Nueva sede'} onCerrar={onCerrar} ancho="720px">
      <form className="gst-modal" onSubmit={enviar} noValidate>
        <p className="org-ayuda">
          La sede queda en el municipio de la organización. CTPI y Comercio, por ejemplo, no eligen municipio.
        </p>
        <div className="gst-rejilla">
          <div className="vst-campo">
            <label htmlFor="sede-nombre">Nombre *</label>
            <input
              id="sede-nombre"
              className="vst-input"
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              {...invalido('nombre')}
            />
            {errores.nombre && <span className="vst-error">{errores.nombre}</span>}
          </div>
          <div className="vst-campo">
            <label htmlFor="sede-codigo">Código</label>
            <input
              id="sede-codigo"
              className="vst-input"
              value={datos.codigo}
              onChange={(e) => cambiar('codigo', e.target.value)}
            />
          </div>
          <div className="vst-campo gst-ancha">
            <label htmlFor="sede-direccion">Dirección</label>
            <input
              id="sede-direccion"
              className="vst-input"
              value={datos.direccion}
              onChange={(e) => cambiar('direccion', e.target.value)}
            />
          </div>
          <div className="vst-campo">
            <label htmlFor="sede-telefono">Teléfono</label>
            <input
              id="sede-telefono"
              className="vst-input"
              value={datos.telefono}
              onChange={(e) => cambiar('telefono', e.target.value)}
            />
          </div>
          <div className="vst-campo">
            <label htmlFor="sede-correo">Correo</label>
            <input
              id="sede-correo"
              className="vst-input"
              type="email"
              value={datos.correo}
              onChange={(e) => cambiar('correo', e.target.value)}
              {...invalido('correo')}
            />
            {errores.correo && <span className="vst-error">{errores.correo}</span>}
          </div>
          {editando ? (
            <div className="vst-campo">
              <label htmlFor="sede-estado">Estado</label>
              <select
                id="sede-estado"
                className="vst-select"
                value={datos.estado}
                onChange={(e) => cambiar('estado', e.target.value as SedeFormulario['estado'])}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          ) : null}
        </div>

        <h4 className="org-seccion">Responsable de la sede</h4>
        <p className="org-ayuda">Es la ficha de contacto. Las cuentas que entran al sistema se asignan aparte.</p>
        <div className="gst-rejilla">
          <div className="vst-campo">
            <label htmlFor="sede-resp-nombre">Nombre</label>
            <input
              id="sede-resp-nombre"
              className="vst-input"
              value={datos.responsableNombre}
              onChange={(e) => cambiar('responsableNombre', e.target.value)}
            />
          </div>
          <div className="vst-campo">
            <label htmlFor="sede-resp-cargo">Cargo</label>
            <input
              id="sede-resp-cargo"
              className="vst-input"
              value={datos.responsableCargo}
              onChange={(e) => cambiar('responsableCargo', e.target.value)}
            />
          </div>
          <div className="vst-campo">
            <label htmlFor="sede-resp-correo">Correo</label>
            <input
              id="sede-resp-correo"
              className="vst-input"
              type="email"
              value={datos.responsableCorreo}
              onChange={(e) => cambiar('responsableCorreo', e.target.value)}
              {...invalido('responsableCorreo')}
            />
            {errores.responsableCorreo && <span className="vst-error">{errores.responsableCorreo}</span>}
          </div>
          <div className="vst-campo">
            <label htmlFor="sede-resp-telefono">Teléfono</label>
            <input
              id="sede-resp-telefono"
              className="vst-input"
              value={datos.responsableTelefono}
              onChange={(e) => cambiar('responsableTelefono', e.target.value)}
            />
          </div>
        </div>

        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar sede'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
