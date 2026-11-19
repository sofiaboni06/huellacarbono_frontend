import { api } from './api'
import { MODULOS } from './datosDemo'
import { obtenerPerfil } from './perfilesService'
import type { Accion, MatrizPermisos, PermisoAccion } from './tipos'

const ACCIONES: Accion[] = ['consultar', 'crear', 'editar', 'eliminar']

/** Qué código de la API enciende cada casilla. Las que no están no se pueden guardar. */
const CODIGOS: Record<string, Partial<Record<Accion, string>>> = {
  usuarios: { consultar: 'usuario.ver', crear: 'usuario.crear', editar: 'usuario.editar' },
  perfiles: { consultar: 'rol.ver', crear: 'rol.crear', editar: 'rol.editar' },
  roles: { consultar: 'rol.ver', crear: 'rol.crear', editar: 'rol.editar' },
}

const cache = new Map<string, MatrizPermisos>()

function filaVacia(): PermisoAccion {
  return { consultar: false, crear: false, editar: false, eliminar: false }
}

export function matrizVacia(): MatrizPermisos {
  const salida: MatrizPermisos = {}
  for (const modulo of MODULOS) salida[modulo.id] = filaVacia()
  return salida
}

function clonarMatriz(matriz: MatrizPermisos): MatrizPermisos {
  const salida: MatrizPermisos = {}
  for (const modulo of MODULOS) {
    salida[modulo.id] = { ...(matriz[modulo.id] ?? filaVacia()) }
  }
  return salida
}

function desdeCodigos(codigos: string[]): MatrizPermisos {
  const matriz = matrizVacia()
  for (const modulo of MODULOS) {
    const mapa = CODIGOS[modulo.id]
    if (!mapa) continue
    for (const accion of ACCIONES) {
      const codigo = mapa[accion]
      matriz[modulo.id][accion] = codigo ? codigos.includes(codigo) : false
    }
  }
  return matriz
}

export async function cargarPermisos(perfilId: string): Promise<MatrizPermisos> {
  const perfil = await obtenerPerfil(perfilId)
  const matriz = desdeCodigos(perfil.permisos)
  cache.set(perfilId, matriz)
  return clonarMatriz(matriz)
}

export function permisosGuardados(perfilId: string): MatrizPermisos {
  return clonarMatriz(cache.get(perfilId) ?? matrizVacia())
}

export function accionGuardable(moduloId: string, accion: Accion): boolean {
  return Boolean(CODIGOS[moduloId]?.[accion])
}

/** Enciende o apaga todas las casillas que comparten el mismo código. */
export function cambiarMatriz(
  matriz: MatrizPermisos,
  moduloId: string,
  accion: Accion,
  valor: boolean,
): MatrizPermisos {
  const codigo = CODIGOS[moduloId]?.[accion]
  const siguiente = clonarMatriz(matriz)
  if (!codigo) return siguiente

  for (const modulo of MODULOS) {
    const mapa = CODIGOS[modulo.id]
    if (!mapa) continue
    for (const item of ACCIONES) {
      if (mapa[item] === codigo) siguiente[modulo.id][item] = valor
    }
  }
  return siguiente
}

/** Marca solo las casillas que el servidor puede guardar. */
export function marcarMatriz(matriz: MatrizPermisos, valor: boolean): MatrizPermisos {
  const siguiente = clonarMatriz(matriz)
  for (const modulo of MODULOS) {
    for (const accion of ACCIONES) {
      siguiente[modulo.id][accion] = valor && accionGuardable(modulo.id, accion)
    }
  }
  return siguiente
}

function codigosDe(matriz: MatrizPermisos): string[] {
  const codes = new Set<string>()
  for (const modulo of MODULOS) {
    const mapa = CODIGOS[modulo.id]
    const fila = matriz[modulo.id]
    if (!mapa || !fila) continue
    for (const accion of ACCIONES) {
      const codigo = mapa[accion]
      if (codigo && fila[accion]) codes.add(codigo)
    }
  }
  return [...codes]
}

export async function guardarPermisos(perfilId: string, matriz: MatrizPermisos): Promise<MatrizPermisos> {
  await api(`/roles/${perfilId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ codes: codigosDe(matriz) }),
  })
  return cargarPermisos(perfilId)
}

export function contarPermisos(matriz: MatrizPermisos): number {
  return MODULOS.reduce((total, modulo) => {
    const fila = matriz[modulo.id]
    if (!fila) return total
    return total + ACCIONES.reduce((suma, accion) => suma + (fila[accion] ? 1 : 0), 0)
  }, 0)
}
