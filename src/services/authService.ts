/**
 * Autenticación real contra el backend (`POST /api/v1/auth/login`).
 *
 * Devuelve la sesión ya guardada en `sesionService.ts`, con el token que
 * `apiCliente.ts` adjunta automáticamente a cada petición y los permisos
 * que usan las vistas para mostrar u ocultar acciones.
 */
import { pedir } from './apiCliente'
import { cerrarSesion, guardarSesion } from './sesionService'
import type { UsuarioSesion } from './tipos'

interface RespuestaLogin {
  token: string
  user: {
    id: number
    fullName: string
    email: string
    permissions?: string[]
  }
}

/** Inicia sesión. Lanza `ErrorApi` con el motivo (401, 403, red…). */
export async function iniciarSesion(correo: string, clave: string): Promise<UsuarioSesion> {
  const datos = await pedir<RespuestaLogin>('auth/login', {
    metodo: 'POST',
    cuerpo: { email: correo.trim().toLowerCase(), password: clave },
  })

  const sesion: UsuarioSesion = {
    token: datos.token,
    permisos: datos.user?.permissions ?? [],
    nombre: datos.user?.fullName ?? '',
    correo: datos.user?.email ?? correo,
  }

  guardarSesion(sesion)
  return sesion
}

/** Cierra la sesión en el backend (revoca el token) y en local. */
export async function cerrarSesionServidor(): Promise<void> {
  try {
    await pedir('account/logout', { metodo: 'POST' })
  } catch {
    /* el token pudo haber caducado: igualmente limpiamos la sesión local */
  } finally {
    cerrarSesion()
  }
}
