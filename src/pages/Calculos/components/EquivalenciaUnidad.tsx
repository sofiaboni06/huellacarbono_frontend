import { useEffect, useState } from 'react'
import { ArrowRightLeft, Info } from 'lucide-react'
import { ErrorApi } from '../../../services/api'
import { equivalenciaUnidad } from '../../../services/papelesService'
import type { EquivalenciaUnidad as Equivalencia } from '../../../services/papelesService'
import { formatoDecimal } from '../../../utils/formatoDecimal'

export interface UnidadVisible {
  id: string
  simbolo: string
}

interface ParametrosFisicos {
  densidad?: string
  unidadDensidadId?: string
  poderCalorifico?: string
  unidadPoderCalorificoId?: string
}

interface Props {
  /** Cantidad tal como la escribió el usuario (punto decimal). */
  cantidad: string
  unidadOrigen: UnidadVisible | null
  /** Unidades de entrada de los factores aprobados del año del periodo. */
  unidadesFactor: UnidadVisible[]
  parametros?: ParametrosFisicos
  /** Servicio de conversión; por defecto, el endpoint del backend. */
  convertir?: typeof equivalenciaUnidad
}

type Estado = { tipo: 'ok'; equivalencia: Equivalencia } | { tipo: 'error'; mensaje: string }

type Solicitud = {
  cantidad: string
  unidadOrigenId: string
  destinos: string[]
  parametros: ParametrosFisicos
}

/** Mismo formato que acepta el backend para la cantidad del dato. */
const RE_CANTIDAD = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$/

/**
 * Equivalencia informativa entre la unidad del dato y la del factor de
 * emisión. La conversión la hace el backend con el mismo servicio que usa el
 * motor de cálculo; aquí no hay matemática propia.
 */
export default function EquivalenciaUnidad({
  cantidad,
  unidadOrigen,
  unidadesFactor,
  parametros = {},
  convertir = equivalenciaUnidad,
}: Props) {
  // Resultados de la última solicitud; se ignoran si la solicitud ya cambió.
  const [resultados, setResultados] = useState<{ clave: string; porDestino: Record<string, Estado> }>({
    clave: '',
    porDestino: {},
  })
  const cantidadValida = RE_CANTIDAD.test(cantidad.trim()) && /[1-9]/.test(cantidad)
  const destinos = unidadesFactor.filter((unidad) => unidad.id !== unidadOrigen?.id)
  const clave =
    unidadOrigen && cantidadValida && destinos.length
      ? JSON.stringify({
          cantidad: cantidad.trim(),
          unidadOrigenId: unidadOrigen.id,
          destinos: destinos.map((destino) => destino.id),
          parametros,
        } satisfies Solicitud)
      : ''

  useEffect(() => {
    if (!clave) return
    const solicitud = JSON.parse(clave) as Solicitud
    let activo = true
    const temporizador = window.setTimeout(() => {
      for (const destino of solicitud.destinos) {
        void convertir({
          cantidad: solicitud.cantidad,
          unidadOrigenId: solicitud.unidadOrigenId,
          unidadDestinoId: destino,
          ...solicitud.parametros,
        })
          .then((equivalencia): Estado => ({ tipo: 'ok', equivalencia }))
          .catch(
            (error: unknown): Estado => ({
              tipo: 'error',
              mensaje:
                error instanceof ErrorApi ? error.message : 'No se pudo consultar la conversión con el backend.',
            }),
          )
          .then((estado) => {
            if (!activo) return
            setResultados((previo) => ({
              clave,
              porDestino: { ...(previo.clave === clave ? previo.porDestino : {}), [destino]: estado },
            }))
          })
      }
    }, 250)
    return () => {
      activo = false
      window.clearTimeout(temporizador)
    }
  }, [clave, convertir])

  if (!unidadesFactor.length) return null

  const simbolosFactor = [...new Set(unidadesFactor.map((unidad) => unidad.simbolo))].join(', ')
  const porDestino = resultados.clave === clave ? resultados.porDestino : {}

  return (
    <div className="cal-aviso-caja" role="status" aria-live="polite">
      <ArrowRightLeft size={17} aria-hidden="true" />
      <div>
        <span>
          Unidad requerida por el factor: <strong>{simbolosFactor}</strong>
        </span>
        {!unidadOrigen || !cantidadValida ? null : !destinos.length ? (
          <p className="cal-ayuda">
            La cantidad ya está en la unidad del factor ({unidadOrigen.simbolo}); no requiere conversión.
          </p>
        ) : (
          destinos.map((destino) => {
            const estado = porDestino[destino.id]
            if (!estado) {
              return (
                <p key={destino.id} className="cal-ayuda">
                  Calculando equivalencia a {destino.simbolo}…
                </p>
              )
            }
            if (estado.tipo === 'error') {
              return (
                <p key={destino.id} className="cal-ayuda">
                  <Info size={14} aria-hidden="true" /> Conversión a {destino.simbolo} no disponible: {estado.mensaje}
                </p>
              )
            }
            return (
              <p key={destino.id} className="cal-ayuda">
                Equivalencia para el cálculo:{' '}
                <strong>
                  {formatoDecimal(estado.equivalencia.cantidad)} {estado.equivalencia.unidadOrigen.simbolo} ={' '}
                  {formatoDecimal(estado.equivalencia.valor)} {estado.equivalencia.unidadDestino.simbolo}
                </strong>
              </p>
            )
          })
        )}
      </div>
    </div>
  )
}
