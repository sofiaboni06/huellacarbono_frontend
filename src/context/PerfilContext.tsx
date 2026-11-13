import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PERFIL_USUARIO } from '../data/demo'

/**
 * Estado compartido del perfil del usuario.
 * Vive en la raíz de la aplicación para que el navbar, la vista de perfil y
 * cualquier otra sección lean y escriban los mismos datos (sin backend).
 */
export interface PerfilEditable {
  nombre: string
  apellidos: string
  correo: string
  cargo: string
  organizacion: string
}

interface PerfilContextValue {
  perfil: PerfilEditable
  /** Rol y último acceso son de solo lectura (los administra la organización). */
  rol: string
  ultimoAcceso: string
  guardarPerfil: (datos: PerfilEditable) => void
}

const PerfilContext = createContext<PerfilContextValue | null>(null)

const PERFIL_INICIAL: PerfilEditable = {
  nombre: 'Sofía',
  apellidos: 'Gallego',
  correo: PERFIL_USUARIO.correo,
  cargo: PERFIL_USUARIO.cargo,
  organizacion: PERFIL_USUARIO.organizacion,
}

export function PerfilProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilEditable>(PERFIL_INICIAL)

  const guardarPerfil = useCallback((datos: PerfilEditable) => setPerfil(datos), [])

  const value = useMemo<PerfilContextValue>(
    () => ({
      perfil,
      rol: PERFIL_USUARIO.rol,
      ultimoAcceso: PERFIL_USUARIO.ultimoAcceso,
      guardarPerfil,
    }),
    [perfil, guardarPerfil],
  )

  return <PerfilContext.Provider value={value}>{children}</PerfilContext.Provider>
}

export function usePerfil(): PerfilContextValue {
  const ctx = useContext(PerfilContext)
  if (!ctx) {
    throw new Error('usePerfil debe usarse dentro de PerfilProvider')
  }
  return ctx
}
