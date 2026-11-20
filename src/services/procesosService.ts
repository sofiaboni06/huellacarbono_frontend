import { api } from './api'

export interface Ficha {
  id: string
  nombre: string
  descripcion: string
  estado: 'activo' | 'inactivo'
  actividadesActivas?: number
}

export interface FichaFormulario {
  nombre: string
  descripcion: string
  estado: 'activo' | 'inactivo'
}

interface FichaApi {
  id: number
  nombre: string
  descripcion: string | null
  active: boolean
  actividadesActivas?: number
}

function aFicha(item: FichaApi): Ficha {
  return {
    id: String(item.id),
    nombre: item.nombre,
    descripcion: item.descripcion?.trim() ?? '',
    estado: item.active ? 'activo' : 'inactivo',
    actividadesActivas: item.actividadesActivas ?? 0,
  }
}

function cuerpo(datos: FichaFormulario, incluirEstado: boolean) {
  const cuerpoJson: Record<string, unknown> = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim() || null,
  }
  if (incluirEstado) cuerpoJson.active = datos.estado === 'activo'
  return cuerpoJson
}

export async function listarProcesos(sedeId: string): Promise<Ficha[]> {
  const respuesta = await api<{ data: FichaApi[] }>(
    `/sedes/${sedeId}/procesos?includeInactive=true`,
  )
  return respuesta.data.map(aFicha)
}

export async function crearProceso(sedeId: string, datos: FichaFormulario): Promise<Ficha> {
  const respuesta = await api<{ data: FichaApi }>(`/sedes/${sedeId}/procesos`, {
    method: 'POST',
    body: JSON.stringify(cuerpo(datos, false)),
  })
  return aFicha(respuesta.data)
}

export async function actualizarProceso(id: string, datos: FichaFormulario): Promise<Ficha> {
  const respuesta = await api<{ data: FichaApi }>(`/procesos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpo(datos, true)),
  })
  return aFicha(respuesta.data)
}

export async function cambiarEstadoProceso(proceso: Ficha, estado: Ficha['estado']): Promise<Ficha> {
  const respuesta = await api<{ data: FichaApi }>(`/procesos/${proceso.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: estado === 'activo' }),
  })
  return aFicha(respuesta.data)
}

export async function listarActividades(procesoId: string): Promise<Ficha[]> {
  const respuesta = await api<{ data: FichaApi[] }>(
    `/procesos/${procesoId}/actividades?includeInactive=true`,
  )
  return respuesta.data.map(aFicha)
}

export async function crearActividad(procesoId: string, datos: FichaFormulario): Promise<Ficha> {
  const respuesta = await api<{ data: FichaApi }>(`/procesos/${procesoId}/actividades`, {
    method: 'POST',
    body: JSON.stringify(cuerpo(datos, false)),
  })
  return aFicha(respuesta.data)
}

export async function actualizarActividad(id: string, datos: FichaFormulario): Promise<Ficha> {
  const respuesta = await api<{ data: FichaApi }>(`/actividades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cuerpo(datos, true)),
  })
  return aFicha(respuesta.data)
}

export async function cambiarEstadoActividad(
  actividad: Ficha,
  estado: Ficha['estado'],
): Promise<Ficha> {
  const respuesta = await api<{ data: FichaApi }>(`/actividades/${actividad.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: estado === 'activo' }),
  })
  return aFicha(respuesta.data)
}
