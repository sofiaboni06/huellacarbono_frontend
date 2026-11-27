import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { NAV, type SeccionId } from '../landingDatos'
import BotonLanding from './BotonLanding'
import logoHuella from "../../../assets/images/logo-huella.png"
import { Link } from 'react-router-dom'
import logoFabrica from "../../../assets/images/logo-fabrica-software.png"

interface Props {
  activa: SeccionId
  fija: boolean
}

export default function LandingNav({ activa, fija }: Props) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

  return (
    <header className="ld-nav ld-nav--fija" data-fija={fija ? 'si' : 'no'}>
      <div className="ld-nav__interno">
        
        {/* Contenedor de los Logos */}
        <a href="#" className="ld-nav__logo" onClick={cerrar} style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}>
          
          {/* Logo 1: GEOVA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={logoHuella} alt="Logo GEOVA" style={{ height: '50px', width: 'auto' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff' }}>
              GEOVA
            </span>
          </div>

          {/* Separador Vertical */}
          <div style={{ width: '1.5px', height: '35px', backgroundColor: 'rgba(15, 23, 42, 0.15)' }}></div>

          {/* Logo 2: Fábrica de Software (Ruta desde la carpeta public) */}
          <img 
            src={logoFabrica} 
            alt="Fábrica de Software" 
            style={{ height: '60px', width: 'auto' }} 
          />
          
        </a>

        <nav className={abierto ? 'ld-nav__links es-abierto' : 'ld-nav__links'} id="ld-menu" aria-label="Secciones">
          {NAV.map((item) =>
            item.ruta ? (
              <Link
                key={item.id}
                to={item.ruta}
                className={activa === item.id ? 'es-activo' : ''}
              >
                {item.etiqueta}
              </Link>
            ) : (
              <a
                key={item.id}
                href={`/#${item.id}`}
                className={activa === item.id ? 'es-activo' : ''}
              >
                {item.etiqueta}
              </a>
            ),
          )}
          
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