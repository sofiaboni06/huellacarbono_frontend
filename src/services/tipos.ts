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

/** Sesión guardada tras autenticar contra el backend. */
export interface UsuarioSesion {
  token: string
  /** Códigos de permiso devueltos por `POST /api/v1/auth/login`. */
  permisos: string[]
  nombre: string
  correo: string
}

/* --------------------------------------------------------------------------
 * Datos de actividad (módulo «Registro de Datos de Actividad»)
 * ----------------------------------------------------------------------- */

/**
 * Proyecto seleccionable. En el backend «proyecto» equivale a `organizacion`:
 * no existe una tabla `proyecto` en el esquema.
 */
export interface Proyecto {
  id: number
  name: string
  /** Nombre corto de la organización (`null` si no tiene). */
  shortName: string | null
  /** Dirección de la organización (`null` si no tiene). */
  address: string | null
  nit: string
  active: boolean
}

/** Actividad activa de un proyecto, con su proceso y sede para identificarla. */
export interface ActividadCatalogo {
  id: number
  name: string
  processName: string | null
  sedeName: string | null
}

/** Periodo de medición de un proyecto (`estado`: ABIERTO | CERRADO | BLOQUEADO). */
export interface PeriodoCatalogo {
  id: number
  name: string
  startDate: string
  endDate: string
  status: string
}

/** Fuente de emisión activa (catálogo global). */
export interface FuenteEmisionCatalogo {
  id: number
  code: string
  name: string
  category: string | null
}

/** Alcance de emisión activo (catálogo global). */
export interface AlcanceEmisionCatalogo {
  id: number
  code: string
  name: string
  description: string | null
}

/**
 * Registro de dato de actividad (backend: `activity-data`).
 *
 * Guarda únicamente la cantidad original del documento (ej. `4000` kWh):
 * no existe factor de emisión ni resultado CO2e, cálculo que pertenece a
 * otro módulo.
 */
export interface DatoActividad {
  id: number
  projectId: number | null
  activityId: number
  activityName: string
  processName: string | null
  periodId: number
  periodName: string
  emissionSourceId: number
  emissionSourceName: string
  scopeId: number
  scopeCode: string
  scopeName: string
  unitId: number
  unitSymbol: string
  unitName: string
  /** DECIMAL(24, 8). Siempre cadena para no perder precisión. */
  quantity: string
  whatToCopy: string
  document: string
  status: string
  dataDate: string | null
  registeredBy: { id: number; name: string } | null
  createdAt: string | null
  updatedAt: string | null
}

/** Datos de entrada del formulario de datos de actividad. */
export interface DatoActividadFormulario {
  /**
   * Los identificadores viajan como cadena porque así los maneja
   * `<select>`; el servicio los convierte a número antes de enviarlos.
   */
  activityId: string
  periodId: string
  emissionSourceId: string
  scopeId: string
  unitId: string
  /** Cadena decimal (nunca `number`), formato DECIMAL(24, 8). */
  quantity: string
  whatToCopy: string
  document: string
}
