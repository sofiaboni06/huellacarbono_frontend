import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ClipboardCheck, Cloud, Droplets, Leaf } from 'lucide-react'
import NavbarInicio from './components/NavbarInicio'
import Bienvenida from './components/Bienvenida'
import TarjetaIndicador from './components/TarjetaIndicador'
import AccesosRapidos from './components/AccesosRapidos'
import ActividadReciente from './components/ActividadReciente'
import hojaIzquierda from '../../assets/images/leaf-bl.png'
import hojaDerecha from '../../assets/images/leaf-tr.png'
import '../../styles/variables.css'
import './Inicio.css'

/** Datos demostrativos de los indicadores del panel. */
interface IndicadorDemo {
  id: string
  titulo: string
  valor: string
  indicador?: string
  tonoIcono: 'azul' | 'verde'
  colorGrafica: string
  icono: ReactNode
  serie: number[]
  soloIcono?: boolean
}

const INDICADORES: IndicadorDemo[] = [
  {
    id: 'hidrica',
    titulo: 'Huella Hídrica Total',
    valor: '1.245 m³',
    indicador: '12%',
    tonoIcono: 'azul',
    colorGrafica: '#3b82f6',
    icono: <Droplets size={20} strokeWidth={2.2} aria-hidden="true" />,
    serie: [38, 54, 46, 63, 55, 72, 64, 83, 75, 94],
  },
  {
    id: 'carbono',
    titulo: 'Huella de Carbono Total',
    valor: '892 tCO₂e',
    indicador: '8%',
    tonoIcono: 'verde',
    colorGrafica: '#22c55e',
    icono: <Cloud size={20} strokeWidth={2.2} aria-hidden="true" />,
    serie: [46, 42, 56, 50, 65, 58, 71, 66, 79, 86],
  },
  {
    id: 'reduccion',
    titulo: 'Reducción lograda',
    valor: '18%',
    tonoIcono: 'verde',
    colorGrafica: '#22c55e',
    icono: <Leaf size={20} strokeWidth={2.2} aria-hidden="true" />,
    serie: [30, 37, 34, 46, 51, 48, 61, 67, 73, 82],
    soloIcono: true,
  },
  {
    id: 'reportes',
    titulo: 'Reportes generados',
    valor: '24',
    indicador: '5%',
    tonoIcono: 'verde',
    colorGrafica: '#a855f7',
    icono: <ClipboardCheck size={20} strokeWidth={2.2} aria-hidden="true" />,
    serie: [12, 19, 16, 25, 22, 31, 28, 37, 34, 45],
  },
]

function InicioContenido() {
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!aviso) return
    const temporizador = window.setTimeout(() => setAviso(''), 4000)
    return () => window.clearTimeout(temporizador)
  }, [aviso])

  const avisar = useCallback((mensaje: string) => setAviso(mensaje), [])

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

      <NavbarInicio />

      <main className="ini-contenido">
        <Bienvenida />

        <section className="ini-rejilla ini-rejilla--indicadores" aria-label="Indicadores principales">
          {INDICADORES.map((item) => (
            <TarjetaIndicador key={item.id} {...item} />
          ))}
        </section>

        <section className="ini-rejilla ini-rejilla--inferior">
          <AccesosRapidos />
          <ActividadReciente onAviso={avisar} />
        </section>
      </main>

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
