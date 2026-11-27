import { Leaf } from 'lucide-react'

interface Props {
  claro?: boolean
  onClick?: () => void
}

export default function LogoHuellaVerde({ claro = false, onClick }: Props) {
  return (
    <a
      className={claro ? 'ld-logo ld-logo--claro' : 'ld-logo'}
      href="#inicio"
      onClick={onClick}
      aria-label="HuellaVerde, ir al inicio"
    >
      <span className="ld-logo__marca" aria-hidden="true">
        <Leaf size={19} strokeWidth={2.4} />
      </span>
      <span>
        GEO<span className="ld-logo__verde">VA</span>
      </span>
    </a>
  )
}
