import { useEffect, useState } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import Button from '../../../components/common/Button'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { ErrorApi } from '../../../services/api'
import {
  crearPapel,
  listarPapeles,
  opcionesPapel,
  rechazarPapel,
} from '../../../services/papelesService'
import type { OpcionPapel, PapelCarbono } from '../../../services/papelesService'

interface Props {
  organizacionId: string
  periodoId: string
  abierto: boolean
  onPapelesCambio?: (cantidadActivos: number) => void
}

const VACIO = {
  actividadId: '',
  fuenteId: '',
  unidadId: '',
  alcanceId: '',
  cantidad: '',
  documento: '',
}

function etiquetaEstado(estado: string): { texto: string; clase: string } {
  const normalizado = estado.toUpperCase()
  if (normalizado === 'RECHAZADO') return { texto: 'Quitado', clase: 'revision' }
  if (normalizado === 'VALIDADO' || normalizado === 'ACTIVO' || normalizado === 'APROBADO') {
    return { texto: 'Activo', clase: 'ok' }
  }
  return { texto: estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase(), clase: 'ok' }
}

export default function PapelesCarbono({
  organizacionId,
  periodoId,
  abierto,
  onPapelesCambio,
}: Props) {
  const avisar = useAviso()
  const [actividades, setActividades] = useState<OpcionPapel[]>([])
  const [fuentes, setFuentes] = useState<OpcionPapel[]>([])
  const [unidades, setUnidades] = useState<OpcionPapel[]>([])
  const [alcances, setAlcances] = useState<OpcionPapel[]>([])
  const [papeles, setPapeles] = useState<PapelCarbono[]>([])
  const [formulario, setFormulario] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [cargandoLista, setCargandoLista] = useState(true)

  useEffect(() => {
    let activo = true
    void opcionesPapel(organizacionId)
      .then((opciones) => {
        if (!activo) return
        setActividades(opciones.actividades)
        setFuentes(opciones.fuentes)
        setUnidades(opciones.unidades)
        setAlcances(opciones.alcances)
      })
      .catch((error: unknown) => {
        if (activo) {
          avisar(error instanceof ErrorApi ? error.message : 'No se pudieron cargar las listas del registro.')
        }
      })
    return () => {
      activo = false
    }
  }, [organizacionId, avisar])

  useEffect(() => {
    let activo = true
    void listarPapeles(organizacionId, periodoId)
      .then((lista) => {
        if (!activo) return
        setPapeles(lista)
        const activos = lista.filter((item) => item.estadoRegistro !== 'RECHAZADO').length
        onPapelesCambio?.(activos)
      })
      .catch((error: unknown) => {
        if (activo) {
          avisar(error instanceof ErrorApi ? error.message : 'No se pudieron cargar los registros del periodo.')
        }
      })
      .finally(() => {
        if (activo) setCargandoLista(false)
      })
    return () => {
      activo = false
    }
  }, [organizacionId, periodoId, avisar, onPapelesCambio])

  function cambiar(campo: keyof typeof VACIO, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  async function guardar() {
    setGuardando(true)
    try {
      await crearPapel({
        actividadId: formulario.actividadId,
        periodoId,
        fuenteEmisionId: formulario.fuenteId,
        alcanceId: formulario.alcanceId,
        unidadId: formulario.unidadId,
        cantidad: formulario.cantidad,
        fuenteDato: formulario.documento,
      })
      setFormulario(VACIO)
      const actualizados = await listarPapeles(organizacionId, periodoId)
      setPapeles(actualizados)
      onPapelesCambio?.(actualizados.filter((item) => item.estadoRegistro !== 'RECHAZADO').length)
      avisar('Registro agregado. Ya puedes incluirlo al calcular en el siguiente paso.')
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo guardar el registro.')
    } finally {
      setGuardando(false)
    }
  }

  async function rechazar(id: string) {
    try {
      await rechazarPapel(id)
      const actualizados = await listarPapeles(organizacionId, periodoId)
      setPapeles(actualizados)
      onPapelesCambio?.(actualizados.filter((item) => item.estadoRegistro !== 'RECHAZADO').length)
      avisar('Registro quitado del periodo.')
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo quitar el registro.')
    }
  }

  const activos = papeles.filter((item) => item.estadoRegistro !== 'RECHAZADO')
  const listo =
    abierto &&
    Boolean(formulario.actividadId) &&
    Boolean(formulario.fuenteId) &&
    Boolean(formulario.unidadId) &&
    Boolean(formulario.alcanceId) &&
    Number(formulario.cantidad) > 0

  return (
    <div className="cal-papeles">
      <header className="cal-bloque-cabecera cal-bloque-cabecera--fila">
        <div>
          <h2>Registros de consumo del periodo</h2>
          <p>
            Registra los datos de tus soportes o facturas (energía, combustible, residuos).
            El sistema aplicará automáticamente el factor de emisión en el paso 3.
          </p>
        </div>
        <span className="cal-historial-contador" aria-live="polite">
          {activos.length} {activos.length === 1 ? 'registro activo' : 'registros activos'}
        </span>
      </header>

      {abierto ? (
        <div className="cal-papeles-form">
          <div className="cal-carbono-campos">
            <div className="vst-campo">
              <label htmlFor="papel-actividad">Actividad *</label>
              <select
                id="papel-actividad"
                className="vst-select"
                value={formulario.actividadId}
                onChange={(evento) => cambiar('actividadId', evento.target.value)}
              >
                <option value="">Selecciona una actividad</option>
                {actividades.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}{item.detalle ? ` · ${item.detalle}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="papel-fuente">Fuente de emisión *</label>
              <select
                id="papel-fuente"
                className="vst-select"
                value={formulario.fuenteId}
                onChange={(evento) => cambiar('fuenteId', evento.target.value)}
              >
                <option value="">Selecciona una fuente</option>
                {fuentes.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="papel-alcance">Alcance *</label>
              <select
                id="papel-alcance"
                className="vst-select"
                value={formulario.alcanceId}
                onChange={(evento) => cambiar('alcanceId', evento.target.value)}
              >
                <option value="">Selecciona el alcance</option>
                {alcances.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.detalle ? `${item.detalle} · ` : ''}{item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="papel-cantidad">Cantidad consumida *</label>
              <input
                id="papel-cantidad"
                className="vst-input"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={formulario.cantidad}
                onChange={(evento) => cambiar('cantidad', evento.target.value)}
                placeholder="Ej. 2500"
              />
            </div>

            <div className="vst-campo">
              <label htmlFor="papel-unidad">Unidad *</label>
              <select
                id="papel-unidad"
                className="vst-select"
                value={formulario.unidadId}
                onChange={(evento) => cambiar('unidadId', evento.target.value)}
              >
                <option value="">Selecciona la unidad</option>
                {unidades.map((item) => (
                  <option key={item.id} value={item.id}>{item.nombre}</option>
                ))}
              </select>
            </div>

            <div className="vst-campo">
              <label htmlFor="papel-documento">Soporte / documento (opcional)</label>
              <input
                id="papel-documento"
                className="vst-input"
                value={formulario.documento}
                onChange={(evento) => cambiar('documento', evento.target.value)}
                placeholder="Ej. Factura energía ene 2026"
              />
            </div>
          </div>

          <div className="cal-papeles-acciones">
            <Button onClick={() => void guardar()} disabled={guardando || !listo}>
              <Plus size={15} strokeWidth={2.4} aria-hidden="true" />
              {guardando ? 'Guardando…' : 'Agregar registro'}
            </Button>
            {!listo ? (
              <span className="cal-ayuda-inline">
                Completa los 5 campos marcados con * para guardar el registro.
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="cal-aviso-caja">
          Este periodo está cerrado y ya no recibe nuevos registros, pero puedes continuar al paso 3 para calcular con los ya cargados.
        </div>
      )}

      {cargandoLista ? (
        <p className="cal-ayuda">Cargando registros del periodo…</p>
      ) : papeles.length ? (
        <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla">
            <thead>
              <tr>
                <th>Actividad</th>
                <th>Cantidad</th>
                <th>Fuente</th>
                <th>Alcance</th>
                <th>Documento</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {papeles.map((papel) => {
                const badge = etiquetaEstado(papel.estadoRegistro)
                return (
                  <tr key={papel.id} className={papel.estadoRegistro === 'RECHAZADO' ? 'cal-fila-inactiva' : undefined}>
                    <td>{papel.actividadNombre}</td>
                    <td className="cal-num">{papel.cantidad} {papel.unidadSimbolo}</td>
                    <td>{papel.fuenteNombre}</td>
                    <td>{papel.alcanceNombre || papel.alcanceCodigo}</td>
                    <td>{papel.fuenteDato || '—'}</td>
                    <td>
                      <span className={`cal-estado ${badge.clase}`}>{badge.texto}</span>
                    </td>
                    <td>
                      {abierto && papel.estadoRegistro !== 'RECHAZADO' ? (
                        <Button
                          variante="fantasma"
                          className="cal-btn-compacto"
                          onClick={() => void rechazar(papel.id)}
                          aria-label={`Quitar ${papel.actividadNombre}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Quitar
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="cal-vacio-caja">
          <FileText size={20} strokeWidth={1.9} aria-hidden="true" />
          <div>
            <strong>Aún no hay registros en este periodo</strong>
            <p>
              Agrega al menos un consumo arriba (por ejemplo, electricidad en kWh o combustible en L) para poder calcular la huella de carbono.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
