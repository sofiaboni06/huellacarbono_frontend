/**
 * Cliente HTTP compartido de HuellaVerde.
 *
 * Punto único de salida hacia el backend real (`/api/v1`):
 *
 *   - Resuelve la URL base desde `VITE_API_URL` (por defecto el backend de
 *     desarrollo en `localhost:3333`).
 *   - Adjunta el token de sesión en `Authorization: Bearer …` sin que las
 *     vistas tengan que conocerlo (ver `sesionService.ts`).
 *   - Desenvuelve la envoltura `{ data: … }` que devuelve el backend.
 *   - Normaliza los errores del servidor en `ErrorApi` (estado HTTP +
 *     mensajes por campo), de modo que las vistas solo muestren texto.
 *   - Duplica las peticiones GET simultáneas idénticas para evitar viajes
 *     repetidos a la red.
 */
import { cerrarSesion, leerToken } from './sesionService'

/** URL base de la API. Se puede sobreescribir con `VITE_API_URL`. */
const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1').replace(
  /\/+$/,
  '',
)

/** Error normalizado de una petición fallida. */
export class ErrorApi extends Error {
  /** Estado HTTP (0 = sin respuesta: red caída o backend apagado). */
  readonly status: number
  /** Mensajes por campo, útiles para pintar errores de formulario (422). */
  readonly campos: Record<string, string>

  constructor(mensaje: string, status: number, campos: Record<string, string> = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.campos = campos
  }
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface OpcionesPeticion {
  metodo?: Metodo
  /** Cuerpo JSON. `factorBase` debe viajar siempre como cadena. */
  cuerpo?: unknown
  /** Parámetros de consulta (se omiten los indefinidos). */
  query?: Record<string, string | number | boolean | undefined>
}

/** Forma del cuerpo de error que devuelve el backend. */
interface CuerpoError {
  message?: string
  errors?: { message?: string; field?: string }[]
}

/** Convierte un estado HTTP + cuerpo en un `ErrorApi` con mensaje legible. */
function construirError(status: number, cuerpo: CuerpoError | null): ErrorApi {
  if (status === 401) {
    return new ErrorApi('Tu sesión expiró o no has iniciado sesión. Vuelve a identificarte.', 401)
  }

  const errores = Array.isArray(cuerpo?.errors) ? cuerpo.errors : []
  if (errores.length > 0) {
    const campos: Record<string, string> = {}
    for (const error of errores) {
      if (error?.field && error.message) campos[error.field] = error.message
    }
    const primero = errores.find((error) => error?.message)?.message
    return new ErrorApi(primero ?? 'Revisa los datos enviados.', status, campos)
  }

  if (status === 403) {
    return new ErrorApi(
      cuerpo?.message ?? 'No tienes permiso para realizar esta acción.',
      403,
    )
  }

  if (status === 404) {
    return new ErrorApi(cuerpo?.message ?? 'El registro solicitado no existe.', 404)
  }

  if (status === 409) {
    return new ErrorApi(cuerpo?.message ?? 'La operación entra en conflicto con un registro existente.', 409)
  }

  if (cuerpo?.message) return new ErrorApi(cuerpo.message, status)

  return new ErrorApi(`No se pudo completar la operación (error ${status}).`, status)
}

/** Peticiones GET en curso, para no duplicar llamadas idénticas. */
const getEnCurso = new Map<string, Promise<unknown>>()

async function ejecutar<T>(url: string, metodo: Metodo, cuerpo: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = leerToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorApi(
      'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.',
      0,
    )
  }

  const texto = await respuesta.text()
  let datos: unknown = null
  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch {
      datos = null
    }
  }

  if (!respuesta.ok) {
    // Un 401 fuera del login invalida la sesión guardada; en el login solo
    // significa contraseña incorrecta y no debe borrar nada.
    if (respuesta.status === 401 && !url.includes('/auth/login')) cerrarSesion()
    throw construirError(respuesta.status, datos as CuerpoError | null)
  }

  if (datos && typeof datos === 'object' && 'data' in datos) {
    return (datos as { data: T }).data
  }
  return datos as T
}

/**
 * Ejecuta una petición contra la API.
 *
 * @param ruta Ruta relativa a la base (p. ej. `measurement-units`).
 */
export async function pedir<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const metodo = opciones.metodo ?? 'GET'
  const limpia = ruta.replace(/^\/+/, '')
  const url = new URL(`${BASE_URL}/${limpia}`)

  if (opciones.query) {
    for (const [clave, valor] of Object.entries(opciones.query)) {
      if (valor !== undefined) url.searchParams.set(clave, String(valor))
    }
  }

  const destino = url.toString()

  // Las GET simultáneas con la misma URL comparten una sola respuesta.
  if (metodo === 'GET') {
    const pendiente = getEnCurso.get(destino)
    if (pendiente) return pendiente as Promise<T>
    const promesa = ejecutar<T>(destino, metodo, opciones.cuerpo).finally(() => {
      getEnCurso.delete(destino)
    })
    getEnCurso.set(destino, promesa)
    return promesa
  }

  return ejecutar<T>(destino, metodo, opciones.cuerpo)
}
