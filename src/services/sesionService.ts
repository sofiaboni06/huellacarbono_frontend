/**
 * Sesión de la plataforma: almacén del token de acceso y de los permisos
 * que el backend devuelve al iniciar sesión.
 *
 * El token vive en `localStorage` bajo la clave `huellaverde.sesion` y lo
 * lee automáticamente `apiCliente.ts` para encabezar cada petición con
 * `Authorization: Bearer …`. Ninguna vista toca el token directamente.
 */
import type { UsuarioSesion } from './tipos'

const CLAVE = 'huellaverde.sesion'

/** Guardia de almacenamiento: en modo privado degrada a memoria. */
function leer(): string | null {
  try {
    return window.localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

/** Devuelve la sesión guardada o `null` si no hay (o está corrupta). */
export function leerSesion(): UsuarioSesion | null {
  const bruto = leer()
  if (!bruto) return null
  try {
    const datos = JSON.parse(bruto) as UsuarioSesion
    if (typeof datos?.token !== 'string' || datos.token === '') return null
    return datos
  } catch {
    return null
  }
}

/** Token Bearer actual, o `null` si no hay sesión. */
export function leerToken(): string | null {
  return leerSesion()?.token ?? null
}

/** Guarda la sesión devuelta por `POST /api/v1/auth/login`. */
export function guardarSesion(sesion: UsuarioSesion): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(sesion))
  } catch {
    /* almacenamiento no disponible: la sesión solo viviría en memoria */
  }
}

/** Elimina la sesión (logout o token caducado). */
export function cerrarSesion(): void {
  try {
    window.localStorage.removeItem(CLAVE)
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Indica si hay una sesión activa guardada. */
export function haySesion(): boolean {
  return leerSesion() !== null
}

/**
 * Comprueba un permiso concreto contra los códigos que devuelve el backend
 * (p. ej. `unidad_medida.crear`).
 *
 * Sin sesión no hay permisos: se devuelve `false`.
 */
export function tienePermiso(codigo: string): boolean {
  const sesion = leerSesion()
  if (!sesion) return false
  return (sesion.permisos ?? []).includes(codigo)
}
