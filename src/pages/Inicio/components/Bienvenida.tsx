import type { SVGProps } from 'react'
import { usePerfil } from '../../../context/PerfilContext'
import SelectorOrganizacion from './SelectorOrganizacion'
import './Bienvenida.css'

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </BaseIcon>
  )
}

function BuildingIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6M9 10h.01M15 10h.01" />
    </BaseIcon>
  )
}

function UsersIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.2c1.2-3.2 3.1-4.7 5.5-4.7s4.3 1.5 5.5 4.7" />
      <circle cx="16.8" cy="9" r="2.5" />
      <path d="M16.4 14.7c2 .3 3.5 1.6 4.3 4" />
    </BaseIcon>
  )
}

function GridIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.8" />
    </BaseIcon>
  )
}

function ArrowIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
    </BaseIcon>
  )
}

// AQUÍ ESTÁ LA IMAGEN QUE PEDISTE
const DEFAULT_IMAGE = '/img/noticia-tecnologia.png'

export default function Bienvenida() {
  // Extraemos los datos del contexto de Huella Verde
  const { perfil, rol } = usePerfil()

  const nombre = perfil.nombre.trim() || 'Sofia'
  const organizacion = perfil.organizacion || 'Huella Verde'
  const rolUsuario = rol || 'Usuario'

  return (
    <section className="welcome-hero" aria-label="Bienvenida">
      {/* Fondo decorativo */}
      <div className="welcome-hero__decoration" aria-hidden="true">
        <span className="welcome-dot welcome-dot--one" />
        <span className="welcome-dot welcome-dot--two" />
        <span className="welcome-dot welcome-dot--three" />
        <span className="welcome-square welcome-square--one" />
        <span className="welcome-square welcome-square--two" />
        <span className="welcome-square welcome-square--three" />
        <span className="welcome-circle" />
      </div>

      {/* Contenido izquierdo */}
      <div className="welcome-hero__content">
        
        {/* Etiqueta institucional adaptada */}
        <div className="welcome-hero__badge">
          <span className="welcome-hero__status" />
          <span>HUELLA VERDE</span>
          <span className="welcome-hero__separator" />
          <span className="welcome-hero__badge-subtitle">
            Panel de Gestión Ambiental
          </span>
        </div>

        {/* Mensaje de bienvenida */}
        <div className="welcome-hero__heading">
          <p className="welcome-hero__eyebrow">
            ¡Nos alegra tenerte aquí!
          </p>

          <h1>
            ¡Hola,
            <span className="welcome-hero__username">
              {nombre}!
            </span>
          </h1>

          <p className="welcome-hero__description">
            Aquí tienes un resumen del estado ambiental de tu organización.
          </p>
        </div>

        {/* Información del usuario (Reemplazando Centro y Regional) */}
        <div className="welcome-hero__info">

          {/* Rol */}
          <div className="welcome-info-card">
            <span className="welcome-info-card__icon">
              <ShieldIcon />
            </span>
            <span className="welcome-info-card__text">
              <span className="welcome-info-card__label">
                ROL DEL SISTEMA
              </span>
              <strong>{rolUsuario}</strong>
            </span>
          </div>

          {/* Organización */}
          <div className="welcome-info-card">
            <span className="welcome-info-card__icon">
              <BuildingIcon />
            </span>
            <span className="welcome-info-card__text">
              <span className="welcome-info-card__label">
                ORGANIZACIÓN
              </span>
              <strong>{organizacion}</strong>
            </span>
          </div>
        </div>

        {/* Pie de bienvenida y Selector */}
        <div className="welcome-hero__footer">
          <div className="welcome-hero__icon-group">
            <span className="welcome-footer-icon welcome-footer-icon--dark">
              <UsersIcon />
            </span>
            <span className="welcome-footer-icon welcome-footer-icon--green">
              <GridIcon />
            </span>
            <span className="welcome-footer-icon welcome-footer-icon--light">
              <ArrowIcon />
            </span>
          </div>

          <span className="welcome-hero__footer-divider" />

          <div className="welcome-hero__footer-text">
            <strong>Todo conectado para ti</strong>
            <span>Datos · Métricas · Sostenibilidad</span>
          </div>
        </div>
      </div>

      {/* Fotografía derecha */}
      <div className="welcome-hero__visual">
        <img
          src={DEFAULT_IMAGE} // <-- Usando la imagen original aquí
          alt="Fotografía de la plataforma"
          className="welcome-hero__image"
          loading="eager"
        />
        
        <div className="welcome-hero__image-overlay" />

        <div className="welcome-hero__photo-caption">
          <span className="welcome-hero__caption-line" />
          <div>
            <p>PLATAFORMA DE GESTIÓN</p>
            <h2>Tu espacio, tus oportunidades.</h2>
            <span>Construyendo un futuro más verde.</span>
          </div>
        </div>
      </div>

      {/* Selector de Organización / Periodo */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
         <SelectorOrganizacion />
      </div>
    </section>
  )
}