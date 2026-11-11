import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { NOTIFICACIONES_INICIALES } from '../data/demo'
import type { NotificacionDemo } from '../data/demo'

interface NotificacionesContextValue {
  notificaciones: NotificacionDemo[]
  noLeidas: number
  marcarComoLeida: (id: string) => void
  marcarTodasComoLeidas: () => void
}

const NotificacionesContext = createContext<NotificacionesContextValue | null>(null)

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<NotificacionDemo[]>(NOTIFICACIONES_INICIALES)

  const marcarComoLeida = useCallback((id: string) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
  }, [])

  const marcarTodasComoLeidas = useCallback(() => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
  }, [])

  const noLeidas = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones],
  )

  const value = useMemo(
    () => ({ notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas }),
    [notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas],
  )

  return <NotificacionesContext.Provider value={value}>{children}</NotificacionesContext.Provider>
}

export function useNotificaciones(): NotificacionesContextValue {
  const ctx = useContext(NotificacionesContext)
  if (!ctx) {
    throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider')
  }
  return ctx
}
