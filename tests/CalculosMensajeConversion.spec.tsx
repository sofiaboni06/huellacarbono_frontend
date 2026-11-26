import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { api, ErrorApi } from '../src/services/api'
import {
  mensajeUsuarioCalculo,
  obtenerCalculoCarbono,
  type LineaCalculo,
} from '../src/services/calculosService'
import { TablaTrazabilidad } from '../src/pages/Calculos/components/ConsolidacionHuella'
import { conversionPersistida, type PapelCarbono } from '../src/services/papelesService'

const { listarUnidadesMock } = vi.hoisted(() => ({ listarUnidadesMock: vi.fn() }))
vi.mock('../src/services/unidadesMedidaService', () => ({ listarUnidades: listarUnidadesMock }))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  sessionStorage.clear()
})

function errorConRequisito(requisito: string, motivo: string) {
  return new ErrorApi('mensaje técnico que no debe verse', 422, {}, {
    code: 'E_SIN_DATOS_CALCULABLES',
    diagnostico: {
      datosRecuperados: 1,
      calculados: 0,
      omitidos: 1,
      causas: [],
      detalle: [{ datoId: 3, requisito, motivo }],
    },
  })
}

describe('Mensajes seguros de cálculo', () => {
  it('diferencia ausencia, pendiente, vigencia vencida y datos incompletos', () => {
    expect(mensajeUsuarioCalculo(errorConRequisito('FACTOR_NO_DISPONIBLE', 'sin registro')))
      .toMatch(/No hay un factor de emisión aprobado y aplicable/)
    expect(mensajeUsuarioCalculo(errorConRequisito('FACTOR_NO_APROBADO', 'pendiente')))
      .toMatch(/pendiente de aprobación/)
    expect(mensajeUsuarioCalculo(errorConRequisito('FACTOR_NO_DISPONIBLE', 'fuera de vigencia')))
      .toMatch(/no tiene vigencia/)
    expect(mensajeUsuarioCalculo(errorConRequisito('DATOS_FALTANTES', 'faltan parámetros')))
      .toMatch(/Faltan datos de actividad/)
  })

  it('diferencia conexión y error inesperado sin exponer el detalle técnico', () => {
    const errorRed = new ErrorApi('falló fetch', 0, {}, null, new TypeError('network trace'))
    const red = mensajeUsuarioCalculo(errorRed)
    expect(red).toMatch(/comunicarse con el servicio/)
    expect(red).not.toMatch(/fetch|network trace|backend/i)
    const inesperado = mensajeUsuarioCalculo(new Error('SQL internal trace'))
    expect(inesperado).toMatch(/problema inesperado/)
    expect(inesperado).not.toMatch(/SQL|internal trace/)
  })

  it('retiene la excepción de transporte para diagnóstico cuando falla fetch', async () => {
    const causa = new TypeError('socket diagnostic detail')
    const fetchOriginal = globalThis.fetch
    globalThis.fetch = vi.fn().mockRejectedValue(causa)
    try {
      await api('/calculos-carbono')
      expect.fail('la solicitud debía fallar')
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorApi)
      expect(error).toMatchObject({ status: 0, causaTecnica: causa })
      expect(mensajeUsuarioCalculo(error)).not.toContain('socket diagnostic detail')
    } finally {
      globalThis.fetch = fetchOriginal
    }
  })

  it('mantiene el diagnóstico técnico en ErrorApi para soporte, separado del texto visible', () => {
    const error = errorConRequisito('FACTOR_NO_APROBADO', 'id_factor_emision=4 SQL')
    expect(mensajeUsuarioCalculo(error)).not.toMatch(/id_factor|SQL|E_SIN_DATOS/)
    expect(error.cuerpo).toMatchObject({ code: 'E_SIN_DATOS_CALCULABLES' })
  })
})

const linea = (id: number, alcance: string, cantidad: string, convertida: string): LineaCalculo => ({
  id: String(id),
  datoActividadId: String(id + 100),
  fechaDato: '2026-04-15',
  unidadOriginalId: '10',
  unidadFactorId: '20',
  actividadNombre: `Actividad ${id}`,
  procesoNombre: 'Proceso',
  alcanceCodigo: alcance,
  alcanceNombre: `Alcance ${alcance}`,
  fuenteNombre: 'Fuente',
  valorCo2e: '12',
  unidad: 'kg CO₂e',
  actividadEmisionCodigo: alcance,
  actividadEmisionNombre: 'Actividad de emisión',
  subcategoriaEmisionCodigo: '',
  subcategoriaEmisionNombre: '',
  gasCalculado: 'CO2E',
  factorCodigo: 'FE-1',
  factorValor: '0.2',
  factorFuente: 'Fuente documentada',
  cantidadOriginal: cantidad,
  cantidadConvertida: convertida,
  fuenteCodigo: 'F-1',
  gasEspecifico: '',
  cantidadEmision: '12',
  valorGwp: '',
  gwpVersion: '',
  baseFactor: 'CO2E',
  gwpBaseFactor: '',
  metodologia: 'GHG Protocol',
  factorAnioAplicacion: '2026',
  factorOrigen: 'FIXTURE',
})

describe('Trazabilidad de conversiones', () => {
  it('solo devuelve conversiones persistidas que coinciden en cantidad, unidad y fecha', () => {
    const calculo = {
      id: '7',
      periodoId: '2',
      fechaCalculo: '2026-04-16T12:00:00Z',
      lineas: [linea(9, 'A1', '1.5', '1500')],
    } as unknown as import('../src/services/calculosService').CalculoCarbono
    const papel = {
      id: '109',
      cantidad: '1.5',
      unidadId: '10',
      unidadSimbolo: 'MWh',
      fechaDato: '2026-04-15',
    } as PapelCarbono
    const conversion = conversionPersistida(papel, calculo, [
      { id: '20', nombre: 'kWh', detalle: '' },
    ])
    expect(conversion).toMatchObject({
      cantidadOriginal: '1.5',
      unidadOriginal: 'MWh',
      cantidadConvertida: '1500',
      unidadDestino: 'kWh',
      requerida: true,
    })
    expect(papel.cantidad).toBe('1.5')
    expect(conversionPersistida({ ...papel, fechaDato: '2026-04-16' }, calculo, [
      { id: '20', nombre: 'kWh', detalle: '' },
    ])).toBeNull()
    expect(conversionPersistida(papel, null, [])).toBeNull()
  })

  it('presenta original y conversión realmente usada en los tres alcances', async () => {
    listarUnidadesMock.mockResolvedValue([
      { id: 10, symbol: 'MWh' },
      { id: 20, symbol: 'kWh' },
    ])
    render(<TablaTrazabilidad lineas={[
      linea(1, 'A1', '1.5', '1500'),
      linea(2, 'A2', '2', '2000'),
      linea(3, 'A3', '0.5', '500'),
    ]} />)

    await screen.findByText('1.5 MWh')
    expect(screen.getByText('1500 kWh')).toBeTruthy()
    expect(screen.getByText('2 MWh')).toBeTruthy()
    expect(screen.getByText('2000 kWh')).toBeTruthy()
    expect(screen.getByText('0.5 MWh')).toBeTruthy()
    expect(screen.getByText('500 kWh')).toBeTruthy()
    expect(screen.getAllByText(/Alcance A[123]/)).toHaveLength(3)
  })

  it('indica cuando la unidad no puede resolverse y no inventa una conversión ausente', async () => {
    listarUnidadesMock.mockResolvedValue([])
    render(<TablaTrazabilidad lineas={[linea(4, 'A2', '10', '')]} />)
    await screen.findByText('10 Unidad no disponible')
    expect(screen.getByText('Conversión no registrada')).toBeTruthy()
  })

  it('conserva cantidad original, cantidad convertida y unidades al volver a consultar el cálculo', async () => {
    sessionStorage.setItem('hv:token', 'fixture-token')
    const fetchOriginal = globalThis.fetch
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: {
        id: 7,
        organizacionId: 1,
        periodoId: 2,
        versionId: 3,
        estado: 'CALCULADO',
        totalCo2e: '300',
        lineas: [{
          id: 9,
          datoActividadId: 109,
          fechaDato: '2026-04-15',
          unidadOriginalId: 10,
          unidadFactorId: 20,
          cantidadOriginal: '1.5',
          cantidadConvertida: '1500',
          valorCo2e: '300',
        }],
      } }),
    })) as unknown as typeof fetch
    try {
      const calculo = await obtenerCalculoCarbono('7')
      expect(calculo.lineas[0]).toMatchObject({
        datoActividadId: '109',
        unidadOriginalId: '10',
        unidadFactorId: '20',
        cantidadOriginal: '1.5',
        cantidadConvertida: '1500',
      })
    } finally {
      globalThis.fetch = fetchOriginal
    }
  })
})
