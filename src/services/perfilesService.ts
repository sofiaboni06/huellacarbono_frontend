/**
 * Servicio de perfiles (demostración local).
 *
 * Misma filosofía que `usuariosService`: API asíncrona con forma de backend
 * real, almacenamiento en memoria + `localStorage`, sin dependencias de UI.
 */

import { guardarColeccion, leerColeccion } from './persistencia'
import { PERFILES_DEMO } from './datosDemo'
import type { Estado, Perfil, PerfilFormulario } from './tipos'

const CLAVE = 'perfiles'

let almacen: Perfil[] = leerColeccion<Perfil>(CLAVE, PERFILES_DEMO)

function red(ms = 150): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

function persistir(): void {
  guardarColeccion(CLAVE, almacen)
}

function clonarLista(): Perfil[] {
  return almacen.map((perfil) => ({ ...perfil }))
}

function siguienteId(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  let propuesta = base || 'perfil'
  let sufijo = 2
  while (almacen.some((perfil) => perfil.id === propuesta)) {
    propuesta = `${base}-${sufijo}`
    sufijo += 1
  }
  return propuesta
}

/** Lista completa de perfiles. */
export async function listarPerfiles(): Promise<Perfil[]> {
  await red()
  return clonarLista()
}

/** Crea un perfil. */
export async function crearPerfil(datos: PerfilFormulario): Promise<Perfil> {
  await red()
  const perfil: Perfil = { ...datos, id: siguienteId(datos.nombre) }
  almacen = [...almacen, perfil]
  persistir()
  return { ...perfil }
}

/** Actualiza un perfil existente. Devuelve `null` si no existe. */
export async function actualizarPerfil(id: string, datos: PerfilFormulario): Promise<Perfil | null> {
  await red()
  const indice = almacen.findIndex((perfil) => perfil.id === id)
  if (indice < 0) return null
  const actualizado: Perfil = { ...almacen[indice], ...datos, id }
  almacen = almacen.map((perfil, i) => (i === indice ? actualizado : perfil))
  persistir()
  return { ...actualizado }
}

/** Activa o desactiva un perfil. */
export async function cambiarEstadoPerfil(id: string, estado: Estado): Promise<Perfil | null> {
  await red(110)
  const indice = almacen.findIndex((perfil) => perfil.id === id)
  if (indice < 0) return null
  const actualizado: Perfil = { ...almacen[indice], estado }
  almacen = almacen.map((perfil, i) => (i === indice ? actualizado : perfil))
  persistir()
  return { ...actualizado }
}

/** Elimina un perfil. Devuelve `false` si no existía. */
export async function eliminarPerfil(id: string): Promise<boolean> {
  await red(110)
  const antes = almacen.length
  almacen = almacen.filter((perfil) => perfil.id !== id)
  const elimino = almacen.length < antes
  if (elimino) persistir()
  return elimino
}

/** Comprueba si el nombre ya lo usa otro perfil. */
export function nombreDuplicado(nombre: string, idExcluido?: string): boolean {
  const normalizado = nombre.trim().toLowerCase()
  return almacen.some(
    (perfil) => perfil.id !== idExcluido && perfil.nombre.trim().toLowerCase() === normalizado,
  )
}
