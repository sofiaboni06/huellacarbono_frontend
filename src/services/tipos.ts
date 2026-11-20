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

/** Registro completo de una unidad de medida (backend: measurement-units). */
export interface UnidadMedida {
  id: number
  code: string
  name: string
  symbol: string
  magnitude: string
  /**
   * DECIMAL(24, 12). Siempre cadena: convertirlo a `Number` perdería
   * precisión antes de enviarlo o mostrarlo.
   */
  baseFactor: string
  active: boolean
}

/** Datos de entrada del formulario de unidades de medida. */
export interface UnidadMedidaFormulario {
  codigo: string
  nombre: string
  simbolo: string
  magnitud: string
  /** Cadena decimal (nunca `number`), respetando el formato del backend. */
  factorBase: string
}
