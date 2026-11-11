/**
 * Servicio de usuarios (demostración local).
 *
 * Expone una API asíncrona con la misma forma que tendría el endpoint real,
 * de modo que sustituir estas funciones por `fetch` no obliga a tocar las
 * vistas. Los datos viven en memoria + `localStorage` (ver `persistencia.ts`).
 */

import { guardarColeccion, leerColeccion } from './persistencia'
import { USUARIOS_DEMO } from './datosDemo'
import type { Estado, Usuario, UsuarioFormulario } from './tipos'

const CLAVE = 'usuarios'

let almacen: Usuario[] = leerColeccion<Usuario>(CLAVE, USUARIOS_DEMO)

/** Simula la latencia de una petición de red. */
function red(ms = 160): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

function persistir(): void {
  guardarColeccion(CLAVE, almacen)
}

function clonarLista(): Usuario[] {
  return almacen.map((usuario) => ({ ...usuario }))
}

function clonar(usuario: Usuario): Usuario {
  return { ...usuario }
}

/** Genera un identificador nuevo para un usuario recién creado. */
function siguienteId(): string {
  const numeros = almacen
    .map((usuario) => Number.parseInt(usuario.id.replace(/\D/g, ''), 10))
    .filter((valor) => Number.isFinite(valor))
  const maximo = numeros.length ? Math.max(...numeros) : 0
  return `usu-${String(maximo + 1).padStart(3, '0')}`
}

/** Lista completa de usuarios. */
export async function listarUsuarios(): Promise<Usuario[]> {
  await red()
  return clonarLista()
}

/** Crea un usuario a partir de los datos del formulario. */
export async function crearUsuario(datos: UsuarioFormulario): Promise<Usuario> {
  await red()
  const usuario: Usuario = { ...datos, id: siguienteId() }
  almacen = [...almacen, usuario]
  persistir()
  return clonar(usuario)
}

/** Actualiza un usuario existente. Devuelve `null` si no existe. */
export async function actualizarUsuario(
  id: string,
  datos: UsuarioFormulario,
): Promise<Usuario | null> {
  await red()
  const indice = almacen.findIndex((usuario) => usuario.id === id)
  if (indice < 0) return null
  const actualizado: Usuario = { ...almacen[indice], ...datos, id }
  almacen = almacen.map((usuario, i) => (i === indice ? actualizado : usuario))
  persistir()
  return clonar(actualizado)
}

/** Activa o desactiva un usuario. */
export async function cambiarEstadoUsuario(id: string, estado: Estado): Promise<Usuario | null> {
  await red(120)
  const indice = almacen.findIndex((usuario) => usuario.id === id)
  if (indice < 0) return null
  const actualizado: Usuario = { ...almacen[indice], estado }
  almacen = almacen.map((usuario, i) => (i === indice ? actualizado : usuario))
  persistir()
  return clonar(actualizado)
}

/** Elimina un usuario. Devuelve `false` si no existía. */
export async function eliminarUsuario(id: string): Promise<boolean> {
  await red(120)
  const antes = almacen.length
  almacen = almacen.filter((usuario) => usuario.id !== id)
  const elimino = almacen.length < antes
  if (elimino) persistir()
  return elimino
}

/** Restaura los datos de demostración originales. */
export async function reiniciarUsuarios(): Promise<Usuario[]> {
  await red(80)
  almacen = USUARIOS_DEMO.map((usuario) => ({ ...usuario }))
  persistir()
  return clonarLista()
}

/** Comprueba si un correo ya está registrado por otro usuario. */
export function correoDuplicado(correo: string, idExcluido?: string): boolean {
  const normalizado = correo.trim().toLowerCase()
  return almacen.some(
    (usuario) => usuario.id !== idExcluido && usuario.correo.trim().toLowerCase() === normalizado,
  )
}
