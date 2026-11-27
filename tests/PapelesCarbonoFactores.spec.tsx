import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import PapelesCarbono from '../src/pages/Calculos/components/PapelesCarbono'
import type { CoberturaFuenteFecha, FactorDisponible } from '../src/services/calculosService'
import type { OpcionesPapel } from '../src/services/papelesService'

const mocks = vi.hoisted(() => ({
  opcionesPapel: vi.fn(),
  listarPapeles: vi.fn(),
  crearPapel: vi.fn(),
  rechazarPapel: vi.fn(),
  factoresDisponibles: vi.fn(),
  consultarCoberturaFactores: vi.fn(),
  listarUnidades: vi.fn(),
}))

vi.mock('../src/services/papelesService', async (original) => ({
  ...(await original<typeof import('../src/services/papelesService')>()),
  opcionesPapel: mocks.opcionesPapel,
  listarPapeles: mocks.listarPapeles,
  crearPapel: mocks.crearPapel,
  rechazarPapel: mocks.rechazarPapel,
}))
vi.mock('../src/services/calculosService', async (original) => ({
  ...(await original<typeof import('../src/services/calculosService')>()),
  factoresDisponibles: mocks.factoresDisponibles,
  consultarCoberturaFactores: mocks.consultarCoberturaFactores,
}))
vi.mock('../src/services/unidadesMedidaService', () => ({ listarUnidades: mocks.listarUnidades }))
vi.mock('../src/pages/Calculos/components/EquivalenciaUnidad', () => ({ default: () => null }))

const OPCIONES: OpcionesPapel = {
  alcances: [{ id: '2', nombre: 'Alcance 2', detalle: '' }],
  actividadesEmision: [
    { id: '10', codigo: 'B1', nombre: 'Electricidad', alcanceId: '2', alcanceCodigo: 'ALCANCE-2' },
  ],
  subcategorias: [],
  fuentes: [
    {
      id: '1',
      codigo: 'B1-01',
      nombre: 'Electricidad SIN',
      requisitos: {
        estado: 'EJECUTABLE',
        metodologia: 'Location-based: energía del SIN × factor de la red (GHG Protocol Scope 2)',
        datos: 'Electricidad consumida del SIN',
        unidades: 'Energía (kWh, MWh)',
        factor: 'Resolución UPME 000085 de 2026, art. 1 literal B: 0,220 t CO2e/MWh (año 2024)',
        pendiente: 'D-B1-2: vigencia del factor para años distintos de 2024',
      },
      seleccionCombustible: null,
      camposParametros: [],
    },
  ],
  vinculos: [{ actividadEmisionId: '10', fuenteEmisionId: '1', subcategoriaEmisionId: '' }],
  actividades: [{ id: '5', nombre: 'Sede principal', detalle: '' }],
  unidades: [
    { id: '252', nombre: 'kWh', detalle: '' },
    { id: '253', nombre: 'MWh', detalle: '' },
  ],
}

/** Respuesta real de GET /factores-emision para B1-01 (factor 23, UPME 2024). */
const UPME_2024: FactorDisponible = {
  id: '23',
  unidadEntradaId: '252',
  unidadEntradaSimbolo: 'kWh',
  unidadSalidaSimbolo: 't',
  valor: '0.000220000000',
  gas: 'CO2E',
  aprobado: true,
  variante: 'ELECTRICIDAD_SIN',
  fechaInicioVigencia: '2024-01-01',
  fechaFinVigencia: '2024-12-31',
  anioAplicacion: 2024,
  estadoAprobacion: 'APROBADO',
  tipoVigencia: null,
}

function cobertura(cambios: Partial<CoberturaFuenteFecha>): CoberturaFuenteFecha[] {
  return [
    {
      fuenteCodigo: 'B1-01',
      estado: 'SIN_FACTOR',
      factorDisponible: true,
      aprobadosVigentes: 0,
      aprobadosNoVigentes: 1,
      pendientes: 0,
      rechazados: 0,
      unidadesCompatibles: false,
      compatibilidadDato: 'NO_EVALUADA',
      ...cambios,
    },
  ]
}

const VERSION = 'GHG Protocol - Estándar Corporativo Ed. revisada 2004'

async function elegirB101(fechaInicio: string, fechaFin: string) {
  render(
    <PapelesCarbono
      organizacionId="2"
      periodoId="260"
      fechaInicio={fechaInicio}
      fechaFin={fechaFin}
      abierto
      versionId="21"
      versionNombre={VERSION}
    />,
  )
  fireEvent.click(await screen.findByRole('radio', { name: /Alcance 2/ }))
  fireEvent.change(screen.getByLabelText(/Actividad de emisión/i), { target: { value: '10' } })
  fireEvent.change(screen.getByLabelText(/Fuente de emisión/i), { target: { value: '1' } })
}

beforeEach(() => {
  mocks.opcionesPapel.mockResolvedValue(OPCIONES)
  mocks.listarPapeles.mockResolvedValue([])
  mocks.crearPapel.mockResolvedValue(undefined)
  mocks.listarUnidades.mockResolvedValue([
    { id: 252, magnitude: 'Energía' },
    { id: 253, magnitude: 'Energía' },
  ])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Formulario de datos de actividad: factores por año de inventario', () => {
  it('2026: identifica el factor aprobado fuera de vigencia y permite guardar el dato', async () => {
    mocks.factoresDisponibles.mockResolvedValue([UPME_2024])
    mocks.consultarCoberturaFactores.mockResolvedValue(cobertura({}))
    await elegirB101('2026-02-11', '2026-08-11')

    const aviso = await screen.findByText(/No hay factor para este periodo/)
    expect(aviso.textContent).toMatch(/último oficial de 2024/)
    expect(aviso.closest('[data-caso-factores]')?.getAttribute('data-caso-factores')).toBe(
      'APROBADO_FUERA_DE_VIGENCIA',
    )
    expect(screen.getByRole('radio', { name: /Usar este valor en este registro/ })).toBeTruthy()
    expect(screen.queryByText(/ninguno está aprobado/)).toBeNull()
    expect(screen.queryByText(/Hay factores aprobados registrados, pero sus vigencias no cubren/)).toBeNull()
    // La cobertura se consulta con la organización (región y sector como el motor).
    expect(mocks.consultarCoberturaFactores).toHaveBeenCalledWith('21', '2026-02-11', '2026-08-11', '2')

    // Guardar NO depende de que exista un factor vigente.
    fireEvent.change(screen.getByLabelText(/Actividad o proceso de la organización/i), {
      target: { value: '5' },
    })
    fireEvent.change(screen.getByLabelText(/Cantidad del dato de actividad/i), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText(/^Unidad/i), { target: { value: '253' } })
    fireEvent.click(screen.getByRole('button', { name: /Registrar dato/ }))
    await waitFor(() => expect(mocks.crearPapel).toHaveBeenCalledTimes(1))
    expect(mocks.crearPapel.mock.calls[0][0]).toMatchObject({
      periodoId: '260',
      fuenteEmisionId: '1',
      cantidad: '100',
      unidadId: '253',
    })
  })

  it('coloca la unidad del factor y permite cambiarla', async () => {
    mocks.factoresDisponibles.mockResolvedValue([UPME_2024])
    mocks.consultarCoberturaFactores.mockResolvedValue(cobertura({}))
    await elegirB101('2026-02-11', '2026-08-11')

    await waitFor(() => {
      expect((screen.getByLabelText(/^Unidad/i) as HTMLSelectElement).value).toBe('252')
    })
    expect(screen.getByText('kWh', { selector: '.cal-unidad' }).textContent).toBe('kWh')
    expect(screen.getByText(/La coloca el factor: 0\.00022 t CO2e por kWh/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/Actividad o proceso de la organización/i), {
      target: { value: '5' },
    })
    fireEvent.change(screen.getByLabelText(/Cantidad del dato de actividad/i), { target: { value: '2500' } })
    fireEvent.click(screen.getByRole('button', { name: /Registrar dato/ }))
    await waitFor(() => expect(mocks.crearPapel).toHaveBeenCalledTimes(1))
    expect(mocks.crearPapel.mock.calls[0][0]).toMatchObject({ cantidad: '2500', unidadId: '252' })
  })

  it('2024: el mismo factor aparece como aprobado y vigente', async () => {
    mocks.factoresDisponibles.mockResolvedValue([UPME_2024])
    mocks.consultarCoberturaFactores.mockResolvedValue(
      cobertura({ estado: 'CON_FACTOR_APROBADO', aprobadosVigentes: 1, aprobadosNoVigentes: 0, unidadesCompatibles: true }),
    )
    await elegirB101('2024-01-01', '2024-12-31')
    expect(await screen.findByText(/1 factor\(es\) aprobado\(s\) en/)).toBeTruthy()
    expect(document.querySelector('[data-caso-factores]')).toBeNull()
  })

  it('2025: el factor de 2024 no se extiende al año siguiente', async () => {
    mocks.factoresDisponibles.mockResolvedValue([UPME_2024])
    mocks.consultarCoberturaFactores.mockResolvedValue(cobertura({}))
    await elegirB101('2025-01-01', '2025-12-31')
    expect(await screen.findByText(/último oficial de 2024/)).toBeTruthy()
    expect(document.querySelector('[data-caso-factores]')?.getAttribute('data-caso-factores')).toBe(
      'APROBADO_FUERA_DE_VIGENCIA',
    )
  })

  it('pendiente, rechazado y sin factor se distinguen', async () => {
    const pendiente2026 = {
      ...UPME_2024,
      id: '99',
      aprobado: false,
      estadoAprobacion: 'PENDIENTE',
      fechaInicioVigencia: '2026-01-01',
      fechaFinVigencia: '2026-12-31',
      anioAplicacion: 2026,
    }
    mocks.consultarCoberturaFactores.mockResolvedValue(
      cobertura({ aprobadosNoVigentes: 0, pendientes: 1 }),
    )
    mocks.factoresDisponibles.mockResolvedValue([pendiente2026])
    await elegirB101('2026-02-11', '2026-08-11')
    expect(await screen.findByText(/1 factor\(es\) en .* pendiente\(s\) de aprobación y ninguno aprobado/)).toBeTruthy()
    cleanup()

    mocks.factoresDisponibles.mockResolvedValue([{ ...UPME_2024, aprobado: false, estadoAprobacion: 'RECHAZADO' }])
    mocks.consultarCoberturaFactores.mockResolvedValue(cobertura({ aprobadosNoVigentes: 0, rechazados: 1 }))
    await elegirB101('2024-01-01', '2024-12-31')
    expect(await screen.findByText(/fueron rechazados; hace falta registrar y aprobar uno nuevo\. El dato/)).toBeTruthy()
    cleanup()

    mocks.factoresDisponibles.mockResolvedValue([])
    mocks.consultarCoberturaFactores.mockResolvedValue(
      cobertura({ factorDisponible: false, aprobadosNoVigentes: 0 }),
    )
    await elegirB101('2026-02-11', '2026-08-11')
    expect(await screen.findByText(/No hay factores registrados para esta fuente en/)).toBeTruthy()
  })
})
