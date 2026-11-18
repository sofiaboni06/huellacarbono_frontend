import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ClipboardCheck, Cloud, Droplets, Leaf } from 'lucide-react'
import SidebarInicio from './components/SidebarInicio'
import BarraSuperior from './components/BarraSuperior'
import Bienvenida from './components/Bienvenida'
import TarjetaIndicador from './components/TarjetaIndicador'
import PanelEvolucion from './components/PanelEvolucion'
import PanelDistribucion from './components/PanelDistribucion'
import AccesosRapidos from './components/AccesosRapidos'
import ActividadReciente from './components/ActividadReciente'
import hojaIzquierda from '../../assets/images/leaf-bl.png'
import hojaDerecha from '../../assets/images/leaf-tr.png'
import '../../styles/variables.css'
import './Inicio.css'

/** Datos de los indicadores del panel (valores de demostración del proyecto). */
interface IndicadorPanel {
  id: string
  titulo: string
  valor: string
  unidad?: string
  variacion?: string
  comparacion?: string
  tonoIcono: 'azul' | 'verde' | 'morado'
  colorGrafica: string
  icono: ReactNode
  serie: number[]
  grafica?: 'linea' | 'barras'
}

const INDICADORES: IndicadorPanel[] = [
  {
    id: 'hidrica',
    titulo: 'Huella Hídrica Total',
    valor: '1.245',
    unidad: 'm³',
    variacion: '12%',
    comparacion: 'vs periodo anterior',
    tonoIcono: 'azul',
    colorGrafica: '#3b82f6',
    icono: <Droplets size={19} strokeWidth={2.2} aria-hidden="true" />,
    serie: [38, 54, 46, 63, 55, 72, 64, 83, 75, 94],
    grafica: 'linea',
  },
  {
    id: 'carbono',
    titulo: 'Huella de Carbono Total',
    valor: '892',
    unidad: 'tCO₂e',
    variacion: '8%',
    comparacion: 'vs periodo anterior',
    tonoIcono: 'verde',
    colorGrafica: '#42d879',
    icono: <Cloud size={19} strokeWidth={2.2} aria-hidden="true" />,
    serie: [46, 42, 56, 50, 65, 58, 71, 66, 79, 86],
    grafica: 'linea',
  },
  {
    id: 'reduccion',
    titulo: 'Reducción Lograda',
    valor: '18',
    unidad: '%',
    tonoIcono: 'verde',
    colorGrafica: '#42d879',
    icono: <Leaf size={19} strokeWidth={2.2} aria-hidden="true" />,
    serie: [30, 37, 34, 46, 51, 48, 61, 67, 73, 82],
    grafica: 'barras',
  },
  {
    id: 'reportes',
    titulo: 'Reportes Generados',
    valor: '24',
    variacion: '5%',
    comparacion: 'vs periodo anterior',
    tonoIcono: 'morado',
    colorGrafica: '#a855f7',
    icono: <ClipboardCheck size={19} strokeWidth={2.2} aria-hidden="true" />,
    serie: [12, 19, 16, 25, 22, 31, 28, 37, 34, 45],
    grafica: 'linea',
  },
]

function InicioContenido() {
  const [aviso, setAviso] = useState('')
  const [lateralAbierto, setLateralAbierto] = useState(false)

  useEffect(() => {
    if (!aviso) return
    const temporizador = window.setTimeout(() => setAviso(''), 4000)
    return () => window.clearTimeout(temporizador)
  }, [aviso])

  const avisar = useCallback((mensaje: string) => setAviso(mensaje), [])

  const cerrarLateral = useCallback(() => setLateralAbierto(false), [])

  useEffect(() => {
    const tituloAnterior = document.title
    document.title = 'HuellaVerde — Inicio'
    return () => {
      document.title = tituloAnterior
    }
  }, [])

  return (
    <div className="hv-inicio">
      {/* Hojas decorativas del entorno (recursos originales de la maqueta) */}
      <div className="ini-hojas" aria-hidden="true">
        <img className="ini-hoja ini-hoja--izq" src={hojaIzquierda} alt="" />
        <img className="ini-hoja ini-hoja--der" src={hojaDerecha} alt="" />
      </div>

      <SidebarInicio abierto={lateralAbierto} onCerrar={cerrarLateral} />

      {lateralAbierto ? (
        <button
          type="button"
          className="ini-velo"
          onClick={cerrarLateral}
          aria-label="Cerrar menú lateral"
        />
      ) : null}

      <div className="ini-zona">
        <BarraSuperior onAlternarLateral={() => setLateralAbierto((v) => !v)} />

        <main className="ini-contenido">
          <Bienvenida />

          <section
            className="ini-rejilla ini-rejilla--indicadores"
            aria-label="Indicadores principales"
          >
            {INDICADORES.map((item) => (
              <TarjetaIndicador key={item.id} {...item} />
            ))}
          </section>

          <section className="ini-rejilla ini-rejilla--inferior" aria-label="Paneles del dashboard">
            <PanelEvolucion />
            <PanelDistribucion />
            <ActividadReciente onAviso={avisar} />
          </section>

          <AccesosRapidos />
        </main>
      </div>

      {aviso ? (
        <div className="ini-aviso" role="status" aria-live="polite">
          {aviso}
        </div>
      ) : null}
    </div>
  )
}

/** Pantalla de inicio (dashboard) de HuellaVerde — datos de demostración. */
export default function Inicio() {
  return <InicioContenido />
}
