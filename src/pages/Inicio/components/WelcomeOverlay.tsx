import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { usePerfil } from '../../../context/PerfilContext'
import { Camera, CheckCircle2, Building2, MapPin } from 'lucide-react'
import '../WelcomeOverlay.css'

const MOTES = [
  { x: '6%', s: 5, d: '12s', delay: '0s' },
  { x: '16%', s: 8, d: '15s', delay: '-4s' },
  { x: '27%', s: 4, d: '11s', delay: '-8s' },
  { x: '39%', s: 7, d: '14s', delay: '-2s' },
  { x: '52%', s: 5, d: '13s', delay: '-9s' },
  { x: '63%', s: 9, d: '16s', delay: '-5s' },
  { x: '74%', s: 4, d: '12s', delay: '-11s' },
  { x: '85%', s: 7, d: '15s', delay: '-1s' },
  { x: '94%', s: 5, d: '11s', delay: '-7s' },
]

const delay = (ms: number) => ({ ['--wl-delay' as string]: `${ms}ms` }) as CSSProperties

function AnimatedWords({ text, offset, className }: { text: string; offset: number; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean)
  let cursor = offset

  return (
    <span className={className} aria-hidden="true">
      {words.map((word, wordIndex) => {
        const start = cursor
        cursor += word.length + 1
        return (
          <Fragment key={`${word}-${wordIndex}`}>
            <span className="inline-block whitespace-nowrap">
              {[...word].map((char, index) => (
                <span
                  key={index}
                  className="wl-letter"
                  style={{ ['--i' as string]: start + index } as CSSProperties}
                >
                  {char}
                </span>
              ))}
            </span>
            {wordIndex < words.length - 1 ? ' ' : null}
          </Fragment>
        )
      })}
    </span>
  )
}

function hasSeenWelcome(userId: string): boolean {
  return localStorage.getItem(`welcome_seen_${userId}`) === 'true'
}

function markWelcomeSeen(userId: string): void {
  localStorage.setItem(`welcome_seen_${userId}`, 'true')
}

function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function WelcomeOverlay({ onClosing }: { onClosing?: () => void }) {
  const { perfil, rol } = usePerfil()

  const [closing, setClosing] = useState(false)
  const [busy] = useState(false)
  const [error] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [greeting] = useState(() => greetingFor(new Date()))

  const inputRef = useRef<HTMLInputElement>(null)
  const startRef = useRef<HTMLButtonElement>(null)
  const timers = useRef<number[]>([])
  const onClosingRef = useRef(onClosing)

  const userId = perfil.correo
  const visible = userId !== undefined && (closing || !hasSeenWelcome(userId))
  const isOpen = visible && !closing
  const photoSrc = '' // Temporal

  useEffect(() => {
    onClosingRef.current = onClosing
  }, [onClosing])

  useEffect(() => () => { timers.current.forEach((id) => window.clearTimeout(id)) }, [])

  useEffect(() => {
    if (!visible) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [visible])

  useEffect(() => {
    if (isOpen) startRef.current?.focus()
  }, [isOpen])

  const close = useCallback(() => {
    if (!isOpen || userId === undefined) return
    markWelcomeSeen(userId)
    setClosing(true)
    onClosingRef.current?.()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => setClosing(false), reduceMotion ? 0 : 750)
    timers.current.push(id)
  }, [isOpen, userId])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  if (!visible || !perfil) return null

  const hasPhoto = Boolean(photoSrc)
  const nombreCompleto = perfil.nombre || 'Sofia Gallego'
  const partes = nombreCompleto.split(' ')
  const nombre = partes[0] || 'Sofia'
  const apellidos = partes.slice(1).join(' ') || 'Gallego'
  const initials = `${nombre[0] || ''}${apellidos[0] || ''}`.toUpperCase()
  const organizacion = perfil.organizacion || 'SENA'
  const rolUsuario = rol || 'Analista Ambiental'
  const sede = 'Sede Principal'
  const phrase = `Como ${rolUsuario}, tu gestión es clave para reducir la huella de carbono de ${organizacion}.`

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setSaved(true)
    timers.current.push(window.setTimeout(() => setSaved(false), 3200))
  }

  const openPicker = () => inputRef.current?.click()

  // ... (mantén todos los imports y la lógica superior igual) ...

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      aria-describedby="welcome-phrase"
      className={`wl-overlay${closing ? ' is-closing' : ''}`}
    >
      {/* Fondo oscuro */}
      <div className="wl-bg-wrap">
        <img src="/img/Tierra verde entre hojas y rocío.png" alt="" className="wl-bg-img" aria-hidden="true" />
        <div className="wl-bg-overlay" />
      </div>

      {/* Contenido */}
      <div className="wl-content-wrap">
        
        {/* Logo */}
        <div className="wl-rise wl-flex wl-items-center wl-gap-4" style={{ marginBottom: '2rem', ...delay(100) }}>
          <span style={{ display: 'grid', placeItems: 'center', width: '3rem', height: '3rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '1.5rem' }}>🌿</span>
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.8)' }}>HUELLA VERDE</span>
        </div>

        {/* Foto de perfil */}
        <div className="wl-pop wl-photo-wrapper" style={delay(250)}>
          {!hasPhoto ? <span aria-hidden="true" className="wl-ring" /> : null}
          
          <button type="button" onClick={openPicker} disabled={busy} className="wl-photo-btn">
            {photoSrc ? (
              <img src={photoSrc} alt={`Foto de ${nombre}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span className="wl-photo-initials">{initials}</span>
            )}
            <span className="wl-photo-overlay">
              <Camera style={{ width: '2.25rem', height: '2.25rem' }} />
            </span>
          </button>

          <button type="button" onClick={openPicker} disabled={busy} className="wl-photo-pill" style={{ background: saved ? '#fff' : hasPhoto ? 'rgba(255,255,255,0.9)' : '#34d399', color: saved ? '#065f46' : hasPhoto ? '#1e293b' : '#0f172a' }}>
            {saved ? (
              <>
                <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }} strokeWidth={3} /> ¡Foto guardada!
              </>
            ) : hasPhoto ? (
              'Cambiar foto'
            ) : (
              <>
                <Camera style={{ width: '0.875rem', height: '0.875rem' }} /> Agrega tu foto
              </>
            )}
          </button>
          
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(event) => void handleFile(event)} />
        </div>

        {/* Saludo y nombre */}
        <div className="wl-text-center" style={{ marginTop: '2rem' }}>
          <p className="wl-rise" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.28em', color: '#34d399', textTransform: 'uppercase', ...delay(300) }}>
            {greeting}
          </p>
          <h1 id="welcome-title" className="wl-glow" style={{ marginTop: '0.5rem', fontSize: '2.25rem', lineHeight: 1.05, fontWeight: 900, color: '#fff' }}>
            <AnimatedWords text={nombre} offset={0} />{' '}
            <AnimatedWords text={apellidos} offset={nombre.length + 1} className="text-emerald-400" />
          </h1>
          <span className="wl-rise" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '9999px', border: '1px solid rgba(52,211,153,0.4)', background: 'rgba(52,211,153,0.15)', padding: '0.375rem 1rem', fontSize: '0.875rem', fontWeight: 700, color: '#a7f3d0', ...delay(1000) }}>
            <span aria-hidden="true" style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: '#34d399' }} />
            {rolUsuario}
          </span>
        </div>

        {/* Badges de Organización y Sede */}
        <ul className="wl-rise wl-flex wl-gap-4 wl-mt-10" style={{ flexWrap: 'wrap', justifyContent: 'center', listStyle: 'none', padding: 0, ...delay(1100) }}>
          {organizacion && (
            <li style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
              <Building2 style={{ width: '1.25rem', height: '1.25rem', color: '#34d399' }} /> {organizacion}
            </li>
          )}
          {sede && (
            <li style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', padding: '0.625rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>
              <MapPin style={{ width: '1.25rem', height: '1.25rem', color: '#34d399' }} /> {sede}
            </li>
          )}
        </ul>

        {/* Frase */}
        <blockquote id="welcome-phrase" className="wl-rise" style={{ marginTop: '1.75rem', borderLeft: '4px solid rgba(52,211,153,0.8)', paddingLeft: '1.25rem', textAlign: 'left', fontSize: '1.125rem', lineHeight: 1.625, color: 'rgba(255,255,255,0.9)', maxWidth: '40rem', ...delay(1300) }}>
          {phrase}
        </blockquote>

        {/* Botón Comenzar */}
        <div className="wl-rise" style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', ...delay(1500) }}>
          <button ref={startRef} type="button" onClick={close} style={{ display: 'inline-flex', height: '3.25rem', alignItems: 'center', gap: '0.75rem', borderRadius: '9999px', background: '#fff', padding: '0 2rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
            Comenzar <span style={{ fontSize: '1.25rem' }}>→</span>
          </button>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Puedes cambiar tu foto cuando quieras desde Mi perfil.</p>
        </div>

        {/* Footer */}
        <div className="wl-rise" style={{ marginTop: '3rem', opacity: 0.9, ...delay(1700) }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)' }}>HUELLA VERDE © 2026</span>
        </div>
      </div>
    </div>
  )
}