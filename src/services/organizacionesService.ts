import { api } from './api'

export const TIPOS_ORGANIZACION = [
  { valor: 'EMPRESA', etiqueta: 'Empresa' },
  { valor: 'ENTIDAD_PUBLICA', etiqueta: 'Entidad pública' },
  { valor: 'INSTITUCION_EDUCATIVA', etiqueta: 'Institución educativa' },
  { valor: 'ONG', etiqueta: 'ONG' },
  { valor: 'OTRA', etiqueta: 'Otra' },
] as const

export type TipoOrganizacion = (typeof TIPOS_ORGANIZACION)[number]['valor']

export const SECTORES_ECONOMICOS = [
  {
    grupo: 'Primario',
    opciones: [
      'Agricultura y Cultivos Agrícolas',
      'Ganadería y Producción Pecuaria',
      'Silvicultura y Extracción Forestal',
      'Pesca y Acuicultura',
      'Minería y Extracción de Hidrocarburos',
    ],
  },
  {
    grupo: 'Secundario',
    opciones: [
      'Industria de Alimentos, Bebidas y Tabaco',
      'Textil, Confección, Cuero y Calzado',
      'Industria Química, Petroquímica y Farmacéutica',
      'Materiales de Construcción y Minerales no Metálicos',
      'Metalmecánica y Fabricación de Maquinaria',
      'Construcción y Obras Civiles',
    ],
  },
  {
    grupo: 'Terciario',
    opciones: [
      'Comercio Mayorista y Minorista',
      'Transporte, Almacenamiento y Logística',
      'Hotelería, Turismo y Gastronomía',
      'Sector Financiero, Asegurador e Inmobiliario',
      'Servicios Públicos Domiciliarios',
      'Servicios Sociales, Salud y Educación',
    ],
  },
  {
    grupo: 'Cuaternario',
    opciones: [
      'Tecnologías de la Información y las Comunicaciones (TIC)',
      'Investigación Científica y Desarrollo Tecnológico (I+D+i)',
      'Servicios Profesionales, Científicos y Técnicos',
    ],
  },
  {
    grupo: 'Quinario',
    opciones: [
      'Administración Pública, Defensa y Justicia',
      'Industrias Creativas y Economía Naranja',
      'Organizaciones No Gubernamentales y Voluntariado',
    ],
  },
] as const

export const DOCUMENTOS_REPRESENTANTE = [
  { valor: 'CC', etiqueta: 'Cédula de ciudadanía' },
  { valor: 'CE', etiqueta: 'Cédula de extranjería' },
  { valor: 'PASAPORTE', etiqueta: 'Pasaporte' },
] as const

export interface Departamento {
  id: string
  codigo: string
  nombre: string
}

export interface Municipio {
  id: string
  codigo: string
  nombre: string
  departamentoId: string
}

export interface UsuarioSede {
  id: string
  nombres: string
  apellidos: string
  correo: string
}

export interface Sede {
  id: string
  organizacionId: string
  codigo: string
  nombre: string
  direccion: string
  telefono: string
  correo: string
  responsableNombre: string
  responsableCargo: string
  responsableCorreo: string
  responsableTelefono: string
  estado: 'activo' | 'inactivo'
  procesosActivos: number
  usuarios: UsuarioSede[]
}

export interface Organizacion {
  id: string
  nombre: string
  nombreCorto: string
  nit: string
  tipo: TipoOrganizacion
  sectorEconomico: string
  correo: string
  telefono: string
  direccion: string
  departamentoId: string
  departamentoNombre: string
  municipioId: string
  municipioNombre: string
  representanteNombre: string
  representanteTipoDocumento: string
  representanteNumeroDocumento: string
  representanteCorreo: string
  representanteTelefono: string
  estado: 'activo' | 'inactivo'
  sedesActivas: number
}

export interface OrganizacionFormulario {
  departamentoId: string
  municipioId: string
  nombre: string
  nombreCorto: string
  nit: string
  tipo: TipoOrganizacion | ''
  sectorEconomico: string
  correo: string
  telefono: string
  direccion: string
  representanteNombre: string
  representanteTipoDocumento: string
  representanteNumeroDocumento: string
  representanteCorreo: string
  representanteTelefono: string
  estado: 'activo' | 'inactivo'
}

export interface SedeFormulario {
  nombre: string
  codigo: string
  direccion: string
  telefono: string
  correo: string
  responsableNombre: string
  responsableCargo: string
  responsableCorreo: string
  responsableTelefono: string
  estado: 'activo' | 'inactivo'
}

interface DepartamentoApi {
  id: number
  codigo: string
  nombre: string
}

interface MunicipioApi {
  id: number
  codigo: string
  nombre: string
  departamentoId: number
}

interface UsuarioSedeApi {
  id: number
  nombres: string
  apellidos: string
  email: string
}

interface SedeApi {
  id: number
  organizacionId: number
  codigo: string | null
  nombre: string
  direccion: string | null
  telefono: string | null
  correo: string | null
  responsable: {
    nombre: string | null
    cargo: string | null
    correo: string | null
    telefono: string | null
  }
  active: boolean
  procesosActivos?: number
  usuarios: UsuarioSedeApi[]
}

interface OrganizacionApi {
  id: number
  nombre: string
  nombreCorto: string | null
  nit: string
  tipo: TipoOrganizacion
  sectorEconomico: string | null
  correo: string | null
  telefono: string | null
  direccion: string | null
  active: boolean
  sedesActivas: number
  municipio: {
    id: number
    nombre: string
    departamento: { id: number; nombre: string } | null
  } | null
  representante: {
    nombre: string | null
    tipoDocumento: string | null
    numeroDocumento: string | null
    correo: string | null
    telefono: string | null
  }
}

interface Pagina<T> {
  data: T
  meta?: { lastPage?: number }
}

function texto(valor: string | null | undefined): string {
  return valor?.trim() ?? ''
}

function nulo(valor: string): string | null {
  const limpio = valor.trim()
  return limpio.length ? limpio : null
}

function aDepartamento(item: DepartamentoApi): Departamento {
  return { id: String(item.id), codigo: item.codigo, nombre: item.nombre }
}

function aMunicipio(item: MunicipioApi): Municipio {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
    departamentoId: String(item.departamentoId),
  }
}

function aUsuario(item: UsuarioSedeApi): UsuarioSede {
  return {
    id: String(item.id),
    nombres: item.nombres,
    apellidos: item.apellidos,
    correo: item.email,
  }
}

function aSede(item: SedeApi): Sede {
  return {
    id: String(item.id),
    organizacionId: String(item.organizacionId),
    codigo: texto(item.codigo),
    nombre: item.nombre,
    direccion: texto(item.direccion),
    telefono: texto(item.telefono),
    correo: texto(item.correo),
    responsableNombre: texto(item.responsable.nombre),
    responsableCargo: texto(item.responsable.cargo),
    responsableCorreo: texto(item.responsable.correo),
    responsableTelefono: texto(item.responsable.telefono),
    estado: item.active ? 'activo' : 'inactivo',
    procesosActivos: item.procesosActivos ?? 0,
    usuarios: (item.usuarios ?? []).map(aUsuario),
  }
}

function aOrganizacion(item: OrganizacionApi): Organizacion {
  return {
    id: String(item.id),
    nombre: item.nombre,
    nombreCorto: texto(item.nombreCorto),
    nit: item.nit,
    tipo: item.tipo,
    sectorEconomico: texto(item.sectorEconomico),
    correo: texto(item.correo),
    telefono: texto(item.telefono),
    direccion: texto(item.direccion),
    departamentoId: item.municipio?.departamento ? String(item.municipio.departamento.id) : '',
    departamentoNombre: item.municipio?.departamento?.nombre ?? '',
    municipioId: item.municipio ? String(item.municipio.id) : '',
    municipioNombre: item.municipio?.nombre ?? '',
    representanteNombre: texto(item.representante.nombre),
    representanteTipoDocumento: texto(item.representante.tipoDocumento),
    representanteNumeroDocumento: texto(item.representante.numeroDocumento),
    representanteCorreo: texto(item.representante.correo),
    representanteTelefono: texto(item.representante.telefono),
    estado: item.active ? 'activo' : 'inactivo',
    sedesActivas: item.sedesActivas ?? 0,
  }
}

function cuerpoOrganizacion(datos: OrganizacionFormulario, incluirEstado: boolean) {
  const cuerpo: Record<string, unknown> = {
    municipioId: Number(datos.municipioId),
    nombre: datos.nombre.trim(),
    nombreCorto: nulo(datos.nombreCorto),
    nit: datos.nit.trim(),
    tipo: datos.tipo,
    sectorEconomico: nulo(datos.sectorEconomico),
    correo: nulo(datos.correo),
    telefono: nulo(datos.telefono),
    direccion: nulo(datos.direccion),
    representanteNombre: nulo(datos.representanteNombre),
    representanteTipoDocumento: nulo(datos.representanteTipoDocumento),
    representanteNumeroDocumento: nulo(datos.representanteNumeroDocumento),
    representanteCorreo: nulo(datos.representanteCorreo),
    representanteTelefono: nulo(datos.representanteTelefono),
  }
  if (incluirEstado) cuerpo.active = datos.estado === 'activo'
  return cuerpo
}

function cuerpoSede(datos: SedeFormulario, incluirEstado: boolean) {
  const cuerpo: Record<string, unknown> = {
    nombre: datos.nombre.trim(),
    codigo: nulo(datos.codigo),
    direccion: nulo(datos.direccion),
    telefono: nulo(datos.telefono),
    correo: nulo(datos.correo),
    responsableNombre: nulo(datos.responsableNombre),
    responsableCargo: nulo(datos.responsableCargo),
    responsableCorreo: nulo(datos.responsableCorreo),
    responsableTelefono: nulo(datos.responsableTelefono),
  }
  if (incluirEstado) cuerpo.active = datos.estado === 'activo'
  return cuerpo
}

export function etiquetaTipo(tipo: string): string {
  return TIPOS_ORGANIZACION.find((item) => item.valor === tipo)?.etiqueta ?? tipo
}

export async function listarDepartamentos(): Promise<Departamento[]> {
  const respuesta = await api<{ data: DepartamentoApi[] }>('/territorio/departamentos')
  return respuesta.data.map(aDepartamento)
}

export async function listarMunicipios(departamentoId: string): Promise<Municipio[]> {
  const respuesta = await api<{ data: MunicipioApi[] }>(
    `/territorio/municipios?departamentoId=${departamentoId}`,
  )
  return respuesta.data.map(aMunicipio)
}

export async function listarOrganizaciones(): Promise<Organizacion[]> {
  const acumuladas: OrganizacionApi[] = []
  let pagina = 1
  let ultima = 1
  do {
    const respuesta = await api<Pagina<OrganizacionApi[]>>(
      `/organizaciones?includeInactive=true&perPage=100&page=${pagina}`,
    )
    acumuladas.push(...respuesta.data)
    ultima = respuesta.meta?.lastPage ?? 1
    pagina += 1
  } while (pagina <= ultima)

  return acumuladas.map(aOrganizacion)
}

export async function obtenerOrganizacion(id: string): Promise<Organizacion> {
  const respuesta = await api<{ data: OrganizacionApi }>(`/organizaciones/${id}`)
  return aOrganizacion(respuesta.data)
}

export async function crearOrganizacion(datos: OrganizacionFormulario): Promise<Organizacion> {
  const respuesta = await api<{ data: OrganizacionApi }>('/organizaciones', {
    method: 'POST',
    body: JSON.stringify(cuerpoOrganizacion(datos, false)),
  })
  return aOrganizacion(respuesta.data)
}

export async function actualizarOrganizacion(
  id: string,
  datos: OrganizacionFormulario,
): Promise<Organizacion> {
  const respuesta = await api<{ data: OrganizacionApi }>(`/organizaciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpoOrganizacion(datos, true)),
  })
  return aOrganizacion(respuesta.data)
}

export async function cambiarEstadoOrganizacion(
  organizacion: Organizacion,
  estado: 'activo' | 'inactivo',
): Promise<Organizacion> {
  const respuesta = await api<{ data: OrganizacionApi }>(`/organizaciones/${organizacion.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: estado === 'activo' }),
  })
  return aOrganizacion(respuesta.data)
}

export async function listarSedes(organizacionId: string): Promise<Sede[]> {
  const respuesta = await api<{ data: SedeApi[] }>(
    `/organizaciones/${organizacionId}/sedes?includeInactive=true`,
  )
  return respuesta.data.map(aSede)
}

export async function obtenerSede(id: string): Promise<Sede> {
  const respuesta = await api<{ data: SedeApi }>(`/sedes/${id}`)
  return aSede(respuesta.data)
}

export async function crearSede(organizacionId: string, datos: SedeFormulario): Promise<Sede> {
  const respuesta = await api<{ data: SedeApi }>(`/organizaciones/${organizacionId}/sedes`, {
    method: 'POST',
    body: JSON.stringify(cuerpoSede(datos, false)),
  })
  return aSede(respuesta.data)
}

export async function actualizarSede(id: string, datos: SedeFormulario): Promise<Sede> {
  const respuesta = await api<{ data: SedeApi }>(`/sedes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpoSede(datos, true)),
  })
  return aSede(respuesta.data)
}

export async function cambiarEstadoSede(sede: Sede, estado: 'activo' | 'inactivo'): Promise<Sede> {
  const respuesta = await api<{ data: SedeApi }>(`/sedes/${sede.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: estado === 'activo' }),
  })
  return aSede(respuesta.data)
}

export async function asignarUsuariosSede(sedeId: string, usuarioIds: string[]): Promise<Sede> {
  const respuesta = await api<{ data: SedeApi }>(`/sedes/${sedeId}/usuarios`, {
    method: 'PUT',
    body: JSON.stringify({ userIds: usuarioIds.map(Number) }),
  })
  return aSede(respuesta.data)
}
