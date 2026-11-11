import { useState } from 'react'
import { ChevronDown, Leaf } from 'lucide-react'
import { PERIODOS } from '../../../data/demo'
import { useClickOutside } from '../../../hooks/useClickOutside'
import './SelectorOrganizacion.css'

/** Organizaciones de demostración. */
const ORGANIZACIONES = ['SENA', 'Corporación Verde', 'Fundación Ríos Vivos']

/**
 * Cápsula interactiva para elegir organización y periodo.
 * Los datos son de demostración: no hay un servidor detrás.
 */
export default function SelectorOrganizacion() {
  const [organizacion, setOrganizacion] = useState(ORGANIZACIONES[0])
  const [periodo, setPeriodo] = useState(PERIODOS[0])
  const [abierto, setAbierto] = useState(false)

  const ref = useClickOutside<HTMLDivElement>(() => setAbierto(false), abierto)

  const elegirOrganizacion = (valor: string) => {
    setOrganizacion(valor)
    setAbierto(false)
  }

  const elegirPeriodo = (valor: string) => {
    setPeriodo(valor)
    setAbierto(false)
  }

  return (
    <div className="ini-selector" ref={ref}>
      <button
        type="button"
        className="ini-selector-pastilla"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <Leaf size={17} strokeWidth={2.2} aria-hidden="true" />
        <span className="ini-selector-dato">
          <span className="ini-selector-etiqueta">Organización:</span>
          <b>{organizacion}</b>
        </span>
        <span className="ini-selector-separador" aria-hidden="true" />
        <span className="ini-selector-dato">
          <span className="ini-selector-etiqueta">Periodo:</span>
          <b>{periodo}</b>
        </span>
        <ChevronDown
          size={17}
          strokeWidth={2.4}
          aria-hidden="true"
          className={`ini-selector-flecha ${abierto ? 'girada' : ''}`}
        />
      </button>

      {abierto ? (
        <div className="ini-selector-menu" role="listbox" aria-label="Seleccionar organización y periodo">
          <p className="ini-selector-grupo">Organización</p>
          {ORGANIZACIONES.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={item === organizacion}
              className={`ini-selector-opcion ${item === organizacion ? 'activa' : ''}`}
              onClick={() => elegirOrganizacion(item)}
            >
              {item}
            </button>
          ))}

          <p className="ini-selector-grupo">Periodo</p>
          {PERIODOS.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={item === periodo}
              className={`ini-selector-opcion ${item === periodo ? 'activa' : ''}`}
              onClick={() => elegirPeriodo(item)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
