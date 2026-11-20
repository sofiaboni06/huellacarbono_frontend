import { api } from './api'

export interface Regional {
  id: string
  codigo: string
  nombre: string
  activo: boolean
}

export interface CentroFormacion {
  id: string
  codigo: string
  nombre: string
  activo: boolean
  regionalId: string
  regionalNombre: string
}

interface RegionalApi {
  id: number
  codigo: string
  nombre: string
  active: boolean
}

interface CentroApi {
  id: number
  codigo: string
  nombre: string
  active: boolean
  regional: { id: number; nombre: string } | null
}

function aRegional(item: RegionalApi): Regional {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
    activo: item.active,
  }
}

function aCentro(item: CentroApi): CentroFormacion {
  return {
    id: String(item.id),
    codigo: item.codigo,
    nombre: item.nombre,
    activo: item.active,
    regionalId: item.regional ? String(item.regional.id) : '',
    regionalNombre: item.regional?.nombre ?? '',
  }
}

export async function listarRegionales(incluirInactivas = false): Promise<Regional[]> {
  const respuesta = await api<{ data: RegionalApi[] }>(
    `/regionales${incluirInactivas ? '?includeInactive=true' : ''}`,
  )
  return respuesta.data.map(aRegional)
}

export async function crearRegional(datos: { codigo: string; nombre: string }): Promise<Regional> {
  const respuesta = await api<{ data: RegionalApi }>('/regionales', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
  return aRegional(respuesta.data)
}

export async function actualizarRegional(
  id: string,
  datos: { codigo?: string; nombre?: string; activo?: boolean },
): Promise<Regional> {
  const respuesta = await api<{ data: RegionalApi }>(`/regionales/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      codigo: datos.codigo,
      nombre: datos.nombre,
      active: datos.activo,
    }),
  })
  return aRegional(respuesta.data)
}

export async function listarCentros(incluirInactivos = false): Promise<CentroFormacion[]> {
  const respuesta = await api<{ data: CentroApi[] }>(
    `/centros${incluirInactivos ? '?includeInactive=true' : ''}`,
  )
  return respuesta.data.map(aCentro)
}

export async function crearCentro(datos: {
  regionalId: string
  codigo: string
  nombre: string
}): Promise<CentroFormacion> {
  const respuesta = await api<{ data: CentroApi }>('/centros', {
    method: 'POST',
    body: JSON.stringify({
      regionalId: Number(datos.regionalId),
      codigo: datos.codigo,
      nombre: datos.nombre,
    }),
  })
  return aCentro(respuesta.data)
}

export async function actualizarCentro(
  id: string,
  datos: { regionalId?: string; codigo?: string; nombre?: string; activo?: boolean },
): Promise<CentroFormacion> {
  const respuesta = await api<{ data: CentroApi }>(`/centros/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      regionalId: datos.regionalId ? Number(datos.regionalId) : undefined,
      codigo: datos.codigo,
      nombre: datos.nombre,
      active: datos.activo,
    }),
  })
  return aCentro(respuesta.data)
}
