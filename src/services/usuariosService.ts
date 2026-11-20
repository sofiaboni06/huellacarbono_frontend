import { api } from './api'
import type { Estado, Perfil, Usuario, UsuarioFormulario } from './tipos'

interface RolApi {
  id: number
  name: string
  active: boolean
}

interface UsuarioApi {
  id: number
  nombres: string
  apellidos: string
  email: string
  active: boolean
  lastAccessAt: string | null
  roles: RolApi[]
}

interface Pagina<T> {
  data: T
  meta?: { lastPage?: number }
}

let correos: { id: string; correo: string }[] = []

function aUsuario(apiUsuario: UsuarioApi): Usuario {
  const rol = apiUsuario.roles[0]
  return {
    id: String(apiUsuario.id),
    nombres: apiUsuario.nombres,
    apellidos: apiUsuario.apellidos,
    correo: apiUsuario.email,
    perfil: rol?.name ?? 'Sin rol',
    perfilId: rol ? String(rol.id) : '',
    estado: apiUsuario.active ? 'activo' : 'inactivo',
    ultimoAcceso: apiUsuario.lastAccessAt,
  }
}

async function pedirPagina(pagina: number): Promise<Pagina<UsuarioApi[]>> {
  return api<Pagina<UsuarioApi[]>>(
    `/users?includeInactive=true&perPage=100&page=${pagina}`,
  )
}

/** Perfiles activos para asignar un usuario. Solo exige permiso de ver usuarios. */
export async function listarOpcionesPerfil(): Promise<Perfil[]> {
  const respuesta = await api<{
    data: { roles: { id: number; name: string; description: string }[] }
  }>('/users/options')
  return respuesta.data.roles.map((rol) => ({
    id: String(rol.id),
    nombre: rol.name,
    descripcion: rol.description,
    estado: 'activo',
    sistema: false,
    permisos: [],
  }))
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const primera = await pedirPagina(1)
  const crudos = [...primera.data]
  const ultima = primera.meta?.lastPage ?? 1
  for (let pagina = 2; pagina <= ultima; pagina += 1) {
    const siguiente = await pedirPagina(pagina)
    crudos.push(...siguiente.data)
  }
  const usuarios = crudos.map(aUsuario)
  correos = usuarios.map((usuario) => ({ id: usuario.id, correo: usuario.correo }))
  return usuarios
}

export function correoDuplicado(correo: string, idExcluido?: string): boolean {
  const normalizado = correo.trim().toLowerCase()
  return correos.some(
    (usuario) => usuario.id !== idExcluido && usuario.correo.trim().toLowerCase() === normalizado,
  )
}

export async function crearUsuario(datos: UsuarioFormulario): Promise<Usuario> {
  const creado = await api<Pagina<UsuarioApi>>('/users', {
    method: 'POST',
    body: JSON.stringify({
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      email: datos.correo,
      password: datos.password,
      passwordConfirmation: datos.passwordConfirmation,
      roleIds: [Number(datos.perfilId)],
    }),
  })
  return aUsuario(creado.data)
}

export async function actualizarUsuario(
  id: string,
  datos: UsuarioFormulario,
): Promise<Usuario | null> {
  const cuerpo: Record<string, unknown> = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    email: datos.correo,
    active: datos.estado === 'activo',
  }
  if (datos.password) {
    cuerpo.password = datos.password
    cuerpo.passwordConfirmation = datos.passwordConfirmation
  }

  const actualizado = await api<Pagina<UsuarioApi>>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpo),
  })

  if (datos.perfilId) {
    const conRol = await api<Pagina<UsuarioApi>>(`/users/${id}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleIds: [Number(datos.perfilId)] }),
    })
    return aUsuario(conRol.data)
  }

  return aUsuario(actualizado.data)
}

export async function cambiarEstadoUsuario(id: string, estado: Estado): Promise<Usuario | null> {
  const actualizado = await api<Pagina<UsuarioApi>>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: estado === 'activo' }),
  })
  return aUsuario(actualizado.data)
}

/** La API no borra usuarios: desactivarlos conserva el historial. */
export async function eliminarUsuario(id: string): Promise<boolean> {
  await cambiarEstadoUsuario(id, 'inactivo')
  return true
}
