import { useCallback, useEffect, useRef, useState } from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import { useProyecto } from '../../../context/ProyectoContext'
import { etiquetaProyecto, listarPeriodos } from '../../../services/datosActividadService'
import { useClickOutside } from '../../../hooks/useClickOutside'
import type { PeriodoCatalogo } from '../../../services/tipos'
import './SelectorOrganizacion.css'

/** Periodos cargados, asociados al proyecto al que pertenecen. */
interface PeriodosProyecto {
  proyectoId: number
  lista: PeriodoCatalogo[]
}

/**
 * Selector global de proyecto del panel de inicio.
 *
 * La organización se lee y escribe en `ProyectoContext`: es la misma
 * selección que consume el resto de la plataforma (p. ej. Datos de
 * Actividad), de modo que nunca conviven dos selectores independientes. Los
 * periodos son locales a este menú, se cargan del proyecto elegido y no
 * guardan datos de demostración.
 */
export default function SelectorOrganizacion() {
  const { proyectos, proyecto, cargando, error, seleccionar, recargar } = useProyecto()
  const [abierto, setAbierto] = useState(false)
  const [periodos, setPeriodos] = useState<PeriodosProyecto | null>(null)
  const [periodo, setPeriodo] = useState<number | null>(null)
  const peticionPeriodosRef = useRef(0)
  const ref = useClickOutside<HTMLDivElement>(() => setAbierto(false), abierto)

  /** Carga los periodos del proyecto actual; una respuesta vieja se descarta. */
  const cargarPeriodos = useCallback(async () => {
    if (!proyecto) return
    const numero = ++peticionPeriodosRef.current
    try {
      const lista = await listarPeriodos(proyecto.id)
      if (numero !== peticionPeriodosRef.current) return
      setPeriodos({ proyectoId: proyecto.id, lista })
    } catch {
      // Sin periodo disponible: el menú muestra su estado vacío.
      if (numero !== peticionPeriodosRef.current) return
      setPeriodos({ proyectoId: proyecto.id, lista: [] })
    }
  }, [proyecto])

  // Los periodos pertenecen al proyecto: se piden al abrir el menú y al
  // cambiar de proyecto; los del anterior se ignoran al derivar abajo.
  useEffect(() => {
    if (abierto) void cargarPeriodos()
  }, [abierto, cargarPeriodos])

  // Derivados: solo aplican si son del proyecto vigente (`null` = sin cargar).
  const listaPeriodos =
    periodos && proyecto && periodos.proyectoId === proyecto.id ? periodos.lista : null
  const periodoActivo = listaPeriodos?.some((opcion) => opcion.id === periodo) ? periodo : null
  const etiqueta = proyecto ? etiquetaProyecto(proyecto) : null

  const elegirOrganizacion = (id: number) => {
    seleccionar(id)
    setAbierto(false)
  }

  const elegirPeriodo = (id: number) => {
    setPeriodo(id)
    setAbierto(false)
  }

  return (
    <div className="ini-selector" ref={ref}>
      <button
        type="button"
        className="ini-selector-pastilla"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <Building2 size={17} strokeWidth={2.2} aria-hidden="true" />
        <span className="ini-selector-dato">
          <span className="ini-selector-etiqueta">Proyecto:</span>
          <b>{cargando && !proyecto ? 'Cargando…' : (etiqueta ?? 'Sin proyecto')}</b>
        </span>
        <ChevronDown
          size={17}
          strokeWidth={2.4}
          aria-hidden="true"
          className={`ini-selector-flecha ${abierto ? 'girada' : ''}`}
        />
      </button>

      {abierto ? (
        <div
          className="ini-selector-menu"
          role="listbox"
          aria-label="Seleccionar proyecto y periodo"
        >
          <p className="ini-selector-grupo">Proyecto</p>
          {cargando && proyectos.length === 0 ? (
            <p className="ini-selector-vacio" role="status">
              Cargando proyectos…
            </p>
          ) : error && proyectos.length === 0 ? (
            <>
              <p className="ini-selector-vacio" role="alert">
                {error}
              </p>
              <button
                type="button"
                className="ini-selector-reintentar"
                onClick={() => void recargar()}
              >
                Reintentar
              </button>
            </>
          ) : proyectos.length === 0 ? (
            <p className="ini-selector-vacio">Sin proyectos disponibles</p>
          ) : (
            proyectos.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                role="option"
                aria-selected={opcion.id === proyecto?.id}
                className={`ini-selector-opcion ${opcion.id === proyecto?.id ? 'activa' : ''}`}
                onClick={() => elegirOrganizacion(opcion.id)}
              >
                {etiquetaProyecto(opcion)}
              </button>
            ))
          )}

          {proyecto ? (
            <>
              <p className="ini-selector-grupo">Periodo</p>
              {listaPeriodos === null ? (
                <p className="ini-selector-vacio" role="status">
                  Cargando periodos…
                </p>
              ) : listaPeriodos.length === 0 ? (
                <p className="ini-selector-vacio">No hay periodos para este proyecto</p>
              ) : (
                listaPeriodos.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    role="option"
                    aria-selected={opcion.id === periodoActivo}
                    className={`ini-selector-opcion ${opcion.id === periodoActivo ? 'activa' : ''}`}
                    onClick={() => elegirPeriodo(opcion.id)}
                  >
                    {opcion.name}
                  </button>
                ))
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
