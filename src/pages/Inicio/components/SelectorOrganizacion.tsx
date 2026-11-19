import { useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { useClickOutside } from '../../../hooks/useClickOutside'
import './SelectorOrganizacion.css'

interface Opcion {
  id: string
  nombre: string
}

interface Props {
  organizaciones: Opcion[]
  periodos: Opcion[]
  organizacionId: string
  periodoId: string
  onOrganizacion: (id: string) => void
  onPeriodo: (id: string) => void
}

export default function SelectorOrganizacion({
  organizaciones,
  periodos,
  organizacionId,
  periodoId,
  onOrganizacion,
  onPeriodo,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const ref = useClickOutside<HTMLDivElement>(() => setAbierto(false), abierto)
  const periodo = periodos.find((item) => item.id === periodoId)?.nombre ?? 'Sin cálculo'

  return (
    <div className="ini-selector" ref={ref}>
      <button
        type="button"
        className="ini-selector-pastilla"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >
        <CalendarDays size={17} strokeWidth={2.2} aria-hidden="true" />
        <span className="ini-selector-dato">
          <span className="ini-selector-etiqueta">Periodo:</span>
          <b>{periodo}</b>
        </span>
        <ChevronDown size={17} strokeWidth={2.4} aria-hidden="true" className={`ini-selector-flecha ${abierto ? 'girada' : ''}`} />
      </button>

      {abierto ? (
        <div className="ini-selector-menu" role="listbox" aria-label="Seleccionar organización y periodo">
          <p className="ini-selector-grupo">Organización</p>
          {organizaciones.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={item.id === organizacionId}
              className={`ini-selector-opcion ${item.id === organizacionId ? 'activa' : ''}`}
              onClick={() => {
                onOrganizacion(item.id)
                setAbierto(false)
              }}
            >
              {item.nombre}
            </button>
          ))}

          <p className="ini-selector-grupo">Periodo</p>
          {periodos.length ? (
            periodos.map((item) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={item.id === periodoId}
                className={`ini-selector-opcion ${item.id === periodoId ? 'activa' : ''}`}
                onClick={() => {
                  onPeriodo(item.id)
                  setAbierto(false)
                }}
              >
                {item.nombre}
              </button>
            ))
          ) : (
            <p className="ini-selector-grupo">Sin cálculos</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
