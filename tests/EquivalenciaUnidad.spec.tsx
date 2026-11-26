import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import EquivalenciaUnidad from '../src/pages/Calculos/components/EquivalenciaUnidad'
import { formatoDecimal } from '../src/utils/formatoDecimal'
import { ErrorApi } from '../src/services/api'
import type { EquivalenciaUnidad as Equivalencia } from '../src/services/papelesService'

/**
 * El componente no calcula: muestra lo que devuelve el backend
 * (`POST /datos-actividad-carbono/equivalencia`, el mismo servicio de
 * conversión que el motor). Aquí se sustituye ese servicio por respuestas
 * con los valores que el backend devuelve en sus propias pruebas.
 */

const KWH = { id: '252', simbolo: 'kWh' }
const MWH = { id: '253', simbolo: 'MWh' }
const MJ = { id: '249', simbolo: 'MJ' }
const LITRO = { id: '243', simbolo: 'L' }
const KG = { id: '31', simbolo: 'kg' }

/** Respuestas del backend para los pares usados (ver tests/functional/calculo_carbono.spec.ts). */
const RESPUESTAS: Record<string, string> = {
  '1.5|253|252': '1500',
  '2|253|252': '2000',
  '3600|249|252': '1000',
}

function backend() {
  return vi.fn(async (datos: { cantidad: string; unidadOrigenId: string; unidadDestinoId: string }) => {
    const valor = RESPUESTAS[`${datos.cantidad}|${datos.unidadOrigenId}|${datos.unidadDestinoId}`]
    if (!valor) {
      throw new ErrorApi(
        'No se pueden convertir L (Volumen) → kg (Masa) sin datos adicionales: la conversión requiere el parámetro densidad con su unidad',
        422,
      )
    }
    const simbolo = (id: string) => [KWH, MWH, MJ, LITRO, KG].find((u) => u.id === id)!.simbolo
    return {
      cantidad: datos.cantidad,
      valor,
      unidadOrigen: { id: datos.unidadOrigenId, simbolo: simbolo(datos.unidadOrigenId) },
      unidadDestino: { id: datos.unidadDestinoId, simbolo: simbolo(datos.unidadDestinoId) },
    } satisfies Equivalencia
  })
}

afterEach(cleanup)

describe('EquivalenciaUnidad', () => {
  it('muestra la unidad requerida por el factor', () => {
    render(<EquivalenciaUnidad cantidad="" unidadOrigen={null} unidadesFactor={[KWH]} convertir={backend()} />)
    expect(screen.getByText(/Unidad requerida por el factor/).textContent).toContain('kWh')
  })

  it('muestra la equivalencia del backend al elegir una unidad convertible', async () => {
    const convertir = backend()
    render(<EquivalenciaUnidad cantidad="1.5" unidadOrigen={MWH} unidadesFactor={[KWH]} convertir={convertir} />)
    expect(await screen.findByText('1,5 MWh = 1.500 kWh')).toBeTruthy()
    expect(convertir).toHaveBeenCalledWith({ cantidad: '1.5', unidadOrigenId: '253', unidadDestinoId: '252' })
  })

  it('actualiza la equivalencia cuando cambia la cantidad', async () => {
    const convertir = backend()
    const { rerender } = render(
      <EquivalenciaUnidad cantidad="1.5" unidadOrigen={MWH} unidadesFactor={[KWH]} convertir={convertir} />,
    )
    await screen.findByText('1,5 MWh = 1.500 kWh')
    rerender(<EquivalenciaUnidad cantidad="2" unidadOrigen={MWH} unidadesFactor={[KWH]} convertir={convertir} />)
    expect(await screen.findByText('2 MWh = 2.000 kWh')).toBeTruthy()
    expect(screen.queryByText('1,5 MWh = 1.500 kWh')).toBeNull()
  })

  it('actualiza la equivalencia cuando cambia la unidad', async () => {
    const convertir = backend()
    const { rerender } = render(
      <EquivalenciaUnidad cantidad="3600" unidadOrigen={MWH} unidadesFactor={[KWH]} convertir={convertir} />,
    )
    // 3600 MWh no está en las respuestas: se muestra el motivo del backend.
    await screen.findByText(/no disponible/)
    rerender(<EquivalenciaUnidad cantidad="3600" unidadOrigen={MJ} unidadesFactor={[KWH]} convertir={convertir} />)
    // 1 kWh = 3,6 MJ, así que 3600 MJ son 1000 kWh.
    expect(await screen.findByText('3.600 MJ = 1.000 kWh')).toBeTruthy()
  })

  it('no inventa una equivalencia cuando la unidad ya es la del factor', () => {
    const convertir = backend()
    render(<EquivalenciaUnidad cantidad="4000" unidadOrigen={KWH} unidadesFactor={[KWH]} convertir={convertir} />)
    expect(screen.getByText(/ya está en la unidad del factor/)).toBeTruthy()
    expect(screen.queryByText(/Equivalencia para el cálculo/)).toBeNull()
    expect(convertir).not.toHaveBeenCalled()
  })

  it('no muestra equivalencias con cantidades inválidas', () => {
    const convertir = backend()
    render(<EquivalenciaUnidad cantidad="1,5" unidadOrigen={MWH} unidadesFactor={[KWH]} convertir={convertir} />)
    expect(screen.queryByText(/Equivalencia para el cálculo/)).toBeNull()
    expect(convertir).not.toHaveBeenCalled()
  })

  it('explica cuando la conversión no es posible o requiere parámetros', async () => {
    render(<EquivalenciaUnidad cantidad="10" unidadOrigen={LITRO} unidadesFactor={[KG]} convertir={backend()} />)
    const aviso = await screen.findByText(/Conversión a kg no disponible/)
    expect(aviso.textContent).toContain('requiere el parámetro densidad')
    expect(screen.queryByText(/Equivalencia para el cálculo/)).toBeNull()
  })

  it('formatea el texto del backend sin alterar sus decimales', () => {
    expect(formatoDecimal('2.64172052')).toBe('2,64172052')
    expect(formatoDecimal('138888.88888889')).toBe('138.888,88888889')
    expect(formatoDecimal('1500')).toBe('1.500')
  })
})
