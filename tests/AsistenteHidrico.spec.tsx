import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import AsistenteCalculo from '../src/pages/Calculos/components/AsistenteCalculo'

/**
 * Pruebas del asistente hídrico renderizado de verdad (jsdom):
 * ejecutan `validarPaso1`, `validarPaso2` y `calcularHuella` a través de la interfaz,
 * sin simularlas ni reimplementarlas.
 */

const CAMPOS_HIDRICOS = [
  'Agua potable',
  'Agua para riego',
  'Agua industrial',
  'Agua de refrigeración',
  'Agua para saneamiento',
  'Agua de lavado',
] as const

afterEach(cleanup)

function renderizar() {
  return render(<AsistenteCalculo tipo="hidrica" />)
}

function pulsar(nombre: RegExp | string) {
  fireEvent.click(screen.getByRole('button', { name: nombre }))
}

function completarPaso1() {
  fireEvent.change(screen.getByLabelText('Organización'), { target: { value: 'SENA' } })
  fireEvent.change(screen.getByLabelText('Periodo de medición'), { target: { value: '2026-I' } })
  fireEvent.change(screen.getByLabelText('Sede'), { target: { value: 'Sede Principal' } })
  pulsar(/Siguiente/)
}

function escribirConsumos(valores: Partial<Record<(typeof CAMPOS_HIDRICOS)[number], string>>) {
  for (const etiqueta of CAMPOS_HIDRICOS) {
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valores[etiqueta] ?? '0' } })
  }
}

function pasoActivo() {
  return document.querySelector('.cal-paso.activo .cal-paso-etiqueta')?.textContent
}

describe('Asistente de huella hídrica', () => {
  it('conserva sus tres pasos', () => {
    renderizar()
    const pasos = within(screen.getByRole('list', { name: 'Progreso del cálculo' })).getAllByRole('listitem')
    expect(pasos.map((paso) => paso.querySelector('.cal-paso-etiqueta')?.textContent)).toEqual([
      'Datos básicos',
      'Consumo',
      'Resultados',
    ])
    expect(pasoActivo()).toBe('Datos básicos')
  })

  it('paso 1: exige organización, periodo y sede', () => {
    renderizar()
    pulsar(/Siguiente/)
    expect(screen.getByText('Selecciona una organización.')).toBeTruthy()
    expect(screen.getByText('Selecciona un periodo de medición.')).toBeTruthy()
    expect(screen.getByText('Selecciona una sede.')).toBeTruthy()
    expect(pasoActivo()).toBe('Datos básicos')
  })

  it('paso 2: conserva sus seis campos hídricos en m³', () => {
    renderizar()
    completarPaso1()
    expect(pasoActivo()).toBe('Consumo')
    const entradas = screen.getAllByRole('spinbutton')
    expect(entradas).toHaveLength(6)
    for (const etiqueta of CAMPOS_HIDRICOS) {
      const entrada = screen.getByLabelText(etiqueta)
      expect(entrada.parentElement?.querySelector('.cal-unidad')?.textContent).toBe('m³')
    }
    // Ningún campo de carbono en el asistente.
    expect(screen.queryByText(/kWh|tCO₂e|Electricidad|diésel|Residuos/)).toBeNull()
  })

  it('paso 2: los campos vacíos son obligatorios', () => {
    renderizar()
    completarPaso1()
    pulsar(/Calcular huella/)
    expect(screen.getAllByText('Campo obligatorio.')).toHaveLength(6)
    expect(pasoActivo()).toBe('Consumo')
  })

  it('paso 2: rechaza valores negativos', () => {
    renderizar()
    completarPaso1()
    escribirConsumos({ 'Agua potable': '100', 'Agua industrial': '-5' })
    pulsar(/Calcular huella/)
    const errores = screen.getAllByText('El valor no puede ser negativo.')
    expect(errores).toHaveLength(1)
    expect(screen.getByLabelText('Agua industrial').getAttribute('aria-invalid')).toBe('true')
    expect(pasoActivo()).toBe('Consumo')
  })

  it('paso 2: rechaza un consumo total igual a cero', () => {
    renderizar()
    completarPaso1()
    escribirConsumos({})
    pulsar(/Calcular huella/)
    expect(screen.getByText('Registra al menos un consumo mayor que cero.')).toBeTruthy()
    expect(screen.getByLabelText('Agua potable').getAttribute('aria-invalid')).toBe('true')
    expect(pasoActivo()).toBe('Consumo')
  })

  it('paso 2 → 3: con consumos positivos válidos calcula 100 + 50 m³ = 177 m³', () => {
    renderizar()
    completarPaso1()
    escribirConsumos({ 'Agua potable': '100', 'Agua para riego': '50' })
    pulsar(/Calcular huella/)

    expect(pasoActivo()).toBe('Resultados')
    expect(screen.queryByText('Campo obligatorio.')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Huella Hídrica Total' })).toBeTruthy()
    expect(document.querySelector('.cal-resultado-valor')?.textContent).toBe('177 m³')

    const desglose = document.querySelector('.cal-indicadores') as HTMLElement
    expect(within(desglose).getByText('2026-I')).toBeTruthy()
    expect(within(desglose).getByText('Sede Principal')).toBeTruthy()
    expect(within(desglose).getByText('15 m³')).toBeTruthy()
    expect(screen.queryByText(/tCO₂e/)).toBeNull()
  })

  it('permite volver al paso anterior y reiniciar el formulario', () => {
    renderizar()
    completarPaso1()
    escribirConsumos({ 'Agua potable': '100', 'Agua para riego': '50' })
    pulsar(/Calcular huella/)
    pulsar(/Anterior/)
    expect(pasoActivo()).toBe('Consumo')
    expect((screen.getByLabelText('Agua potable') as HTMLInputElement).value).toBe('100')
    pulsar(/Calcular huella/)
    pulsar(/Reiniciar formulario/)
    expect(pasoActivo()).toBe('Datos básicos')
    expect((screen.getByLabelText('Organización') as HTMLSelectElement).value).toBe('')
  })
})
