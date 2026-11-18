import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import type { ErroresDato } from '../erroresApi'
import type {
  ActividadCatalogo,
  AlcanceEmisionCatalogo,
  DatoActividad,
  DatoActividadFormulario,
  FuenteEmisionCatalogo,
  PeriodoCatalogo,
  UnidadMedida,
} from '../../../services/tipos'

/** Catálogos que alimentan los selectores del formulario. */
export interface CatalogosFormulario {
  actividades: ActividadCatalogo[]
  periodos: PeriodoCatalogo[]
  fuentes: FuenteEmisionCatalogo[]
  alcances: AlcanceEmisionCatalogo[]
  unidades: UnidadMedida[]
}

const VACIO: DatoActividadFormulario = {
  activityId: '',
  periodId: '',
  emissionSourceId: '',
  scopeId: '',
  unitId: '',
  quantity: '',
  whatToCopy: '',
  document: '',
}

/**
 * Mismo formato que valida el backend: hasta 16 dígitos enteros y 8
 * decimales, estrictamente mayor que cero.
 */
const CANTIDAD_RE = /^\d{1,16}(\.\d{1,8})?$/

/** Valida contra las reglas del backend. Devuelve el mapa de errores. */
function validar(
  datos: DatoActividadFormulario,
  catalogos: CatalogosFormulario,
): ErroresDato {
  const errores: ErroresDato = {}

  if (!datos.activityId) errores.activityId = 'Selecciona una actividad.'
  else if (!catalogos.actividades.some((a) => String(a.id) === datos.activityId))
    errores.activityId = 'La actividad seleccionada ya no existe en este proyecto.'

  if (!datos.periodId) errores.periodId = 'Selecciona un periodo.'
  else if (!catalogos.periodos.some((p) => String(p.id) === datos.periodId))
    errores.periodId = 'El periodo seleccionado ya no existe en este proyecto.'

  if (!datos.emissionSourceId) errores.emissionSourceId = 'Selecciona una fuente de emisión.'

  if (!datos.scopeId) errores.scopeId = 'Selecciona un alcance.'

  if (!datos.unitId) errores.unitId = 'Selecciona una unidad.'

  const cantidad = datos.quantity.trim()
  if (!cantidad) errores.quantity = 'La cantidad es obligatoria.'
  else if (!CANTIDAD_RE.test(cantidad))
    errores.quantity = 'Usa números positivos con hasta 8 decimales (ej. 4000 o 12.5).'
  else if (Number(cantidad) <= 0) errores.quantity = 'La cantidad debe ser mayor que cero.'

  const queSeCopia = datos.whatToCopy.trim()
  if (!queSeCopia) errores.whatToCopy = 'Indica qué se copia del documento.'
  else if (queSeCopia.length > 255) errores.whatToCopy = 'Máximo 255 caracteres.'

  const documento = datos.document.trim()
  if (!documento) errores.document = 'El documento es obligatorio.'
  else if (documento.length > 255) errores.document = 'Máximo 255 caracteres.'

  return errores
}

interface ModalDatoActividadProps {
  abierto: boolean
  /** Registro a editar, o `null` para crear uno nuevo. */
  dato?: DatoActividad | null
  catalogos: CatalogosFormulario
  /** `true` mientras el catálogo del proyecto se está cargando. */
  cargandoCatalogos: boolean
  onCerrar: () => void
  /** Devuelve `true` si el guardado fue correcto (la vista recarga y se cierra). */
  onGuardar: (datos: DatoActividadFormulario) => Promise<boolean>
  /** Errores por campo devueltos por la API (422), reseteados al abrir. */
  erroresApi?: ErroresDato
}

/**
 * Formulario de datos de actividad (alta y edición).
 * Guarda solo la cantidad original del documento: no existe factor de
 * emisión ni resultado CO2e en este módulo.
 */
export default function ModalDatoActividad({
  abierto,
  dato,
  catalogos,
  cargandoCatalogos,
  onCerrar,
  onGuardar,
  erroresApi,
}: ModalDatoActividadProps) {
  const [datos, setDatos] = useState<DatoActividadFormulario>(VACIO)
  const [errores, setErrores] = useState<ErroresDato>({})
  const [enviando, setEnviando] = useState(false)

  const modoEdicion = dato !== null && dato !== undefined

  // Al abrir: carga los valores del registro o arranca en blanco, y limpia
  // los errores de una sesión anterior (los de la API los manda la vista).
  useEffect(() => {
    if (!abierto) return
    if (dato) {
      setDatos({
        activityId: String(dato.activityId),
        periodId: String(dato.periodId),
        emissionSourceId: String(dato.emissionSourceId),
        scopeId: String(dato.scopeId),
        unitId: String(dato.unitId),
        quantity: dato.quantity,
        whatToCopy: dato.whatToCopy,
        document: dato.document,
      })
    } else {
      setDatos(VACIO)
    }
    setErrores({})
    setEnviando(false)
  }, [abierto, dato])

  // Los errores que devuelve la API (422) se pintan en los campos al instante.
  useEffect(() => {
    if (erroresApi && Object.keys(erroresApi).length > 0) {
      setErrores((prev) => ({ ...prev, ...erroresApi }))
    }
  }, [erroresApi])

  const escribir = (campo: keyof DatoActividadFormulario, valor: string) => {
    setDatos((actual) => ({ ...actual, [campo]: valor }))
    setErrores((actual) => {
      if (!actual[campo]) return actual
      const { [campo]: _borrado, ...resto } = actual
      return resto
    })
  }

  /** Guía del selector cuando el catálogo del proyecto aún está vacío. */
  const guia: Record<string, string> = {
    activityId: 'No hay actividades para este proyecto',
    periodId: 'No hay periodos para este proyecto',
    emissionSourceId: 'No hay fuentes de emisión activas',
    scopeId: 'No hay alcances de emisión activos',
    unitId: 'No hay unidades de medida activas',
  }

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    const erroresCliente = validar(datos, catalogos)
    if (Object.keys(erroresCliente).length > 0) {
      setErrores(erroresCliente)
      return
    }
    setEnviando(true)
    const correcto = await onGuardar(datos)
    if (!correcto) setEnviando(false)
  }

  return (
    <Modal
      abierto={abierto}
      titulo={modoEdicion ? 'Editar dato de actividad' : 'Nuevo dato de actividad'}
      onCerrar={onCerrar}
      ancho="780px"
    >
      <form className="vst-form" onSubmit={enviar} noValidate>
        {cargandoCatalogos && (
          <p className="dad-cargando-catalogos">Cargando catálogos…</p>
        )}

        <div className="vst-rejilla">
          <div className={`vst-campo${errores.activityId ? ' vst-campo--error' : ''}`}>
            <label className="vst-label" htmlFor="dato-actividad">
              Actividad <span aria-hidden="true">*</span>
            </label>
            <select
              id="dato-actividad"
              className="vst-select"
              value={datos.activityId}
              onChange={(e) => escribir('activityId', e.target.value)}
              disabled={cargandoCatalogos}
              required
            >
              <option value="">{guia.activityId}</option>
              {catalogos.actividades.map((actividad) => (
                <option key={actividad.id} value={actividad.id}>
                  {actividad.processName
                    ? `${actividad.name} — ${actividad.processName}`
                    : actividad.name}
                </option>
              ))}
            </select>
            {errores.activityId && <span className="vst-error">{errores.activityId}</span>}
          </div>

          <div className={`vst-campo${errores.periodId ? ' vst-campo--error' : ''}`}>
            <label className="vst-label" htmlFor="dato-periodo">
              Periodo de medición <span aria-hidden="true">*</span>
            </label>
            <select
              id="dato-periodo"
              className="vst-select"
              value={datos.periodId}
              onChange={(e) => escribir('periodId', e.target.value)}
              disabled={cargandoCatalogos}
              required
            >
              <option value="">{guia.periodId}</option>
              {catalogos.periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {`${periodo.name} (${periodo.status})`}
                </option>
              ))}
            </select>
            {errores.periodId && <span className="vst-error">{errores.periodId}</span>}
          </div>

          <div className={`vst-campo${errores.quantity ? ' vst-campo--error' : ''}`}>
            <label className="vst-label" htmlFor="dato-cantidad">
              Cantidad <span aria-hidden="true">*</span>
            </label>
            <input
              id="dato-cantidad"
              className="vst-input dad-cantidad"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={datos.quantity}
              onChange={(e) => escribir('quantity', e.target.value)}
              placeholder="4000"
              maxLength={24}
              required
            />
            {errores.quantity && <span className="vst-error">{errores.quantity}</span>}
          </div>

          <div className={`vst-campo${errores.unitId ? ' vst-campo--error' : ''}`}>
            <label className="vst-label" htmlFor="dato-unidad">
              Unidad <span aria-hidden="true">*</span>
            </label>
            <select
              id="dato-unidad"
              className="vst-select"
              value={datos.unitId}
              onChange={(e) => escribir('unitId', e.target.value)}
              disabled={cargandoCatalogos}
              required
            >
              <option value="">{guia.unitId}</option>
              {catalogos.unidades.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                  {unidad.symbol ? `${unidad.name} (${unidad.symbol})` : unidad.name}
                </option>
              ))}
            </select>
            {errores.unitId && <span className="vst-error">{errores.unitId}</span>}
          </div>

          <div className={`vst-campo${errores.emissionSourceId ? ' vst-campo--error' : ''}`}>
            <label className="vst-label" htmlFor="dato-fuente">
              Fuente de emisión <span aria-hidden="true">*</span>
            </label>
            <select
              id="dato-fuente"
              className="vst-select"
              value={datos.emissionSourceId}
              onChange={(e) => escribir('emissionSourceId', e.target.value)}
              disabled={cargandoCatalogos}
              required
            >
              <option value="">{guia.emissionSourceId}</option>
              {catalogos.fuentes.map((fuente) => (
                <option key={fuente.id} value={fuente.id}>
                  {fuente.name}
                </option>
              ))}
            </select>
            {errores.emissionSourceId && (
              <span className="vst-error">{errores.emissionSourceId}</span>
            )}
          </div>

          <div className={`vst-campo${errores.scopeId ? ' vst-campo--error' : ''}`}>
            <label className="vst-label" htmlFor="dato-alcance">
              Alcance <span aria-hidden="true">*</span>
            </label>
            <select
              id="dato-alcance"
              className="vst-select"
              value={datos.scopeId}
              onChange={(e) => escribir('scopeId', e.target.value)}
              disabled={cargandoCatalogos}
              required
            >
              <option value="">{guia.scopeId}</option>
              {catalogos.alcances.map((alcance) => (
                <option key={alcance.id} value={alcance.id}>
                  {alcance.name}
                </option>
              ))}
            </select>
            {errores.scopeId && <span className="vst-error">{errores.scopeId}</span>}
          </div>

          <div
            className={`vst-campo vst-campo--ancho-completo${errores.whatToCopy ? ' vst-campo--error' : ''}`}
          >
            <label className="vst-label" htmlFor="dato-que-se-copia">
              Qué se copia <span aria-hidden="true">*</span>
            </label>
            <input
              id="dato-que-se-copia"
              className="vst-input"
              type="text"
              autoComplete="off"
              value={datos.whatToCopy}
              onChange={(e) => escribir('whatToCopy', e.target.value)}
              placeholder="Ej. Consumo mensual del contador"
              maxLength={255}
              required
            />
            {errores.whatToCopy && <span className="vst-error">{errores.whatToCopy}</span>}
          </div>

          <div
            className={`vst-campo vst-campo--ancho-completo${errores.document ? ' vst-campo--error' : ''}`}
          >
            <label className="vst-label" htmlFor="dato-documento">
              Documento <span aria-hidden="true">*</span>
            </label>
            <input
              id="dato-documento"
              className="vst-input"
              type="text"
              autoComplete="off"
              value={datos.document}
              onChange={(e) => escribir('document', e.target.value)}
              placeholder="Ej. Factura de energía 2026-03"
              maxLength={255}
              required
            />
            {errores.document && <span className="vst-error">{errores.document}</span>}
          </div>
        </div>

        <p className="dad-nota-formulario">
          Se guarda únicamente la cantidad original del documento; el factor de emisión y el
          resultado en CO₂e se calculan en el módulo de cálculos.
        </p>

        <div className="vst-form-pie">
          <Button variante="contorno" type="button" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Crear dato'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
