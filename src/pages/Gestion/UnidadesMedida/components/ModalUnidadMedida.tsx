import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import type { ErroresUnidad } from '../erroresApi'
import type { UnidadMedida, UnidadMedidaFormulario } from '../../../../services/tipos'

const VACIO: UnidadMedidaFormulario = {
  codigo: '',
  nombre: '',
  simbolo: '',
  magnitud: '',
  factorBase: '',
}

type Campo = keyof UnidadMedidaFormulario
type Errores = ErroresUnidad

interface ModalUnidadMedidaProps {
  abierto: boolean
  unidad?: UnidadMedida | null
  onCerrar: () => void
  /** Devuelve `true` si el guardado fue correcto (la vista recarga y se cierra). */
  onGuardar: (datos: UnidadMedidaFormulario) => Promise<boolean>
  /** Errores por campo devueltos por la API (422/409), reseteados al abrir. */
  erroresApi?: Errores
}

/**
 * Mismo formato DECIMAL(24, 12) que valida el backend: hasta 12 dígitos
 * enteros y 12 decimales, estrictamente mayor que cero.
 */
const FACTOR_RE = /^\d{1,12}(\.\d{1,12})?$/

/** Valida contra las reglas del backend. Devuelve el mapa de errores. */
function validar(datos: UnidadMedidaFormulario): Errores {
  const errores: Errores = {}

  const codigo = datos.codigo.trim()
  if (!codigo) errores.codigo = 'El código es obligatorio.'
  else if (codigo.length > 30) errores.codigo = 'Máximo 30 caracteres.'

  const nombre = datos.nombre.trim()
  if (!nombre) errores.nombre = 'El nombre es obligatorio.'
  else if (nombre.length > 100) errores.nombre = 'Máximo 100 caracteres.'

  const simbolo = datos.simbolo.trim()
  if (!simbolo) errores.simbolo = 'El símbolo es obligatorio.'
  else if (simbolo.length > 30) errores.simbolo = 'Máximo 30 caracteres.'

  const magnitud = datos.magnitud.trim()
  if (!magnitud) errores.magnitud = 'La magnitud es obligatoria.'
  else if (magnitud.length > 50) errores.magnitud = 'Máximo 50 caracteres.'

  const factor = datos.factorBase.trim()
  if (!factor) {
    errores.factorBase = 'El factor base es obligatorio.'
  } else if (!FACTOR_RE.test(factor)) {
    errores.factorBase = 'Usa un decimal con máximo 12 enteros y 12 decimales (ej. 1 o 0.001).'
  } else if (!/[1-9]/.test(factor)) {
    errores.factorBase = 'El factor base debe ser mayor que cero.'
  }

  return errores
}

/** Modal de alta y edición de unidades de medida (comparten formulario). */
export default function ModalUnidadMedida({
  abierto,
  unidad,
  onCerrar,
  onGuardar,
  erroresApi,
}: ModalUnidadMedidaProps) {
  const editando = Boolean(unidad)
  const [datos, setDatos] = useState<UnidadMedidaFormulario>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  // Carga la unidad seleccionada (o reinicia el alta).
  useEffect(() => {
    if (!abierto) return
    if (unidad) {
      setDatos({
        codigo: unidad.code,
        nombre: unidad.name,
        simbolo: unidad.symbol,
        magnitud: unidad.magnitude,
        // Se conserva la cadena tal cual: convertirla a Number perdería precisión.
        factorBase: unidad.baseFactor,
      })
    } else {
      setDatos({ ...VACIO })
    }
    setErrores({})
    setEnviando(false)
  }, [abierto, unidad])

  // Muestra los errores que devuelva la API sobre los campos afectados.
  useEffect(() => {
    if (erroresApi && Object.keys(erroresApi).length > 0) {
      setErrores((prev) => ({ ...prev, ...erroresApi }))
    }
  }, [erroresApi])

  function cambiar(campo: Campo, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validar(datos)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    const ok = await onGuardar({
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
      simbolo: datos.simbolo.trim(),
      magnitud: datos.magnitud.trim(),
      // Siempre cadena: nunca se convierte a Number.
      factorBase: datos.factorBase.trim(),
    })
    setEnviando(false)
    if (ok) onCerrar()
  }

  const invalido = (campo: Campo) =>
    errores[campo] ? { 'aria-invalid': 'true' as const } : {}

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar unidad de medida' : 'Nueva unidad de medida'}
      onCerrar={onCerrar}
      ancho="560px"
    >
      <form className="gst-modal" onSubmit={enviar} noValidate>
        <div className="gst-rejilla">
          <div className="vst-campo">
            <label htmlFor="umd-codigo">Código *</label>
            <input
              id="umd-codigo"
              className="vst-input"
              type="text"
              autoComplete="off"
              maxLength={30}
              placeholder="KG"
              value={datos.codigo}
              onChange={(e) => cambiar('codigo', e.target.value)}
              {...invalido('codigo')}
            />
            {errores.codigo && <span className="vst-error">{errores.codigo}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="umd-simbolo">Símbolo *</label>
            <input
              id="umd-simbolo"
              className="vst-input"
              type="text"
              autoComplete="off"
              maxLength={30}
              placeholder="kg"
              value={datos.simbolo}
              onChange={(e) => cambiar('simbolo', e.target.value)}
              {...invalido('simbolo')}
            />
            {errores.simbolo && <span className="vst-error">{errores.simbolo}</span>}
          </div>

          <div className="vst-campo gst-ancha">
            <label htmlFor="umd-nombre">Nombre *</label>
            <input
              id="umd-nombre"
              className="vst-input"
              type="text"
              autoComplete="off"
              maxLength={100}
              placeholder="Kilogramo"
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              {...invalido('nombre')}
            />
            {errores.nombre && <span className="vst-error">{errores.nombre}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="umd-magnitud">Magnitud *</label>
            <input
              id="umd-magnitud"
              className="vst-input"
              type="text"
              autoComplete="off"
              maxLength={50}
              placeholder="MASA"
              value={datos.magnitud}
              onChange={(e) => cambiar('magnitud', e.target.value)}
              {...invalido('magnitud')}
            />
            {errores.magnitud && <span className="vst-error">{errores.magnitud}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="umd-factor">Factor base *</label>
            <input
              id="umd-factor"
              className="vst-input umd-factor-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="1"
              value={datos.factorBase}
              onChange={(e) => cambiar('factorBase', e.target.value)}
              {...invalido('factorBase')}
            />
            {errores.factorBase && <span className="vst-error">{errores.factorBase}</span>}
          </div>
        </div>

        <p className="umd-nota">
          El factor base se almacena como decimal de 24 dígitos con 12 decimales; escríbelo como
          texto para conservar toda su precisión.
        </p>

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
