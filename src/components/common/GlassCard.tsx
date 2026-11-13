import type { ReactNode } from 'react'
import './GlassCard.css'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return <div className={`glass-card ${className}`.trim()}>{children}</div>
}
