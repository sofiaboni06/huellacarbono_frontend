import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import SidebarInicio from '../../pages/Inicio/components/SidebarInicio'
import BarraSuperior from '../../pages/Inicio/components/BarraSuperior'
import hojaIzquierda from '../../assets/images/leaf-bl.png'
import hojaDerecha from '../../assets/images/leaf-tr.png'
import { usePreferencias } from '../../context/PreferenciasContext'
import '../../styles/variables.css'
import './PlantillaVista.css'

type AvisoFn = (mensaje: string) => void

interface AvisoValor {
  avisar: AvisoFn
  mensaje: string
}

/**
 * Aviso flotante compartido por toda la aplicación.
 *
 * El proveedor se monta en `App.tsx` (no dentro de `PlantillaVista`) para que
 * cualquier componente — incluidos los encabezados de las páginas, que se
 * renderizan *antes* de la plantilla — pueda emitir un aviso real.
 */
const AvisoContext = createContext<AvisoValor>({
  avisar: () => undefined,
  mensaje: '',
})

/** Emite el aviso flotante compartido. Funciona desde cualquier componente. */
export function useAviso(): AvisoFn {
  return useContext(AvisoContext).avisar
}

/** Mensaje visible en este momento; lo consume `PlantillaVista` para pintarlo. */
export function useAvisoActual(): string {
  return useContext(AvisoContext).mensaje
}

/** Proveedor global del aviso (se monta una sola vez, en `App.tsx`). */
export function AvisoProvider({ children }: { children: ReactNode }) {
  const [mensaje, setMensaje] = useState('')

  const avisar = useCallback<AvisoFn>((texto) => setMensaje(texto), [])

  useEffect(() => {
    if (!mensaje) return
    const temporizador = window.setTimeout(() => setMensaje(''), 4200)
    return () => window.clearTimeout(temporizador)
  }, [mensaje])

  const valor = useMemo<AvisoValor>(() => ({ avisar, mensaje }), [avisar, mensaje])

  return <AvisoContext.Provider value={valor}>{children}</AvisoContext.Provider>
}

interface PlantillaVistaProps {
  /** Título del documento durante la estancia en la vista. */
  titulo: string
  /** Clase adicional de la raíz (identifica la vista: cal-, rep-, prf-…). */
  className?: string
  children: ReactNode
}

/**
 * Armazón común de todas las vistas fuera del Login y del Dashboard:
 * comparte el mismo menú lateral y la misma barra superior que el Dashboard
 * (`SidebarInicio` + `BarraSuperior`), con fondo oscuro, hojas decorativas y
 * aviso flotante. Ningún módulo mantiene una navegación propia.
 */
export default function PlantillaVista({ titulo, className = '', children }: PlantillaVistaProps) {
  const { tema, hojasVisibles, animacionesActivas } = usePreferencias()
  const aviso = useAvisoActual()
  const [lateralAbierto, setLateralAbierto] = useState(false)

  const cerrarLateral = useCallback(() => setLateralAbierto(false), [])

  useEffect(() => {
    const tituloAnterior = document.title
    document.title = titulo
    return () => {
      document.title = tituloAnterior
    }
  }, [titulo])

  return (
    <div
      className={`hv-vista ${className}`.trim()}
      data-tema={tema}
      data-hojas={hojasVisibles ? 'visibles' : 'ocultas'}
      data-animaciones={animacionesActivas ? 'activas' : 'reducidas'}
    >
      <div className="vst-hojas" aria-hidden="true">
        <img className="vst-hoja vst-hoja--izq" src={hojaIzquierda} alt="" />
        <img className="vst-hoja vst-hoja--der" src={hojaDerecha} alt="" />
      </div>

      <SidebarInicio abierto={lateralAbierto} onCerrar={cerrarLateral} />

      {lateralAbierto ? (
        <button
          type="button"
          className="vst-velo"
          onClick={cerrarLateral}
          aria-label="Cerrar menú lateral"
        />
      ) : null}

      <div className="vst-zona">
        <BarraSuperior onAlternarLateral={() => setLateralAbierto((v) => !v)} />

        <main className="vst-contenido">{children}</main>
      </div>

      {aviso ? (
        <div className="vst-aviso" role="status" aria-live="polite">
          {aviso}
        </div>
      ) : null}
    </div>
  )
}
