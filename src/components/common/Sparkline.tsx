import { useId } from 'react'

interface SparklineProps {
  data: number[]
  color: string
  height?: number
  className?: string
}

/** Gráfica de línea pequeña dibujada en SVG (sin dependencias). */
export default function Sparkline({ data, color, height = 56, className = '' }: SparklineProps) {
  const gradientId = useId().replace(/:/g, '')

  const width = 240
  const padding = 6
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pasos = Math.max(data.length - 1, 1)
  const points = data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / pasos
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return [x, y] as const
  })

  const linea = (puntos: readonly (readonly [number, number])[]) => {
    if (puntos.length < 2) {
      const y = puntos[0]?.[1] ?? height / 2
      return `M${padding},${y.toFixed(1)} L${(width - padding).toFixed(1)},${y.toFixed(1)}`
    }
    let trazo = `M${puntos[0][0].toFixed(1)},${puntos[0][1].toFixed(1)}`
    for (let i = 0; i < puntos.length - 1; i += 1) {
      const p0 = puntos[i === 0 ? i : i - 1]
      const p1 = puntos[i]
      const p2 = puntos[i + 1]
      const p3 = puntos[i + 2] ?? p2
      const c1x = p1[0] + (p2[0] - p0[0]) / 6
      const c1y = p1[1] + (p2[1] - p0[1]) / 6
      const c2x = p2[0] - (p3[0] - p1[0]) / 6
      const c2y = p2[1] - (p3[1] - p1[1]) / 6
      trazo += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
    }
    return trazo
  }

  const linePath = linea(points)
  const areaPath = `${linePath} L${(points.at(-1)?.[0] ?? width - padding).toFixed(1)},${height} L${(points[0]?.[0] ?? padding).toFixed(1)},${height} Z`

  return (
    <svg
      className={`sparkline ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
