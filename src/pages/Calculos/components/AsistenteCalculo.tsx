import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, Save } from 'lucide-react'
import Button from '../../../components/common/Button'
import waterdrop from '../../../assets/images/waterdrop.png'
import { PERIODOS, SEDES } from '../../../data/demo'
import { calcularHuella } from '../../../utils/calculationEngine'
import type { TipoHuella } from '../../../utils/calculationEngine'
import './AsistenteCalculo.css'

type Paso = 1 | 2 | 3

interface CampoConsumo {
  id: string
  etiqueta: string
  unidad: string
}

interface GrupoConsumo {
  titulo: string
  campos: CampoConsumo[]
}

/** Campos de consumo reales y distintos para cada tipo de huella. */
const GRUPOS: Record<TipoHuella, GrupoConsumo[]> = {
  hidrica: [
    {
      titulo: 'Abastecimiento',
      campos: [
        { id: 'potable', etiqueta: 'Agua potable', unidad: 'm³' },
        { id: 'riego', etiqueta: 'Agua para riego', unidad: 'm³' },
      ],
    },
    {
      titulo: 'Procesos productivos',
      campos: [
        { id: 'industrial', etiqueta: 'Agua industrial', unidad: 'm³' },
        { id: 'refrigeracion', etiqueta: 'Agua de refrigeración', unidad: 'm³' },
      ],
    },
    {
      titulo: 'Saneamiento y limpieza',
      campos: [
        { id: 'saneamiento', etiqueta: 'Agua para saneamiento', unidad: 'm³' },
        { id: 'lavado', etiqueta: 'Agua de lavado', unidad: 'm³' },
      ],
    },
  ],
  carbono: [
    {
      titulo: 'Energía',
      campos: [
        { id: 'electricidad', etiqueta: 'Electricidad', unidad: 'kWh' },
        { id: 'gas', etiqueta: 'Gas natural', unidad: 'm³' },
      ],
    },
    {
      titulo: 'Movilidad y transporte',
      campos: [
        { id: 'diesel', etiqueta: 'Combustible diésel', unidad: 'L' },
        { id: 'gasolina', etiqueta: 'Combustible gasolina', unidad: 'L' },
        { id: 'transporte', etiqueta: 'Transporte terrestre', unidad: 'km' },
      ],
    },
    {
      titulo: 'Residuos',
      campos: [
        { id: 'solidos', etiqueta: 'Residuos sólidos', unidad: 'kg' },
        { id: 'organicos', etiqueta: 'Residuos orgánicos', unidad: 'kg' },
      ],
    },
  ],
}

const ORGANIZACIONES = [
  'SENA',
  'SENA Regional Antioquia',
  'SENA Regional Bogotá',
  'SENA Regional Costa',
]

const PASOS: { n: Paso; titulo: string }[] = [
  { n: 1, titulo: 'Datos básicos' },
  { n: 2, titulo: 'Consumo' },
  { n: 3, titulo: 'Resultados' },
]

interface AsistenteCalculoProps {
  tipo: TipoHuella
}

/** Asistente de tres pasos para registrar y calcular una huella. */
export default function AsistenteCalculo({ tipo }: AsistenteCalculoProps) {
  const [paso, setPaso] = useState<Paso>(1)
  const [organizacion, setOrganizacion] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [sede, setSede] = useState('')
  const [consumo, setConsumo] = useState<Record<string, string>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})

  const grupos = GRUPOS[tipo]
  const titulo = tipo === 'hidrica' ? 'Huella Hídrica' : 'Huella de Carbono'

  // Al cambiar de tipo de huella se reinicia por completo el asistente.
  useEffect(() => {
    setPaso(1)
    setOrganizacion('')
    setPeriodo('')
    setSede('')
    setConsumo({})
    setErrores({})
  }, [tipo])

  const limpiarError = (clave: string) => {
    setErrores((prev) => {
      if (!prev[clave]) return prev
      const copia = { ...prev }
      delete copia[clave]
      return copia
    })
  }

  const validarPaso1 = () => {
    const fallos: Record<string, string> = {}
    if (!organizacion) fallos.organizacion = 'Selecciona una organización.'
    if (!periodo) fallos.periodo = 'Selecciona un periodo de medición.'
    if (!sede) fallos.sede = 'Selecciona una sede.'
    setErrores(fallos)
    return Object.keys(fallos).length === 0
  }

  const validarPaso2 = () => {
    const fallos: Record<string, string> = {}
    let positivos = 0

    for (const grupo of grupos) {
      for (const campo of grupo.campos) {
        const crudo = (consumo[campo.id] ?? '').trim()
        if (crudo === '') {
          fallos[campo.id] = 'Campo obligatorio.'
          continue
        }
        const valor = Number(crudo)
        if (!Number.isFinite(valor)) {
          fallos[campo.id] = 'Ingresa un valor numérico.'
          continue
        }
        if (valor < 0) {
          fallos[campo.id] = 'El valor no puede ser negativo.'
          continue
        }
        if (valor > 0) positivos += 1
      }
    }

    if (Object.keys(fallos).length === 0 && positivos === 0) {
      fallos[grupos[0].campos[0].id] = 'Registra al menos un consumo mayor que cero.'
    }

    setErrores(fallos)
    return Object.keys(fallos).length === 0
  }

  const consumoNumerico = useMemo(() => {
    const salida: Record<string, number> = {}
    for (const grupo of grupos) {
      for (const campo of grupo.campos) {
        const valor = Number(consumo[campo.id] ?? 0)
        salida[campo.id] = Number.isFinite(valor) && valor > 0 ? valor : 0
      }
    }
    return salida
  }, [grupos, consumo])

  const resultado = paso === 3
    ? calcularHuella({ tipo, organizacion, periodo, sede, consumo: consumoNumerico })
    : null

  const reiniciar = () => {
    setPaso(1)
    setOrganizacion('')
    setPeriodo('')
    setSede('')
    setConsumo({})
    setErrores({})
  }

  const avanzar = () => {
    if (paso === 1 && !validarPaso1()) return
    if (paso === 2 && !validarPaso2()) return
    setErrores({})
    setPaso((p) => (p === 1 ? 2 : 3) as Paso)
  }

  const retroceder = () => {
    setErrores({})
    setPaso((p) => (p === 3 ? 2 : 1) as Paso)
  }

  return (
    <div className="cal-formulario">
      <div className="cal-form-principal vst-tarjeta">
        {/* ---------------------------- Asistente ---------------------------- */}
        <ol className="cal-pasos" aria-label="Progreso del cálculo">
          {PASOS.map((item, indice) => {
            const estado = item.n < paso ? 'hecho' : item.n === paso ? 'activo' : 'pendiente'
            return (
              <li key={item.n} className={`cal-paso ${estado}`}>
                <span className="cal-paso-numero">
                  {item.n < paso ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : item.n}
                </span>
                <span className="cal-paso-etiqueta">{item.titulo}</span>
                {indice < PASOS.length - 1 ? (
                  <span
                    className={`cal-conector ${item.n < paso ? 'hecho' : ''}`}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            )
          })}
        </ol>

        {paso === 1 ? (
          <section className="cal-seccion" aria-label="Paso 1: datos básicos">
            <h2 className="cal-seccion-titulo">Información general</h2>
            <p className="cal-seccion-texto">
              Define el alcance del cálculo antes de registrar el consumo.
            </p>

            <div className="cal-rejilla-campos">
              <div className="vst-campo">
                <label htmlFor="cal-organizacion">Organización</label>
                <select
                  id="cal-organizacion"
                  className="vst-select"
                  value={organizacion}
                  aria-invalid={errores.organizacion ? true : undefined}
                  onChange={(e) => {
                    setOrganizacion(e.target.value)
                    limpiarError('organizacion')
                  }}
                >
                  <option value="">Seleccione una organización</option>
                  {ORGANIZACIONES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errores.organizacion ? (
                  <p className="vst-error">{errores.organizacion}</p>
                ) : null}
              </div>

              <div className="vst-campo">
                <label htmlFor="cal-periodo">Periodo de medición</label>
                <select
                  id="cal-periodo"
                  className="vst-select"
                  value={periodo}
                  aria-invalid={errores.periodo ? true : undefined}
                  onChange={(e) => {
                    setPeriodo(e.target.value)
                    limpiarError('periodo')
                  }}
                >
                  <option value="">Seleccione un periodo</option>
                  {PERIODOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errores.periodo ? <p className="vst-error">{errores.periodo}</p> : null}
              </div>

              <div className="vst-campo">
                <label htmlFor="cal-sede">Sede</label>
                <select
                  id="cal-sede"
                  className="vst-select"
                  value={sede}
                  aria-invalid={errores.sede ? true : undefined}
                  onChange={(e) => {
                    setSede(e.target.value)
                    limpiarError('sede')
                  }}
                >
                  <option value="">Seleccione una sede</option>
                  {SEDES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errores.sede ? <p className="vst-error">{errores.sede}</p> : null}
              </div>
            </div>
          </section>
        ) : null}

        {paso === 2 ? (
          <section className="cal-seccion" aria-label="Paso 2: consumo">
            <h2 className="cal-seccion-titulo">Registro de consumo</h2>
            <p className="cal-seccion-texto">
              Ingresa los valores del periodo. Todos los campos son obligatorios.
            </p>

            <div className="cal-grupos">
              {grupos.map((grupo) => (
                <fieldset key={grupo.titulo} className="cal-grupo">
                  <legend className="cal-grupo-titulo">{grupo.titulo}</legend>
                  <div className="cal-grupo-rejilla">
                    {grupo.campos.map((campo) => (
                      <div className="vst-campo" key={campo.id}>
                        <label htmlFor={`cal-campo-${campo.id}`}>{campo.etiqueta}</label>
                        <span className="cal-unidad-envoltura">
                          <input
                            id={`cal-campo-${campo.id}`}
                            className="vst-input"
                            type="number"
                            min={0}
                            step="any"
                            inputMode="decimal"
                            placeholder="0"
                            value={consumo[campo.id] ?? ''}
                            aria-invalid={errores[campo.id] ? true : undefined}
                            onChange={(e) => {
                              const valor = e.target.value
                              setConsumo((prev) => ({ ...prev, [campo.id]: valor }))
                              limpiarError(campo.id)
                            }}
                          />
                          <span className="cal-unidad">{campo.unidad}</span>
                        </span>
                        {errores[campo.id] ? (
                          <p className="vst-error">{errores[campo.id]}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        ) : null}

        {paso === 3 && resultado ? (
          <section className="cal-seccion" aria-label="Paso 3: resultados">
            <div className="cal-resultado">
              <span className="cal-resultado-icono" aria-hidden="true">
                <Check size={22} strokeWidth={3} />
              </span>
              <div>
                <p className="cal-resultado-etiqueta">Cálculo completado</p>
                <h2 className="cal-resultado-titulo">{resultado.titulo}</h2>
              </div>
              <p className="cal-resultado-valor">{resultado.valorPrincipal}</p>
            </div>

            <dl className="cal-indicadores">
              {resultado.desglose.map((item) => (
                <div key={item.etiqueta} className="cal-indicador">
                  <dt>{item.etiqueta}</dt>
                  <dd>{item.valor}</dd>
                </div>
              ))}
            </dl>

            <h3 className="cal-subtitulo">Consumo registrado</h3>
            <div className="cal-detalle">
              {grupos.map((grupo) => (
                <div key={grupo.titulo} className="cal-detalle-grupo">
                  <p className="cal-detalle-grupo-titulo">{grupo.titulo}</p>
                  <ul>
                    {grupo.campos.map((campo) => (
                      <li key={campo.id}>
                        <span>{campo.etiqueta}</span>
                        <strong>
                          {(consumoNumerico[campo.id] ?? 0).toLocaleString('es-CO')}{' '}
                          {campo.unidad}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="cal-nota">{resultado.nota}</p>
          </section>
        ) : null}

        {/* ----------------------------- Acciones ---------------------------- */}
        <div className="cal-acciones">
          {paso === 1 ? (
            <Button variante="contorno" onClick={reiniciar}>
              Cancelar
            </Button>
          ) : (
            <Button variante="contorno" onClick={retroceder}>
              <ArrowLeft size={15} strokeWidth={2.3} aria-hidden="true" />
              Anterior
            </Button>
          )}

          {paso === 3 ? (
            <Button variante="primario" onClick={reiniciar}>
              <RotateCcw size={15} strokeWidth={2.3} aria-hidden="true" />
              Reiniciar formulario
            </Button>
          ) : paso === 2 ? (
            <Button variante="primario" onClick={avanzar}>
              <Save size={15} strokeWidth={2.3} aria-hidden="true" />
              Calcular huella {titulo}
            </Button>
          ) : (
            <Button variante="primario" onClick={avanzar}>
              Siguiente
              <ArrowRight size={15} strokeWidth={2.3} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* ------------------------- Imagen decorativa ------------------------- */}
      <aside className="cal-lamina" aria-hidden="true">
        <img className="cal-lamina-img" src={waterdrop} alt="" />
        <p className="cal-lamina-texto">
          Pequeñas acciones,
          <br />
          grandes cambios.
        </p>
      </aside>
    </div>
  )
}
