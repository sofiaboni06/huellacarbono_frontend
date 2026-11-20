import { api } from './api'

export interface UsuarioSesion {
  id: string
  nombres: string
  apellidos: string
  correo: string
  rol: string
  ultimoAcceso: string
  /** Códigos que el rol tiene asignados, por ejemplo `usuario.ver`. */
  permisos?: string[]
}

const CLAVE_TOKEN = 'hv:token'
const CLAVE_USUARIO = 'hv:usuario'
const oyentes = new Set<() => void>()

function avisar() {
  for (const oyente of oyentes) oyente()
}

export function leerToken(): string {
  return sessionStorage.getItem(CLAVE_TOKEN) ?? ''
}

export function leerUsuario(): UsuarioSesion | null {
  const crudo = sessionStorage.getItem(CLAVE_USUARIO)
  if (!crudo) return null
  try {
    return JSON.parse(crudo) as UsuarioSesion
  } catch {
    return null
  }
}

export function guardarSesion(token: string, usuario: UsuarioSesion) {
  sessionStorage.setItem(CLAVE_TOKEN, token)
  sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
  avisar()
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_TOKEN)
  sessionStorage.removeItem(CLAVE_USUARIO)
  avisar()
}

export function alCambiarSesion(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

/** Trae los permisos vigentes del rol, por si cambiaron después de iniciar sesión. */
export async function sincronizarPermisos(): Promise<void> {
  const token = leerToken()
  const actual = leerUsuario()
  if (!token || !actual) return

  const respuesta = await api<{
    data: {
      permissions?: string[]
      roles?: { name: string }[]
    }
  }>('/account/profile')

  if (leerToken() !== token || leerUsuario()?.id !== actual.id) return

  guardarSesion(token, {
    ...actual,
    rol: respuesta.data.roles?.[0]?.name ?? actual.rol,
    permisos: respuesta.data.permissions ?? [],
  })
}
