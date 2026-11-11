/**
 * Persistencia local de los datos de demostración.
 *
 * Simula la "base de datos" del backend en `localStorage`. Si el navegador
 * no lo permite (modo privado, cookies bloqueadas) se degrada en silencio a
 * memoria volátil, de modo que la aplicación sigue funcionando igual.
 */

const PREFIJO = 'huellaverde.gestion.'

/** Lee una colección guardada; si no existe, devuelve la semilla inicial. */
export function leerColeccion<T>(clave: string, semilla: T[]): T[] {
  try {
    const bruto = window.localStorage.getItem(PREFIJO + clave)
    if (!bruto) return semilla.map((item) => ({ ...item }))
    const datos = JSON.parse(bruto)
    if (!Array.isArray(datos)) return semilla.map((item) => ({ ...item }))
    return datos as T[]
  } catch {
    return semilla.map((item) => ({ ...item }))
  }
}

/** Guarda una colección completa. Devuelve `true` si se escribió. */
export function guardarColeccion<T>(clave: string, datos: T[]): boolean {
  try {
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify(datos))
    return true
  } catch {
    return false
  }
}

/** Borra una colección guardada (vuelve a la semilla de demostración). */
export function limpiarColeccion(clave: string): void {
  try {
    window.localStorage.removeItem(PREFIJO + clave)
  } catch {
    /* almacenamiento no disponible */
  }
}
