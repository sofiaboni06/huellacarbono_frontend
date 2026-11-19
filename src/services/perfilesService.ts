import { api } from './api'
import type { Estado, Perfil, PerfilFormulario } from './tipos'

interface RolApi {
  id: number
  name: string
  description: string
  active: boolean
  system: boolean
  permissions: string[]
}

interface Sobre<T> {
  data: T
}

let nombres: { id: string; nombre: string }[] = []

function aPerfil(rol: RolApi): Perfil {
  return {
    id: String(rol.id),
    nombre: rol.name,
    descripcion: rol.description,
    estado: rol.active ? 'activo' : 'inactivo',
    sistema: rol.system,
    permisos: rol.permissions,
  }
}

export async function listarPerfiles(): Promise<Perfil[]> {
  const respuesta = await api<Sobre<RolApi[]>>('/roles?includeInactive=true')
  const perfiles = respuesta.data.map(aPerfil)
  nombres = perfiles.map((perfil) => ({ id: perfil.id, nombre: perfil.nombre }))
  return perfiles
}

export function nombreDuplicado(nombre: string, idExcluido?: string): boolean {
  const normalizado = nombre.trim().toLowerCase()
  return nombres.some(
    (perfil) => perfil.id !== idExcluido && perfil.nombre.trim().toLowerCase() === normalizado,
  )
}

export async function crearPerfil(datos: PerfilFormulario): Promise<Perfil> {
  const respuesta = await api<Sobre<RolApi>>('/roles', {
    method: 'POST',
    body: JSON.stringify({
      name: datos.nombre,
      description: datos.descripcion,
    }),
  })
  return aPerfil(respuesta.data)
}

export async function actualizarPerfil(id: string, datos: PerfilFormulario): Promise<Perfil | null> {
  const respuesta = await api<Sobre<RolApi>>(`/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: datos.nombre,
      description: datos.descripcion,
      active: datos.estado === 'activo',
    }),
  })
  return aPerfil(respuesta.data)
}

export async function cambiarEstadoPerfil(id: string, estado: Estado): Promise<Perfil | null> {
  const respuesta = await api<Sobre<RolApi>>(`/roles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: estado === 'activo' }),
  })
  return aPerfil(respuesta.data)
}

/** La API no borra roles: desactivarlos evita dejar usuarios sin referencia. */
export async function eliminarPerfil(id: string): Promise<boolean> {
  await cambiarEstadoPerfil(id, 'inactivo')
  return true
}

export async function obtenerPerfil(id: string): Promise<Perfil> {
  const respuesta = await api<Sobre<RolApi>>(`/roles/${id}`)
  return aPerfil(respuesta.data)
}
