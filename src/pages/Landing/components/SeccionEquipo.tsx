import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { GrGithub } from 'react-icons/gr'
import { FaLaptopCode, FaMobileAlt, FaPalette, FaUserCheck, FaUsers } from 'react-icons/fa'
import './SeccionEquipo.css'
import { createPortal } from 'react-dom'

type Miembro = {
  nombre: string
  rol: string
  github?: string
  avatar: string
  etiquetas?: string[]
}

type TarjetaProps = {
  m: Miembro
  indice: number
  onVerFoto?: (miembro: Miembro) => void
}

function iconoEtiqueta(etiqueta: string): ReactNode {
  const clave = etiqueta.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (clave.includes('movil')) return <FaMobileAlt aria-hidden="true" />
  if (clave.includes('ui') || clave.includes('ux')) return <FaPalette aria-hidden="true" />
  if (clave.includes('quality') || clave.includes('product owner') || clave.includes('tech lead') || clave.includes('scrum') || clave.includes('arquitectura') || clave.includes('logica')) return <FaUserCheck aria-hidden="true" />
  if (clave.includes('coordinator')) return <FaUsers aria-hidden="true" />
  if (clave.includes('web') || clave.includes('full stack') || clave.includes('api')) return <FaLaptopCode aria-hidden="true" />
  return null
}

const avatarFallback = (nombre: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=10b981&color=fff&size=176&bold=true&format=png`

const equipoActual: Miembro[] = [
  { nombre: 'Henry Bastidas', rol: 'Product Owner', avatar: '/avatars/henry.png', etiquetas: ['Product Owner'] },
  { nombre: 'Alex Jhoan Chaguendo', rol: 'Tech Lead & Scrum Master | Solution Architect', github: 'ALexjh117', avatar: '/avatars/alex.jpeg?v=2', etiquetas: ['Scrum Master', 'Lógica de negocio', 'Full Stack'] },
  { nombre: 'Sofia Bonilla Gallego', rol: 'Scrum Master & Team Coordinator · UI/UX', github: 'sofiaboni06', avatar: '/avatars/sofia-sg.jpeg', etiquetas: ['Full Stack', 'UI/UX', 'Team Coordinator'] },
  { nombre: 'Yusti Mebel Campo', rol: 'Full Stack Developer', github: 'mebelcampo', avatar: '/avatars/mebel-sg.jpeg', etiquetas: ['Full Stack', 'Web', 'Api', 'UI/UX'] },
  { nombre: 'Andres Mauricio Bustamante', rol: 'Full Stack Developer', github: 'MauricioG-Dev', avatar: '/avatars/mauricio.jpeg', etiquetas: ['Full Stack', 'Web', 'Quality Assurance'] },
]

function TarjetaMiembro({ m, indice, onVerFoto }: TarjetaProps) {
  const src = m.avatar || avatarFallback(m.nombre)

  return (
    <article className="eq-card" style={{ '--i': indice } as CSSProperties}>
      <span className="eq-card-sheen" aria-hidden="true" />
      <div className="eq-card-index" aria-hidden="true">
        <span>{String(indice + 1).padStart(2, '0')}</span>
        <i />
      </div>
      <button
        type="button"
        className="eq-person-photo-button"
        aria-label={`Ampliar foto de ${m.nombre}`}
        onClick={() => onVerFoto?.(m)}
      >
        <img
          src={src}
          alt={m.nombre}
          className={`eq-person-photo eq-person-photo-${indice + 1}`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null
            e.currentTarget.src = avatarFallback(m.nombre)
          }}
        />
      </button>
      <div className="eq-card-content">
        <div className="eq-copy">
          <strong>{m.nombre}</strong>
          <p>{m.rol}</p>
          {m.etiquetas ? (
            <div className="eq-tags">
              {m.etiquetas.map((etiqueta) => (
                <span key={etiqueta} className="eq-tag">
                  {iconoEtiqueta(etiqueta)}
                  {etiqueta}
                </span>
              ))}
            </div>
          ) : null}
          {m.github ? (
            <a className="eq-github" href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer">
              <GrGithub aria-hidden="true" /> <span>{m.github}</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function EquipoView() {
  const [fotoGrande, setFotoGrande] = useState<Miembro | null>(null)

  useEffect(() => {
    if (!fotoGrande) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFotoGrande(null)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [fotoGrande])

  return (
    <div className="eq-page">
      
      {/* NUEVO FONDO MINIMALISTA NATURALEZA */}
      <div className="eq-nature-bg" aria-hidden="true">
        <div className="eq-blob eq-blob--1" />
        <div className="eq-blob eq-blob--2" />
        <div className="eq-blob eq-blob--3" />
        
        {/* Hojas SVG decorativas */}
        <svg className="eq-leaf-bg eq-leaf-bg--1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
        <svg className="eq-leaf-bg eq-leaf-bg--2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      </div>

      <header className="eq-intro">
        <div className="eq-intro-copy">
          <div className="eq-system-state">
            <span aria-hidden="true" />
            Fábrica de Software · Núcleo operativo
          </div>
          <h1>Las personas detrás de <span>GEOVA</span></h1>
          <p>
            Un equipo multidisciplinario construye la plataforma que conecta inventario,
            materiales de formación y los procesos administrativos del centro.
          </p>
        </div>
        <aside className="eq-team-console" aria-label="Resumen del equipo">
          <div className="eq-console-head">
            <span>Equipo HuellaVerde</span>
            <span>Sistema / Núcleo</span>
          </div>
          <dl>
            <div>
              <dt>Integrantes</dt>
              <dd>06</dd>
            </div>
            <div>
              <dt>Disciplinas</dt>
              <dd>05</dd>
            </div>
            <div>
              <dt>Objetivo</dt>
              <dd>01</dd>
            </div>
          </dl>
          <p><i /> Todos los perfiles conectados</p>
        </aside>
      </header>

      <section className="eq-block">
        <div className="eq-roster-head">
          <div>
            <span>Directorio de talento</span>
            <h2>Equipo de desarrollo</h2>
          </div>
          <p>Selecciona una fotografía para ampliar el perfil.</p>
        </div>
        <div className="eq-grid">
          {equipoActual.map((m, i) => (
            <TarjetaMiembro key={m.nombre} m={m} indice={i} onVerFoto={setFotoGrande} />
          ))}
        </div>
      </section>

      {fotoGrande
        ? createPortal(
            <div className="foto-equipo-backdrop" role="dialog" aria-modal="true" onClick={() => setFotoGrande(null)}>
              <button type="button" className="foto-equipo-close" onClick={() => setFotoGrande(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <img src={fotoGrande.avatar} alt={fotoGrande.nombre} className="foto-equipo-photo" onClick={(e) => e.stopPropagation()} />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}