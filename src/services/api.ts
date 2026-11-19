const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, '')

if (!API_URL) {
  throw new Error('Falta VITE_API_URL en el archivo .env')
}

export class ErrorApi extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface CuerpoError {
  message?: string
  errors?: { message?: string }[]
}

function mensajeError(cuerpo: CuerpoError, status: number): string {
  const delCampo = cuerpo.errors?.find((item) => item.message)?.message
  if (delCampo) return delCampo
  if (cuerpo.message) return cuerpo.message
  if (status === 401) return 'Correo o contraseña incorrectos.'
  if (status === 403) return 'No tienes permiso para realizar esta acción.'
  return 'No se pudo completar la operación.'
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
  } catch {
    throw new ErrorApi('No hay conexión con el servidor.', 0)
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
    throw new ErrorApi(mensajeError(cuerpo, respuesta.status), respuesta.status)
  }

  return cuerpo
}
