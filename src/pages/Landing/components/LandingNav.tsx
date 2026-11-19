import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV, type SeccionId } from '../landingDatos'
import BotonLanding from './BotonLanding'
import LogoHuellaVerde from './LogoHuellaVerde'

interface Props {
  activa: SeccionId
  fija: boolean
}

export default function LandingNav({ activa, fija }: Props) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

  return (
    <header className={fija ? 'ld-nav ld-nav--fija' : 'ld-nav'}>
      <div className="ld-nav__interno">
        <LogoHuellaVerde onClick={cerrar} />

        <nav className={abierto ? 'ld-nav__links es-abierto' : 'ld-nav__links'} id="ld-menu" aria-label="Secciones">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activa === item.id ? 'es-activo' : undefined}
              aria-current={activa === item.id ? 'true' : undefined}
              onClick={cerrar}
            >
              {item.etiqueta}
            </a>
          ))}
          <span className="ld-nav__cta-movil">
            <BotonLanding to="/login" onClick={cerrar}>
              Comenzar Ahora
            </BotonLanding>
          </span>
        </nav>

        <span className="ld-nav__cta">
          <BotonLanding to="/login">Comenzar Ahora</BotonLanding>
        </span>

        <button
          type="button"
          className="ld-nav__burger"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          aria-controls="ld-menu"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  )
}
