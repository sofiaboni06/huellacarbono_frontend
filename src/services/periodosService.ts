import { api } from './api'

export type EstadoPeriodo = 'ABIERTO' | 'CERRADO' | 'BLOQUEADO'

export interface Periodo {
  id: string
  organizacionId: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: EstadoPeriodo
}

export interface PeriodoFormulario {
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: EstadoPeriodo
}

interface PeriodoApi {
  id: number
  organizacionId: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado: EstadoPeriodo
}

function aPeriodo(item: PeriodoApi): Periodo {
  return {
    id: String(item.id),
    organizacionId: String(item.organizacionId),
    nombre: item.nombre,
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    estado: item.estado,
  }
}

export function etiquetaPeriodo(estado: EstadoPeriodo): string {
  if (estado === 'CERRADO') return 'Cerrado'
  if (estado === 'BLOQUEADO') return 'Bloqueado'
  return 'Abierto'
}

export async function listarPeriodos(organizacionId: string): Promise<Periodo[]> {
  const respuesta = await api<{ data: PeriodoApi[] }>(`/organizaciones/${organizacionId}/periodos`)
  return respuesta.data.map(aPeriodo)
}

export async function crearPeriodo(
  organizacionId: string,
  datos: Pick<PeriodoFormulario, 'nombre' | 'fechaInicio' | 'fechaFin'>,
): Promise<Periodo> {
  const respuesta = await api<{ data: PeriodoApi }>(`/organizaciones/${organizacionId}/periodos`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
  return aPeriodo(respuesta.data)
}

export async function actualizarPeriodo(id: string, datos: PeriodoFormulario): Promise<Periodo> {
  const respuesta = await api<{ data: PeriodoApi }>(`/periodos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(datos),
  })
  return aPeriodo(respuesta.data)
}
