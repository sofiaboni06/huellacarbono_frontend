import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SidebarInicio from '../../pages/Inicio/components/SidebarInicio'
import BarraSuperior from '../../pages/Inicio/components/BarraSuperior'
import headerSaludo from '../../assets/images/header-hojas.jpg'
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

const ClaseVistaContext = createContext<(clase: string) => void>(() => undefined)

interface PlantillaVistaProps {
  /** Título del documento durante la estancia en la vista. */
  titulo: string
  /** Clase adicional de la raíz (identifica la vista: cal, rep, prf…). */
  className?: string
  children: ReactNode
}

/**
 * Marco único de la aplicación autenticada.
 * El menú y la barra superior viven aquí, así que no se desmontan al cambiar de vista.
 */
export function MarcoAplicacion() {
  const { pathname } = useLocation()
  const { tema, hojasVisibles, animacionesActivas } = usePreferencias()
  const aviso = useAvisoActual()
  const [lateralAbierto, setLateralAbierto] = useState(false)
  const [claseVista, setClaseVista] = useState('')
  const esInicio = pathname === '/inicio'
  const cerrarLateral = useCallback(() => setLateralAbierto(false), [])

  useEffect(() => {
    setLateralAbierto(false)
  }, [pathname])

  const raiz = `${esInicio ? 'hv-inicio' : 'hv-vista hv-inicio'} ${claseVista}`.trim()

  return (
    <ClaseVistaContext.Provider value={setClaseVista}>
      <div
        className={raiz}
        data-tema={tema}
        data-hojas={hojasVisibles ? 'visibles' : 'ocultas'}
        data-animaciones={animacionesActivas ? 'activas' : 'reducidas'}
      >
        <SidebarInicio abierto={lateralAbierto} onCerrar={cerrarLateral} />

        {lateralAbierto ? (
          <button type="button" className="ini-velo vst-velo" onClick={cerrarLateral} aria-label="Cerrar menú lateral" />
        ) : null}

        <div
          className="vst-zona ini-zona"
          style={{ '--ini-header': `url("${headerSaludo}")` } as CSSProperties}
        >
          {esInicio ? (
            <div className="ini-ambiente" aria-hidden="true">
              <span className="ini-onda ini-onda--1" />
              <span className="ini-onda ini-onda--2" />
              <span className="ini-luz-ambiente" />
            </div>
          ) : null}
          <BarraSuperior
            placeholder="Buscar en tu dashboard..."
            onAlternarLateral={() => setLateralAbierto((valor) => !valor)}
          />
          <main className={esInicio ? 'ini-contenido' : 'vst-contenido'}>
            <Outlet />
          </main>
        </div>

        {aviso ? (
          <div className="vst-aviso" role="status" aria-live="polite">
            {aviso}
          </div>
        ) : null}
      </div>
    </ClaseVistaContext.Provider>
  )
}

/**
 * Registra la clase y el título de la vista dentro del marco compartido.
 * No pinta otro menú: el navbar es el de `MarcoAplicacion`.
 */
export default function PlantillaVista({ titulo, className = '', children }: PlantillaVistaProps) {
  const setClaseVista = useContext(ClaseVistaContext)

  useEffect(() => {
    const tituloAnterior = document.title
    document.title = titulo
    setClaseVista(className)
    return () => {
      document.title = tituloAnterior
      setClaseVista('')
    }
  }, [titulo, className, setClaseVista])

  return children
}
