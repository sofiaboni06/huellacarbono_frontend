import { api } from './api'

export interface OpcionPapel {
  id: string
  nombre: string
  detalle: string
}

export interface PapelCarbono {
  id: string
  actividadNombre: string
  procesoNombre: string
  fuenteNombre: string
  alcanceCodigo: string
  alcanceNombre: string
  cantidad: string
  unidadSimbolo: string
  fuenteDato: string
  estadoRegistro: string
}

interface OpcionApi {
  id: number
  nombre?: string
  codigo?: string
  simbolo?: string
  procesoNombre?: string
}

interface OpcionesApi {
  actividades: OpcionApi[]
  fuentes: OpcionApi[]
  alcances: OpcionApi[]
  unidades: OpcionApi[]
}

interface PapelApi {
  id: number
  actividadNombre: string | null
  procesoNombre: string | null
  fuenteNombre: string | null
  alcanceCodigo: string | null
  alcanceNombre: string | null
  cantidad: string
  unidadSimbolo: string | null
  fuenteDato: string | null
  estadoRegistro: string
}

function aOpcion(item: OpcionApi, detalle: string): OpcionPapel {
  return { id: String(item.id), nombre: item.nombre ?? item.codigo ?? '', detalle }
}

function aPapel(item: PapelApi): PapelCarbono {
  return {
    id: String(item.id),
    actividadNombre: item.actividadNombre ?? '',
    procesoNombre: item.procesoNombre ?? '',
    fuenteNombre: item.fuenteNombre ?? '',
    alcanceCodigo: item.alcanceCodigo ?? '',
    alcanceNombre: item.alcanceNombre ?? '',
    cantidad: item.cantidad,
    unidadSimbolo: item.unidadSimbolo ?? '',
    fuenteDato: item.fuenteDato ?? '',
    estadoRegistro: item.estadoRegistro,
  }
}

export async function opcionesPapel(organizacionId: string) {
  const respuesta = await api<{ data: OpcionesApi }>(
    `/datos-actividad-carbono/opciones?organizacionId=${organizacionId}`,
  )
  return {
    actividades: respuesta.data.actividades.map((item) =>
      aOpcion(item, item.procesoNombre ?? ''),
    ),
    fuentes: respuesta.data.fuentes.map((item) => aOpcion(item, item.codigo ?? '')),
    alcances: respuesta.data.alcances.map((item) => aOpcion(item, item.codigo ?? '')),
    unidades: respuesta.data.unidades.map((item) => ({
      id: String(item.id),
      nombre: item.simbolo ?? item.nombre ?? '',
      detalle: item.nombre ?? '',
    })),
  }
}

export async function listarPapeles(organizacionId: string, periodoId: string) {
  const respuesta = await api<{ data: PapelApi[] }>(
    `/datos-actividad-carbono?organizacionId=${organizacionId}&periodoId=${periodoId}`,
  )
  return respuesta.data.map(aPapel)
}

export async function crearPapel(datos: {
  actividadId: string
  periodoId: string
  fuenteEmisionId: string
  alcanceId: string
  unidadId: string
  cantidad: string
  fuenteDato: string
}) {
  const respuesta = await api<{ data: PapelApi }>('/datos-actividad-carbono', {
    method: 'POST',
    body: JSON.stringify({
      actividadId: Number(datos.actividadId),
      periodoId: Number(datos.periodoId),
      fuenteEmisionId: Number(datos.fuenteEmisionId),
      alcanceId: Number(datos.alcanceId),
      unidadId: Number(datos.unidadId),
      cantidad: datos.cantidad.trim(),
      fuenteDato: datos.fuenteDato.trim() || null,
    }),
  })
  return aPapel(respuesta.data)
}

export async function rechazarPapel(id: string) {
  const respuesta = await api<{ data: PapelApi }>(`/datos-actividad-carbono/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estadoRegistro: 'RECHAZADO' }),
  })
  return aPapel(respuesta.data)
}
