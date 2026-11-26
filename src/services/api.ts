const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API_URL) {
  throw new Error('Falta VITE_API_URL en el archivo .env')
}

export class ErrorApi extends Error {
  status: number
  /** Mensajes por campo cuando el backend responde 422. */
  campos: Record<string, string>
  /** Cuerpo JSON completo de la respuesta de error (p. ej. `code` y `diagnostico`). */
  cuerpo: unknown
  /** Excepción de transporte original; se conserva para diagnóstico, no para la interfaz. */
  causaTecnica: unknown

  constructor(
    message: string,
    status: number,
    campos: Record<string, string> = {},
    cuerpo: unknown = null,
    causaTecnica: unknown = null,
  ) {
    super(message)
    this.status = status
    this.campos = campos
    this.cuerpo = cuerpo
    this.causaTecnica = causaTecnica
  }
}

interface CuerpoError {
  message?: string
  errors?: { message?: string; field?: string }[]
}

function detalleError(cuerpo: CuerpoError, status: number): { mensaje: string; campos: Record<string, string> } {
  const campos: Record<string, string> = {}
  for (const error of cuerpo.errors ?? []) {
    if (error.field && error.message) campos[error.field] = error.message
  }
  const delCampo = cuerpo.errors?.find((item) => item.message)?.message
  if (delCampo) return { mensaje: delCampo, campos }
  if (cuerpo.message) return { mensaje: cuerpo.message, campos }
  if (status === 401) return { mensaje: 'Correo o contraseña incorrectos.', campos }
  if (status === 403) return { mensaje: 'No tienes permiso para realizar esta acción.', campos }
  return { mensaje: 'No se pudo completar la operación.', campos }
}

export async function api<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('hv:token')
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}/api/v1${ruta}`, { ...init, headers })
  } catch (error) {
    throw new ErrorApi('No fue posible comunicarse con el servicio.', 0, {}, null, error)
  }

  if (respuesta.status === 204) return undefined as T

  const cuerpo = (await respuesta.json().catch(() => ({}))) as T & CuerpoError
  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      sessionStorage.removeItem('hv:token')
      sessionStorage.removeItem('hv:usuario')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    const detalle = detalleError(cuerpo, respuesta.status)
    throw new ErrorApi(detalle.mensaje, respuesta.status, detalle.campos, cuerpo)
  }

  return cuerpo
}
