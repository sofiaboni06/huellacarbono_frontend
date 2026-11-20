export const PERMISOS_CATALOGO = [
  'tipo_agua.ver',
  'componente_hidrico.ver',
  'alcance_emision.ver',
  'metodologia.ver',
  'factor_emision.ver',
  'parametro_hidrico.ver',
] as const

/** Código que abre cada vista de gestión. El resto de la app no tiene permiso en la API. */
const CODIGO_POR_RUTA: { prefijo: string; codigo: string | readonly string[] }[] = [
  { prefijo: '/gestion/usuarios', codigo: 'usuario.ver' },
  { prefijo: '/gestion/perfiles', codigo: 'rol.ver' },
  { prefijo: '/gestion/roles-permisos', codigo: 'rol.ver' },
  { prefijo: '/gestion/organizaciones', codigo: 'organizacion.ver' },
  { prefijo: '/gestion/catalogos', codigo: PERMISOS_CATALOGO },
  { prefijo: '/gestion/unidades-medida', codigo: 'unidad_medida.ver' },
]

function cubre(permisos: string[], codigo: string | readonly string[]) {
  const lista = typeof codigo === 'string' ? [codigo] : codigo
  return lista.some((item) => permisos.includes(item))
}

export function tienePermiso(permisos: string[], codigo: string): boolean {
  return permisos.includes(codigo)
}

/** `null` si la ruta no está limitada por un permiso del rol. */
export function codigoDeRuta(pathname: string): string | readonly string[] | null {
  const vista = CODIGO_POR_RUTA.find(
    (item) => pathname === item.prefijo || pathname.startsWith(`${item.prefijo}/`),
  )
  return vista?.codigo ?? null
}

export function puedeEntrar(permisos: string[], codigo: string | readonly string[] | null) {
  if (!codigo) return true
  return cubre(permisos, codigo)
}

/** Primera vista de gestión que el rol puede abrir. */
export function destinoGestion(permisos: string[]): string {
  const vista = CODIGO_POR_RUTA.find((item) => cubre(permisos, item.codigo))
  return vista?.prefijo ?? '/inicio'
}
