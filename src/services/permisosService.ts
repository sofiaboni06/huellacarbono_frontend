/**
 * Servicio de permisos por perfil (demostración local).
 *
 * La matriz de permisos se guarda por perfil y por módulo. La lógica está
 * deliberadamente desacoplada de la UI: `cargarPermisos` / `guardarPermisos`
 * son las dos únicas puertas de entrada, de modo que más adelante se
 * reemplacen por `GET /perfiles/:id/permisos` y `PUT /perfiles/:id/permisos`
 * sin tocar `RolesPermisos.tsx`.
 *
 * NOTA: mientras no exista integración con el backend, estos permisos solo
 * se reflejan en esta pantalla; no condicionan el acceso real a los módulos.
 */

import { guardarColeccion, leerColeccion } from './persistencia'
import { MODULOS, PERMISOS_DEMO } from './datosDemo'
import type { Accion, MatrizPermisos, PermisoAccion } from './tipos'

const CLAVE = 'permisos'

interface RegistroPermiso {
  perfilId: string
  matriz: MatrizPermisos
}

const SEMILLA: RegistroPermiso[] = Object.entries(PERMISOS_DEMO).map(([perfilId, matriz]) => ({
  perfilId,
  matriz,
}))

let almacen: RegistroPermiso[] = leerColeccion<RegistroPermiso>(CLAVE, SEMILLA)

function red(ms = 140): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

function persistir(): void {
  guardarColeccion(CLAVE, almacen)
}

/** Matriz vacía: ningún módulo, ninguna acción. */
export function matrizVacia(): MatrizPermisos {
  const salida: MatrizPermisos = {}
  for (const modulo of MODULOS) {
    salida[modulo.id] = { consultar: false, crear: false, editar: false, eliminar: false }
  }
  return salida
}

function clonarMatriz(matriz: MatrizPermisos): MatrizPermisos {
  const salida: MatrizPermisos = {}
  for (const modulo of MODULOS) {
    const origen = matriz[modulo.id]
    salida[modulo.id] = origen
      ? {
          consultar: Boolean(origen.consultar),
          crear: Boolean(origen.crear),
          editar: Boolean(origen.editar),
          eliminar: Boolean(origen.eliminar),
        }
      : { consultar: false, crear: false, editar: false, eliminar: false }
  }
  return salida
}

/**
 * Carga los permisos de un perfil.
 * Si el perfil todavía no tiene matriz guardada, devuelve una matriz vacía.
 */
export async function cargarPermisos(perfilId: string): Promise<MatrizPermisos> {
  await red()
  const registro = almacen.find((item) => item.perfilId === perfilId)
  return clonarMatriz(registro ? registro.matriz : matrizVacia())
}

/** Guarda (crea o reemplaza) la matriz completa de un perfil. */
export async function guardarPermisos(
  perfilId: string,
  matriz: MatrizPermisos,
): Promise<MatrizPermisos> {
  await red(220)
  const limpia = clonarMatriz(matriz)
  const existe = almacen.some((item) => item.perfilId === perfilId)
  almacen = existe
    ? almacen.map((item) => (item.perfilId === perfilId ? { perfilId, matriz: limpia } : item))
    : [...almacen, { perfilId, matriz: limpia }]
  persistir()
  return clonarMatriz(limpia)
}

/**
 * Devuelve la matriz original guardada (para descartar cambios sin guardar).
 * Devuelve una matriz vacía si nunca se guardó nada para ese perfil.
 */
export function permisosGuardados(perfilId: string): MatrizPermisos {
  const registro = almacen.find((item) => item.perfilId === perfilId)
  return clonarMatriz(registro ? registro.matriz : matrizVacia())
}

/** Cuenta cuántas casillas están marcadas en una matriz. */
export function contarPermisos(matriz: MatrizPermisos): number {
  return MODULOS.reduce((total, modulo) => {
    const fila: PermisoAccion | undefined = matriz[modulo.id]
    if (!fila) return total
    return total + (['consultar', 'crear', 'editar', 'eliminar'] as Accion[]).reduce(
      (suma, accion) => suma + (fila[accion] ? 1 : 0),
      0,
    )
  }, 0)
}

/** Restaura los permisos de demostración. */
export async function reiniciarPermisos(): Promise<void> {
  await red(80)
  almacen = SEMILLA.map((item) => ({ perfilId: item.perfilId, matriz: clonarMatriz(item.matriz) }))
  persistir()
}
