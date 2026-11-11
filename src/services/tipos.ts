/**
 * Tipos de dominio del módulo de Gestión.
 *
 * Estos contratos son los que consumen las vistas. Cuando exista backend
 * real, solo deben reemplazarse las implementaciones de `src/services/*`
 * por llamadas HTTP: ni las vistas ni los componentes cambian.
 */

/** Estado general de un usuario o de un perfil. */
export type Estado = 'activo' | 'inactivo'

/** Tipos de documento aceptados en el formulario de usuario. */
export type TipoDocumento = 'CC' | 'CE' | 'TI' | 'NIT'

/** Regiones administrativas del SENA (demostración). */
export type Regional =
  | 'Regional Bogotá'
  | 'Regional Antioquia'
  | 'Regional Valle'
  | 'Regional Caribe'
  | 'Regional Oriental'
  | 'Regional Sur'

/** Registro completo de un usuario de la plataforma. */
export interface Usuario {
  id: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  regional: Regional
  centro: string
  /** Nombre del perfil asignado (se resuelve contra `perfilesService`). */
  perfil: string
  estado: Estado
}

/** Registro completo de un perfil de acceso. */
export interface Perfil {
  id: string
  nombre: string
  descripcion: string
  estado: Estado
}

/** Acciones modulares disponibles en la matriz de permisos. */
export type Accion = 'consultar' | 'crear' | 'editar' | 'eliminar'

/** Módulo de HuellaVerde sobre el que se otorgan permisos. */
export interface Modulo {
  id: string
  nombre: string
}

/** Permiso concreto de una acción sobre un módulo. */
export type PermisoAccion = Record<Accion, boolean>

/** Matriz de permisos: módulo → acciones. */
export type MatrizPermisos = Record<string, PermisoAccion>

/** Permisos completos de un perfil concreto. */
export interface PermisosPerfil {
  perfilId: string
  matriz: MatrizPermisos
}

/** Datos de entrada para crear o actualizar un usuario. */
export type UsuarioFormulario = Omit<Usuario, 'id'>

/** Datos de entrada para crear o actualizar un perfil. */
export type PerfilFormulario = Omit<Perfil, 'id'>
