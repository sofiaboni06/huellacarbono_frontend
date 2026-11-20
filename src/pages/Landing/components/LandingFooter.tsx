import { Link } from 'react-router-dom'
import { Leaf, LifeBuoy, LogIn } from 'lucide-react'
import { NAV } from '../landingDatos'
import LogoHuellaVerde from './LogoHuellaVerde'

const REDES = [
  {
    nombre: 'Facebook',
    d: 'M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9z',
  },
  {
    nombre: 'YouTube',
    d: 'M22 8.2a3 3 0 0 0-2.1-2.1C18.2 5.6 12 5.6 12 5.6s-6.2 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.5 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.7.5 7.9.5 7.9.5s6.2 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-3.8 31 31 0 0 0-.5-3.8zM10 15.5v-7l6 3.5-6 3.5z',
  },
  {
    nombre: 'LinkedIn',
    d: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3v-11zm6.5 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.16-.02-2.64-1.6-2.64-1.62 0-1.86 1.26-1.86 2.56v4.92h-4v-11z',
  },
  {
    nombre: 'X',
    d: 'M14.7 10.3 21.4 3h-1.6l-5.8 6.4L9.3 3H3.4l7 10.1L3.4 21h1.6l6.2-6.8L14.7 21h5.9l-7.3-10.7h1.4zm-2.2 2.4-.7-1L5.6 4.2h2.4l4.6 6.5.7 1 6 8.1h-2.4l-4.4-6.1z',
  },
]

export default function LandingFooter() {
  return (
    <footer className="ld-pie">
      <div className="ld-contenedor">
        <div className="ld-pie__superior">
          <div className="ld-pie__marca">
            <LogoHuellaVerde claro />
            <p>Calcula. Reduce. Cuida.</p>
          </div>

          <nav className="ld-pie__columna" aria-label="Navegación del pie">
            <h2>Navegación</h2>
            {NAV.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.etiqueta}
              </a>
            ))}
          </nav>

          <div className="ld-pie__columna">
            <h2>Contacto</h2>
            <Link to="/ayuda">
              <LifeBuoy size={15} /> Centro de ayuda
            </Link>
            <Link to="/login">
              <LogIn size={15} /> Iniciar sesión
            </Link>
          </div>

          <div className="ld-pie__columna">
            <h2>Síguenos</h2>
            <ul className="ld-pie__redes">
              {REDES.map((red) => (
                <li key={red.nombre} title={red.nombre}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={red.d} />
                  </svg>
                  <span className="ld-oculto">{red.nombre}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ld-pie__inferior">
          <p>© {new Date().getFullYear()} HuellaVerde. Todos los derechos reservados.</p>
          <p className="ld-pie__mensaje">
            <Leaf size={15} strokeWidth={2.4} /> Un futuro más verde es posible
          </p>
        </div>
      </div>
    </footer>
  )
}
