import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import type { Ficha, FichaFormulario } from '../../../../services/procesosService'

const VACIO: FichaFormulario = { nombre: '', descripcion: '', estado: 'activo' }

interface ModalFichaProps {
  abierto: boolean
  titulo: string
  ficha?: Ficha | null
  onCerrar: () => void
  onGuardar: (datos: FichaFormulario) => Promise<boolean>
}

export default function ModalFicha({ abierto, titulo, ficha, onCerrar, onGuardar }: ModalFichaProps) {
  const editando = Boolean(ficha)
  const [datos, setDatos] = useState<FichaFormulario>(VACIO)
  const [errorNombre, setErrorNombre] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setErrorNombre('')
    setDatos(
      ficha
        ? { nombre: ficha.nombre, descripcion: ficha.descripcion, estado: ficha.estado }
        : VACIO,
    )
  }, [abierto, ficha])

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (datos.nombre.trim().length < 2) {
      setErrorNombre('Ingresa al menos 2 caracteres.')
      return
    }
    setEnviando(true)
    const ok = await onGuardar(datos)
    setEnviando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCerrar} ancho="560px">
      <form className="gst-modal" onSubmit={enviar} noValidate>
        <div className="vst-campo">
          <label htmlFor="ficha-nombre">Nombre *</label>
          <input
            id="ficha-nombre"
            className="vst-input"
            value={datos.nombre}
            aria-invalid={errorNombre ? true : undefined}
            onChange={(e) => {
              setDatos((previo) => ({ ...previo, nombre: e.target.value }))
              setErrorNombre('')
            }}
          />
          {errorNombre ? <span className="vst-error">{errorNombre}</span> : null}
        </div>
        <div className="vst-campo">
          <label htmlFor="ficha-descripcion">Descripción</label>
          <textarea
            id="ficha-descripcion"
            className="vst-input"
            rows={3}
            value={datos.descripcion}
            onChange={(e) => setDatos((previo) => ({ ...previo, descripcion: e.target.value }))}
          />
        </div>
        {editando ? (
          <div className="vst-campo">
            <label htmlFor="ficha-estado">Estado</label>
            <select
              id="ficha-estado"
              className="vst-select"
              value={datos.estado}
              onChange={(e) =>
                setDatos((previo) => ({ ...previo, estado: e.target.value as FichaFormulario['estado'] }))
              }
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        ) : null}
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
