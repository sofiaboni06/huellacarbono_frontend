import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

type Variante = 'primario' | 'secundario' | 'claro'

interface Props {
  children: ReactNode
  variante?: Variante
  /** Ruta interna de la aplicación. */
  to?: string
  /** Ancla dentro de la landing. */
  href?: string
  /** Icono a la izquierda; si no se indica se muestra una flecha a la derecha. */
  icono?: ReactNode
  onClick?: () => void
}

export default function BotonLanding({ children, variante = 'primario', to, href, icono, onClick }: Props) {
  const clase = `ld-btn ld-btn--${variante}`
  const contenido = (
    <>
      {icono ? <span className="ld-btn__icono">{icono}</span> : null}
      {children}
      {icono ? null : <ArrowRight className="ld-btn__flecha" size={17} strokeWidth={2.2} />}
    </>
  )

  if (to) {
    return (
      <Link className={clase} to={to} onClick={onClick}>
        {contenido}
      </Link>
    )
  }
  return (
    <a className={clase} href={href} onClick={onClick}>
      {contenido}
    </a>
  )
}
