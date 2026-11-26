import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CalendarPlus, Lock, LockOpen, ShieldOff } from 'lucide-react'
import Button from '../../../components/common/Button'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { ErrorApi } from '../../../services/api'
import { actualizarPeriodo, crearPeriodo, listarPeriodos } from '../../../services/periodosService'
import type { EstadoPeriodo, Periodo } from '../../../services/periodosService'

interface Props {
  organizacionId: string
  organizacionNombre: string
  /** Permiso organizacion.editar: crear periodos y cambiar su estado. */
  puedeEditar: boolean
  /** Se llama después de cada cambio para recargar las opciones del cálculo. */
  onCambio: () => void
}

const VACIO = { nombre: '', fechaInicio: '', fechaFin: '' }

const ETIQUETA: Record<EstadoPeriodo, { texto: string; clase: string }> = {
  ABIERTO: { texto: 'Abierto', clase: 'ok' },
  CERRADO: { texto: 'Cerrado', clase: 'revision' },
  BLOQUEADO: { texto: 'Bloqueado', clase: 'revision' },
}

/**
 * Periodos de medición de la organización elegida. Solo un periodo ABIERTO
 * recibe datos de actividad; CERRADO se puede reabrir y BLOQUEADO es definitivo.
 */
export default function PeriodosOrganizacion({ organizacionId, organizacionNombre, puedeEditar, onCambio }: Props) {
  const avisar = useAviso()
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [formulario, setFormulario] = useState(VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setPeriodos(await listarPeriodos(organizacionId))
      setErrorCarga('')
    } catch (problema) {
      setErrorCarga(problema instanceof ErrorApi ? problema.message : 'No se pudieron cargar los periodos.')
    } finally {
      setCargando(false)
    }
  }, [organizacionId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  function validar(): string {
    if (formulario.nombre.trim().length < 2) return 'Escribe un nombre de al menos 2 caracteres.'
    if (!formulario.fechaInicio || !formulario.fechaFin) return 'Indica la fecha de inicio y la de finalización.'
    if (formulario.fechaFin < formulario.fechaInicio) {
      return 'La fecha de finalización no puede ser anterior a la de inicio.'
    }
    const nombre = formulario.nombre.trim().toLowerCase()
    if (periodos.some((periodo) => periodo.nombre.toLowerCase() === nombre)) {
      return 'Ya existe un periodo con ese nombre en esta organización.'
    }
    return ''
  }

  async function crear() {
    const mensaje = validar()
    if (mensaje) {
      setError(mensaje)
      return
    }
    setGuardando(true)
    try {
      const periodo = await crearPeriodo(organizacionId, formulario)
      setFormulario(VACIO)
      setError('')
      await cargar()
      onCambio()
      avisar(`Periodo «${periodo.nombre}» creado y abierto.`)
    } catch (problema) {
      setError(problema instanceof ErrorApi ? problema.message : 'No se pudo crear el periodo.')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiar(periodo: Periodo, estado: EstadoPeriodo) {
    if (
      estado === 'BLOQUEADO' &&
      !window.confirm(`¿Bloquear «${periodo.nombre}»? Un periodo bloqueado no se puede reabrir ni calcular.`)
    ) {
      return
    }
    try {
      await actualizarPeriodo(periodo.id, {
        nombre: periodo.nombre,
        fechaInicio: periodo.fechaInicio,
        fechaFin: periodo.fechaFin,
        estado,
      })
      await cargar()
      onCambio()
      avisar(`Periodo «${periodo.nombre}»: ${ETIQUETA[estado].texto.toLowerCase()}.`)
    } catch (problema) {
      avisar(problema instanceof ErrorApi ? problema.message : 'No se pudo cambiar el estado del periodo.')
    }
  }

  return (
    <div className="cal-periodos">
      <header className="cal-bloque-cabecera">
        <h3>Periodos de medición de {organizacionNombre}</h3>
        <p>
          Solo un periodo <strong>abierto</strong> recibe datos de actividad. Un periodo cerrado se puede reabrir; uno
          bloqueado es definitivo y no se puede calcular.
        </p>
      </header>

      {errorCarga ? (
        <div className="cal-aviso-caja cal-aviso-caja--alerta" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{errorCarga}</span>
        </div>
      ) : cargando ? (
        <p className="cal-ayuda">Cargando periodos…</p>
      ) : periodos.length ? (
        <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                {puedeEditar ? <th></th> : null}
              </tr>
            </thead>
            <tbody>
              {periodos.map((periodo) => (
                <tr key={periodo.id}>
                  <td>{periodo.nombre}</td>
                  <td className="cal-num">{periodo.fechaInicio}</td>
                  <td className="cal-num">{periodo.fechaFin}</td>
                  <td>
                    <span className={`cal-estado ${ETIQUETA[periodo.estado].clase}`}>{ETIQUETA[periodo.estado].texto}</span>
                  </td>
                  {puedeEditar ? (
                    <td className="cal-periodos-acciones">
                      {periodo.estado === 'ABIERTO' ? (
                        <Button variante="fantasma" className="cal-btn-compacto" onClick={() => void cambiar(periodo, 'CERRADO')}>
                          <Lock size={14} aria-hidden="true" />
                          Cerrar
                        </Button>
                      ) : null}
                      {periodo.estado === 'CERRADO' ? (
                        <Button variante="fantasma" className="cal-btn-compacto" onClick={() => void cambiar(periodo, 'ABIERTO')}>
                          <LockOpen size={14} aria-hidden="true" />
                          Reabrir
                        </Button>
                      ) : null}
                      {periodo.estado !== 'BLOQUEADO' ? (
                        <Button variante="fantasma" className="cal-btn-compacto" onClick={() => void cambiar(periodo, 'BLOQUEADO')}>
                          <ShieldOff size={14} aria-hidden="true" />
                          Bloquear
                        </Button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="cal-ayuda">Esta organización todavía no tiene periodos.</p>
      )}

      {puedeEditar ? (
        <div className="cal-periodos-form">
          <div className="cal-carbono-campos">
            <div className="vst-campo">
              <label htmlFor="per-nombre">Nombre del periodo *</label>
              <input
                id="per-nombre"
                className="vst-input"
                maxLength={100}
                value={formulario.nombre}
                onChange={(evento) => {
                  setError('')
                  setFormulario((actual) => ({ ...actual, nombre: evento.target.value }))
                }}
                placeholder="Ej. Inventario 2024"
              />
            </div>
            <div className="vst-campo">
              <label htmlFor="per-inicio">Fecha de inicio *</label>
              <input
                id="per-inicio"
                className="vst-input"
                type="date"
                value={formulario.fechaInicio}
                onChange={(evento) => {
                  setError('')
                  setFormulario((actual) => ({ ...actual, fechaInicio: evento.target.value }))
                }}
              />
            </div>
            <div className="vst-campo">
              <label htmlFor="per-fin">Fecha de finalización *</label>
              <input
                id="per-fin"
                className="vst-input"
                type="date"
                min={formulario.fechaInicio || undefined}
                value={formulario.fechaFin}
                onChange={(evento) => {
                  setError('')
                  setFormulario((actual) => ({ ...actual, fechaFin: evento.target.value }))
                }}
              />
            </div>
          </div>
          {error ? (
            <div className="cal-aviso-caja cal-aviso-caja--alerta" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}
          <div className="cal-papeles-acciones">
            <Button onClick={() => void crear()} disabled={guardando}>
              <CalendarPlus size={15} strokeWidth={2.3} aria-hidden="true" />
              {guardando ? 'Creando…' : 'Crear periodo abierto'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="cal-ayuda">Tu perfil puede consultar los periodos, pero no crearlos ni cambiarlos.</p>
      )}
    </div>
  )
}
