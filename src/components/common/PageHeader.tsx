import type { ReactNode } from 'react'
import './PageHeader.css'

interface PageHeaderProps {
  titulo: string
  subtitulo?: string
  acciones?: ReactNode
}

export default function PageHeader({ titulo, subtitulo, acciones }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-texto">
        <h1>{titulo}</h1>
        {subtitulo ? <p>{subtitulo}</p> : null}
      </div>
      {acciones ? <div className="page-header-acciones">{acciones}</div> : null}
    </div>
  )
}
