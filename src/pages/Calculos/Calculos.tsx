import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import PlantillaVista from '../../components/layout/PlantillaVista'
import SidebarCalculos from './components/SidebarCalculos'
import type { VistaCalculos } from './components/SidebarCalculos'
import AsistenteCalculo from './components/AsistenteCalculo'
import HistorialCalculos from './components/HistorialCalculos'
import './Calculos.css'

/** Encabezado propio de cada sección del módulo de cálculos. */
const ENCABEZADOS: Record<VistaCalculos, { titulo: string; subtitulo: string }> = {
  hidrica: {
    titulo: 'Cálculo de Huella Hídrica',
    subtitulo: 'Registra los datos y obtén tu resultado.',
  },
  carbono: {
    titulo: 'Cálculo de Huella de Carbono',
    subtitulo: 'Registra los datos y obtén tu resultado.',
  },
  historial: {
    titulo: 'Historial de cálculos',
    subtitulo: 'Consulta los cálculos registrados por la organización.',
  },
}

/**
 * Vista de Cálculos: menú lateral + asistente de tres pasos
 * (datos básicos → consumo → resultados).
 */
export default function Calculos() {
  const [parametros] = useSearchParams()
  const [vista, setVista] = useState<VistaCalculos>('hidrica')

  // Permite llegar desde los accesos rápidos con /calculos?tipo=hidrica|carbono
  useEffect(() => {
    const tipo = parametros.get('tipo')
    if (tipo === 'hidrica' || tipo === 'carbono') setVista(tipo)
  }, [parametros])

  const encabezado = ENCABEZADOS[vista]

  return (
    <PlantillaVista titulo="HuellaVerde — Cálculos" className="cal">
      <div className="cal-plantilla">
        <SidebarCalculos vista={vista} onCambiar={setVista} />

        <div className="cal-panel">
          <PageHeader titulo={encabezado.titulo} subtitulo={encabezado.subtitulo} />

          {vista === 'historial' ? (
            <HistorialCalculos />
          ) : (
            <AsistenteCalculo tipo={vista} />
          )}
        </div>
      </div>
    </PlantillaVista>
  )
}
