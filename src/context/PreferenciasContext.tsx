import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Preferencias visuales compartidas por todas las vistas.
 * Se guardan aquí (y no en cada pantalla) para que el cambio hecho en
 * Configuración se refleje en todo el resto de la aplicación.
 */
export type TemaVisual = 'claro' | 'naturaleza' | 'profundo'

export interface PreferenciasVisuales {
  tema: TemaVisual
  hojasVisibles: boolean
  animacionesActivas: boolean
}

interface PreferenciasContextValue extends PreferenciasVisuales {
  aplicar: (cambios: Partial<PreferenciasVisuales>) => void
}

const PREFERENCIAS_INICIALES: PreferenciasVisuales = {
  tema: 'naturaleza',
  hojasVisibles: true,
  animacionesActivas: true,
}

const PreferenciasContext = createContext<PreferenciasContextValue | null>(null)

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<PreferenciasVisuales>(PREFERENCIAS_INICIALES)

  const aplicar = useCallback((cambios: Partial<PreferenciasVisuales>) => {
    setPreferencias((prev) => ({ ...prev, ...cambios }))
  }, [])

  const value = useMemo<PreferenciasContextValue>(
    () => ({ ...preferencias, aplicar }),
    [preferencias, aplicar],
  )

  return <PreferenciasContext.Provider value={value}>{children}</PreferenciasContext.Provider>
}

export function usePreferencias(): PreferenciasContextValue {
  const ctx = useContext(PreferenciasContext)
  if (!ctx) {
    throw new Error('usePreferencias debe usarse dentro de PreferenciasProvider')
  }
  return ctx
}
