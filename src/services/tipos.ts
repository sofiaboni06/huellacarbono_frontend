/**
 * Tipos del módulo de Gestión.
 * Coinciden con lo que guarda la API: usuario, rol y permisos del rol.
 */

export type Estado = 'activo' | 'inactivo'

export interface Usuario {
  id: string
  nombres: string
  apellidos: string
  correo: string
  perfil: string
  perfilId: string
  estado: Estado
  ultimoAcceso: string | null
}

export interface UsuarioFormulario {
  nombres: string
  apellidos: string
  correo: string
  perfilId: string
  estado: Estado
  password: string
  passwordConfirmation: string
}

export interface Perfil {
  id: string
  nombre: string
  descripcion: string
  estado: Estado
  sistema: boolean
  permisos: string[]
}

export type PerfilFormulario = Pick<Perfil, 'nombre' | 'descripcion' | 'estado'>

export type Accion = 'consultar' | 'crear' | 'editar' | 'eliminar'

export interface Modulo {
  id: string
  nombre: string
}

export type PermisoAccion = Record<Accion, boolean>

export type MatrizPermisos = Record<string, PermisoAccion>
