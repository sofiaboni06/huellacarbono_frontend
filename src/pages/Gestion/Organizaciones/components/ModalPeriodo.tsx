import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import type { EstadoPeriodo, Periodo, PeriodoFormulario } from '../../../../services/periodosService'

const VACIO: PeriodoFormulario = {
  nombre: '',
  fechaInicio: '',
  fechaFin: '',
  estado: 'ABIERTO',
}

interface ModalPeriodoProps {
  abierto: boolean
  periodo?: Periodo | null
  onCerrar: () => void
  onGuardar: (datos: PeriodoFormulario) => Promise<boolean>
}

export default function ModalPeriodo({ abierto, periodo, onCerrar, onGuardar }: ModalPeriodoProps) {
  const editando = Boolean(periodo)
  const [datos, setDatos] = useState<PeriodoFormulario>(VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setDatos(
      periodo
        ? {
            nombre: periodo.nombre,
            fechaInicio: periodo.fechaInicio,
            fechaFin: periodo.fechaFin,
            estado: periodo.estado,
          }
        : { ...VACIO },
    )
    setError('')
    setEnviando(false)
  }, [abierto, periodo])

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!datos.nombre.trim() || !datos.fechaInicio || !datos.fechaFin) {
      setError('Completa el nombre y las dos fechas.')
      return
    }
    if (datos.fechaFin < datos.fechaInicio) {
      setError('La fecha fin no puede ser anterior a la fecha de inicio.')
      return
    }
    setEnviando(true)
    const ok = await onGuardar({ ...datos, nombre: datos.nombre.trim() })
    setEnviando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar periodo' : 'Nuevo periodo'}
      onCerrar={onCerrar}
      ancho="560px"
    >
      <form className="gst-modal" onSubmit={enviar} noValidate>
        <p className="org-ayuda">
          El periodo pertenece solo a esta organización. Otra empresa puede medir otras fechas.
        </p>
        <div className="vst-campo">
          <label htmlFor="per-nombre">Nombre *</label>
          <input
            id="per-nombre"
            className="vst-input"
            value={datos.nombre}
            placeholder="Año 2026"
            onChange={(evento) => setDatos((prev) => ({ ...prev, nombre: evento.target.value }))}
          />
        </div>
        <div className="gst-rejilla">
          <div className="vst-campo">
            <label htmlFor="per-inicio">Fecha de inicio *</label>
            <input
              id="per-inicio"
              className="vst-input"
              type="date"
              value={datos.fechaInicio}
              onChange={(evento) => setDatos((prev) => ({ ...prev, fechaInicio: evento.target.value }))}
            />
          </div>
          <div className="vst-campo">
            <label htmlFor="per-fin">Fecha de fin *</label>
            <input
              id="per-fin"
              className="vst-input"
              type="date"
              value={datos.fechaFin}
              onChange={(evento) => setDatos((prev) => ({ ...prev, fechaFin: evento.target.value }))}
            />
          </div>
        </div>
        {editando ? (
          <div className="vst-campo">
            <label htmlFor="per-estado">Estado</label>
            <select
              id="per-estado"
              className="vst-select"
              value={datos.estado}
              onChange={(evento) =>
                setDatos((prev) => ({ ...prev, estado: evento.target.value as EstadoPeriodo }))
              }
            >
              <option value="ABIERTO">Abierto</option>
              <option value="CERRADO">Cerrado</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </select>
          </div>
        ) : null}
        {error ? <span className="vst-error">{error}</span> : null}
        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar periodo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
