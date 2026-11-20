import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { tienePermiso } from '../services/acceso'
import { alCambiarSesion, leerToken, leerUsuario, sincronizarPermisos } from '../services/sesion'

export interface PerfilEditable {
  nombre: string
  apellidos: string
  correo: string
  cargo: string
  organizacion: string
}

interface PerfilContextValue {
  perfil: PerfilEditable
  rol: string
  ultimoAcceso: string
  permisos: string[]
  permisosListos: boolean
  puede: (codigo: string) => boolean
  guardarPerfil: (datos: PerfilEditable) => void
}

const VACIO: PerfilEditable = {
  nombre: '',
  apellidos: '',
  correo: '',
  cargo: '',
  organizacion: 'HuellaVerde',
}

function fechaLegible(iso: string): string {
  if (!iso) return 'Sin registros'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

function desdeSesion(): {
  perfil: PerfilEditable
  rol: string
  ultimoAcceso: string
  permisos: string[]
  permisosListos: boolean
  usuarioId: string
} {
  const usuario = leerUsuario()
  if (!usuario) {
    return {
      perfil: VACIO,
      rol: '',
      ultimoAcceso: 'Sin registros',
      permisos: [],
      permisosListos: false,
      usuarioId: '',
    }
  }
  return {
    perfil: {
      nombre: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      cargo: usuario.rol,
      organizacion: 'HuellaVerde',
    },
    rol: usuario.rol,
    ultimoAcceso: fechaLegible(usuario.ultimoAcceso),
    permisos: usuario.permisos ?? [],
    permisosListos: Array.isArray(usuario.permisos),
    usuarioId: usuario.id,
  }
}

const PerfilContext = createContext<PerfilContextValue | null>(null)

export function PerfilProvider({ children }: { children: ReactNode }) {
  const inicial = desdeSesion()
  const [perfil, setPerfil] = useState<PerfilEditable>(inicial.perfil)
  const [rol, setRol] = useState(inicial.rol)
  const [ultimoAcceso, setUltimoAcceso] = useState(inicial.ultimoAcceso)
  const [permisos, setPermisos] = useState<string[]>(inicial.permisos)
  const [permisosListos, setPermisosListos] = useState(inicial.permisosListos)
  const [usuarioId, setUsuarioId] = useState(inicial.usuarioId)

  const aplicar = useCallback(() => {
    const siguiente = desdeSesion()
    setPerfil(siguiente.perfil)
    setRol(siguiente.rol)
    setUltimoAcceso(siguiente.ultimoAcceso)
    setPermisos(siguiente.permisos)
    setUsuarioId(siguiente.usuarioId)
    if (siguiente.permisosListos) setPermisosListos(true)
    if (!leerToken()) setPermisosListos(false)
  }, [])

  useEffect(() => {
    return alCambiarSesion(aplicar)
  }, [aplicar])

  useEffect(() => {
    if (!usuarioId || !leerToken()) return
    let vivo = true
    void sincronizarPermisos()
      .catch(() => undefined)
      .finally(() => {
        if (vivo) setPermisosListos(true)
      })
    return () => {
      vivo = false
    }
  }, [usuarioId])

  const guardarPerfil = useCallback((datos: PerfilEditable) => setPerfil(datos), [])

  const puede = useCallback((codigo: string) => tienePermiso(permisos, codigo), [permisos])

  const value = useMemo<PerfilContextValue>(
    () => ({ perfil, rol, ultimoAcceso, permisos, permisosListos, puede, guardarPerfil }),
    [perfil, rol, ultimoAcceso, permisos, permisosListos, puede, guardarPerfil],
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
