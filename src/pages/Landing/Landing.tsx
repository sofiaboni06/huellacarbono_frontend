import { useEffect, useRef } from 'react'
import { NAV } from './landingDatos'
import { useDesplazado, useRevelar, useSeccionActiva } from './components/useLandingEfectos'
import LandingNav from './components/LandingNav'
import HeroLanding from './components/HeroLanding'
import Estadisticas from './components/Estadisticas'
import SeccionProducto from './components/SeccionProducto'
import PasosFuncionamiento from './components/PasosFuncionamiento'
import BannerCta from './components/BannerCta'
import LandingFooter from './components/LandingFooter'
import '../../styles/variables.css'
import './Landing.css'

const SECCIONES = NAV.map((item) => item.id)

export default function Landing() {
  const raiz = useRef<HTMLDivElement>(null)
  const centinela = useRef<HTMLSpanElement>(null)
  const activa = useSeccionActiva(SECCIONES)
  const fija = useDesplazado(centinela)
  useRevelar(raiz)

  useEffect(() => {
    const previo = document.title
    document.title = 'HuellaVerde · Calcula, reduce y cuida el planeta'
    return () => {
      document.title = previo
    }
  }, [])

  return (
    <div className="ld" ref={raiz}>
      <span className="ld-centinela" ref={centinela} aria-hidden="true" />
      <LandingNav activa={activa} fija={fija} />
      <main>
        <HeroLanding />
        <Estadisticas />
        <SeccionProducto />
        <PasosFuncionamiento />
        <BannerCta />
      </main>
      <LandingFooter />
    </div>
  )
}
