import { useEffect, useRef } from 'react'
import { useDesplazado, useRevelar } from '../Landing/components/useLandingEfectos'
import LandingNav from '../Landing/components/LandingNav'
import LandingFooter from '../Landing/components/LandingFooter'
import SeccionEquipo from '../Landing/components/SeccionEquipo'
import '../../styles/variables.css'
import '../Landing/Landing.css'

export default function Equipo() {
  const raiz = useRef<HTMLDivElement>(null)
  const centinela = useRef<HTMLSpanElement>(null)
  const fija = useDesplazado(centinela)
  useRevelar(raiz)

  useEffect(() => {
    const previo = document.title
    document.title = 'Equipo · HuellaVerde'
    return () => {
      document.title = previo
    }
  }, [])

  useEffect(() => {
  window.scrollTo(0, 0)
}, [])

  return (
    <div className="ld" ref={raiz}>
      <span className="ld-centinela" ref={centinela} aria-hidden="true" />
      <LandingNav activa="equipo" fija={fija} />
      <main>
        <SeccionEquipo />
      </main>
      <LandingFooter />
    </div>
  )
}