import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

type Variante = 'primario' | 'contorno' | 'fantasma'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  children: ReactNode
}

export default function Button({ variante = 'primario', children, className = '', ...rest }: ButtonProps) {
  return (
    <button type="button" className={`hv-btn hv-btn-${variante} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}
