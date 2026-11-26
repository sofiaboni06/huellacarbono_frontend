import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import PlantillaVista from '../../components/layout/PlantillaVista'
import AsistenteCalculo from './components/AsistenteCalculo'
import CalculoCarbono from './components/CalculoCarbono'
import HistorialCalculos from './components/HistorialCalculos'
import { resolverVistaCalculos } from './vistaCalculos'
import type { VistaCalculos } from './vistaCalculos'
import './Calculos.css'

export type { VistaCalculos }

/** Encabezado propio de cada sección del módulo de cálculos. */
const ENCABEZADOS: Record<VistaCalculos, { titulo: string; subtitulo: string }> = {
  carbono: {
    titulo: 'Calculadora de Huella de Carbono',
    subtitulo: 'Sigue los 4 pasos en orden: elige organización y periodo, registra consumos, calcula y revisa el plan de reducción.',
  },
  hidrica: {
    titulo: 'Calculadora de Huella Hídrica',
    subtitulo: 'Completa los 3 pasos para registrar el consumo hídrico del periodo y obtener el resultado.',
  },
  historial: {
    titulo: 'Historial de cálculos',
    subtitulo: 'Consulta los cálculos guardados por la organización, revisa su desglose y descarga el informe en PDF.',
  },
}

/**
 * Vista de Cálculos: la sub-sección se elige desde el menú desplegable «Cálculo»
 * de la barra lateral, dejando todo el lienzo libre para la vista elegida.
 */
export default function Calculos() {
  const [parametros] = useSearchParams()
  const vista = resolverVistaCalculos(parametros.get('tipo'))

  const encabezado = ENCABEZADOS[vista]

  return (
    <PlantillaVista titulo={`HuellaVerde — ${encabezado.titulo}`} className="cal">
      <div className="cal-panel">
        <PageHeader titulo={encabezado.titulo} subtitulo={encabezado.subtitulo} />

        {vista === 'historial' ? (
          <HistorialCalculos />
        ) : vista === 'carbono' ? (
          <CalculoCarbono />
        ) : (
          <AsistenteCalculo tipo={vista} />
        )}
      </div>
    </PlantillaVista>
  )
}
