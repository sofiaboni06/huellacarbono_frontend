import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorApi } from '../services/apiCliente'
import { listarProyectos } from '../services/datosActividadService'
import { haySesion } from '../services/sesionService'
import type { Proyecto } from '../services/tipos'

/**
 * Proyecto seleccionado en la aplicación («proyecto» = `organizacion` en el
 * esquema del backend: no existe una tabla `proyecto`).
 *
 * Vive en la raíz de la aplicación para que cualquier vista lea y escriba la
 * misma selección. El identificador elegido se recuerda en `localStorage`
 * (mismo patrón que `sesionService`); si el proyecto guardado ya no está
 * disponible se vuelve al primer proyecto activo.
 */
const CLAVE = 'huellaverde.proyecto'

interface ProyectoContextValue {
  /** Todos los proyectos activos devueltos por el backend. */
  proyectos: Proyecto[]
  /** Proyecto elegido, o `null` mientras carga o si no hay proyectos. */
  proyecto: Proyecto | null
  cargando: boolean
  /** Mensaje de la última carga fallida (`null` si no hubo error). */
  error: string | null
  /** Selecciona un proyecto por identificador y lo recuerda. */
  seleccionar: (id: number) => void
  /** Recarga el catálogo de proyectos (también sirve de reintento). */
  recargar: () => Promise<void>
}

const ProyectoContext = createContext<ProyectoContextValue | null>(null)

/** Guardia de almacenamiento: en modo privado degrada a memoria. */
function leerIdGuardado(): number | null {
  try {
    const bruto = window.localStorage.getItem(CLAVE)
    if (!bruto) return null
    const valor = Number(bruto)
    return Number.isInteger(valor) && valor > 0 ? valor : null
  } catch {
    return null
  }
}

function guardarId(id: number | null): void {
  try {
    if (id === null) window.localStorage.removeItem(CLAVE)
    else window.localStorage.setItem(CLAVE, String(id))
  } catch {
    /* almacenamiento no disponible: la selección solo viviría en memoria */
  }
}

/** Texto legible de cualquier error de la capa de servicios. */
function mensajeDe(error: unknown): string {
  if (error instanceof ErrorApi) return error.message
  if (error instanceof Error) return error.message
  return 'No se pudo cargar el catálogo de proyectos.'
}

export function ProyectoProvider({ children }: { children: ReactNode }) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [seleccionId, setSeleccionId] = useState<number | null>(() => leerIdGuardado())
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Evita repetir la carga automática en cada cambio de ruta. */
  const [intentado, setIntentado] = useState(false)
  const { pathname } = useLocation()

  const recargar = useCallback(async () => {
    if (!haySesion()) return
    setCargando(true)
    setError(null)
    try {
      const lista = await listarProyectos()
      setProyectos(lista)
      // Normaliza la selección: la guardada si sigue activa, si no la primera.
      setSeleccionId((actual) =>
        actual !== null && lista.some((p) => p.id === actual) ? actual : (lista[0]?.id ?? null),
      )
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setCargando(false)
    }
  }, [])

  // El login sucede en /login, fuera de este contexto: el cambio de ruta es
  // la señal de que ya hay sesión para pedir el catálogo de proyectos. Sin
  // sesión solo se limpia la lista; la selección guardada se conserva.
  useEffect(() => {
    if (!haySesion()) {
      setProyectos([])
      setIntentado(false)
      return
    }
    if (intentado || cargando) return
    setIntentado(true)
    void recargar()
  }, [pathname, intentado, cargando, recargar])

  const seleccionar = useCallback((id: number) => {
    setSeleccionId(id)
    guardarId(id)
  }, [])

  const proyecto = useMemo(
    () => proyectos.find((p) => p.id === seleccionId) ?? null,
    [proyectos, seleccionId],
  )

  const value = useMemo<ProyectoContextValue>(
    () => ({ proyectos, proyecto, cargando, error, seleccionar, recargar }),
    [proyectos, proyecto, cargando, error, seleccionar, recargar],
  )

  return <ProyectoContext.Provider value={value}>{children}</ProyectoContext.Provider>
}

export function useProyecto(): ProyectoContextValue {
  const ctx = useContext(ProyectoContext)
  if (!ctx) {
    throw new Error('useProyecto debe usarse dentro de <ProyectoProvider>')
  }
  return ctx
}
