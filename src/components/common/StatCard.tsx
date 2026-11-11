import type { ReactNode } from 'react'
import Sparkline from './Sparkline'
import './StatCard.css'

export type AcentoStat = 'azul' | 'verde' | 'lima' | 'morado'

interface StatCardProps {
  titulo: string
  valor: string
  indicador?: string
  tendencia?: 'sube' | 'baja'
  icono: ReactNode
  acento: AcentoStat
  serie: number[]
}

export default function StatCard({
  titulo,
  valor,
  indicador,
  tendencia = 'sube',
  icono,
  acento,
  serie,
}: StatCardProps) {
  const colorSpark =
    acento === 'azul' ? '#3b82f6' : acento === 'morado' ? '#a855f7' : acento === 'lima' ? '#7bc93f' : '#22c55e'

  return (
    <article className={`stat-card acento-${acento}`}>
      <header className="stat-head">
        <span className="stat-icon">{icono}</span>
        <span className="stat-titulo">{titulo}</span>
      </header>
      <p className="stat-valor">{valor}</p>
      <footer className="stat-foot">
        {indicador ? (
          <span className={`stat-indicador ${tendencia}`}>
            {tendencia === 'sube' ? '↑' : '↓'} {indicador}
          </span>
        ) : (
          <span className="stat-indicador suave">Período actual</span>
        )}
        <Sparkline data={serie} color={colorSpark} />
      </footer>
    </article>
  )
}
