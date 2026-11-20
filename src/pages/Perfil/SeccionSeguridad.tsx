import { useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, LogOut, ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import Button from '../../components/common/Button'
import Interruptor from '../../components/common/Interruptor'
import PageHeader from '../../components/common/PageHeader'
import { useAviso } from '../../components/layout/PlantillaVista'
import './SeccionSeguridad.css'

const DURACIONES = ['15 minutos', '30 minutos', '1 hora', '2 horas', 'Nunca']

// Lista negra de contraseñas muy comunes
const CLAVES_PROHIBIDAS = ['123456', '654321', '10203040', 'asdfghj', 'qwerty', 'password', '12345678']

// Evalúa qué tan fuerte es la contraseña
function evaluarFortaleza(pass: string) {
  let puntaje = 0
  if (pass.length >= 8) puntaje++
  if (/[A-Z]/.test(pass)) puntaje++
  if (/[0-9]/.test(pass)) puntaje++
  if (/[^A-Za-z0-9]/.test(pass)) puntaje++ // Caracter especial
  
  if (pass.length === 0) return { nivel: 0, texto: '', color: 'transparent' }
  if (puntaje <= 2) return { nivel: 1, texto: 'Débil', color: '#ef4444' } // Rojo
  if (puntaje === 3) return { nivel: 2, texto: 'Media', color: '#f59e0b' } // Amarillo
  return { nivel: 3, texto: 'Fuerte', color: '#10b981' } // Verde
}

/** Sección de seguridad: cambio de contraseña, doble factor y sesiones. */
export default function SeccionSeguridad() {
  const avisar = useAviso()

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [dobleFactor, setDobleFactor] = useState(false)
  const [duracion, setDuracion] = useState('30 minutos')

  // Estados para los "ojitos"
  const [verActual, setVerActual] = useState(false)
  const [verNueva, setVerNueva] = useState(false)
  const [verConfirmacion, setVerConfirmacion] = useState(false)

  // Calculamos la fortaleza solo de la nueva contraseña
  const fortaleza = useMemo(() => evaluarFortaleza(nueva), [nueva])

  const cambiarClave = (evento: FormEvent) => {
    evento.preventDefault()
    const fallos: Record<string, string> = {}

    if (!actual) fallos.actual = 'Ingresa tu contraseña actual.'
    
    // Validaciones robustas para la nueva contraseña
    if (nueva.length < 8) {
      fallos.nueva = 'Debe tener al menos 8 caracteres.'
    } else if (!/[A-Z]/.test(nueva)) {
      fallos.nueva = 'Debe incluir al menos una letra mayúscula.'
    } else if (!/[0-9]/.test(nueva)) {
      fallos.nueva = 'Debe incluir al menos un número.'
    } else if (!/[^A-Za-z0-9]/.test(nueva)) {
      fallos.nueva = 'Debe incluir al menos un carácter especial (!@#$%^&*).'
    } else if (CLAVES_PROHIBIDAS.includes(nueva.toLowerCase())) {
      fallos.nueva = 'Esta contraseña es demasiado común y fácil de adivinar.'
    }

    if (confirmacion !== nueva) fallos.confirmacion = 'Las contraseñas no coinciden.'
    if (nueva && actual && nueva === actual) {
      fallos.nueva = 'La contraseña nueva debe ser distinta a la actual.'
    }

    setErrores(fallos)
    if (Object.keys(fallos).length > 0) return

    setActual('')
    setNueva('')
    setConfirmacion('')
    avisar('Contraseña actualizada correctamente (demostración, sin backend).')
  }

  const limpiarError = (clave: string) => {
    setErrores((prev) => {
      if (!prev[clave]) return prev
      const copia = { ...prev }
      delete copia[clave]
      return copia
    })
  }

  return (
    <>
      <PageHeader
        titulo="Seguridad"
        subtitulo="Protege el acceso a tu cuenta de HuellaVerde."
      />

      <section className="vst-tarjeta prf-seg" aria-labelledby="prf-clave-titulo">
        <header className="prf-seg-cabecera">
          <span className="prf-seg-icono" aria-hidden="true">
            <KeyRound size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h2 id="prf-clave-titulo">Cambiar contraseña</h2>
            <p>Actualiza tu contraseña de acceso al menos una vez por semestre.</p>
          </div>
        </header>

        <form className="prf-seg-formulario" onSubmit={cambiarClave} noValidate>
          <div className="prf-seg-rejilla">
            
            {/* CONTRASEÑA ACTUAL */}
            <div className="vst-campo">
              <label htmlFor="prf-clave-actual">Contraseña actual</label>
              <div className="prf-input-wrapper">
                <input
                  id="prf-clave-actual"
                  className="vst-input"
                  type={verActual ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={actual}
                  aria-invalid={errores.actual ? true : undefined}
                  onChange={(e) => {
                    setActual(e.target.value)
                    limpiarError('actual')
                  }}
                />
                <button
                  type="button"
                  className="prf-ojito"
                  onClick={() => setVerActual(!verActual)}
                  aria-label={verActual ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verActual ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errores.actual ? <p className="vst-error">{errores.actual}</p> : null}
            </div>

            {/* NUEVA CONTRASEÑA */}
            <div className="vst-campo">
              <label htmlFor="prf-clave-nueva">Nueva contraseña</label>
              <div className="prf-input-wrapper">
                <input
                  id="prf-clave-nueva"
                  className="vst-input"
                  type={verNueva ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={nueva}
                  aria-invalid={errores.nueva ? true : undefined}
                  onChange={(e) => {
                    setNueva(e.target.value)
                    limpiarError('nueva')
                  }}
                />
                <button
                  type="button"
                  className="prf-ojito"
                  onClick={() => setVerNueva(!verNueva)}
                  aria-label={verNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* MEDIDOR DE FORTALEZA */}
              {nueva.length > 0 && (
                <div className="prf-fortaleza-contenedor">
                  <div className="prf-fortaleza-barras">
                    <div className={`prf-barra ${fortaleza.nivel >= 1 ? 'activa' : ''}`} style={{ backgroundColor: fortaleza.nivel >= 1 ? fortaleza.color : '' }} />
                    <div className={`prf-barra ${fortaleza.nivel >= 2 ? 'activa' : ''}`} style={{ backgroundColor: fortaleza.nivel >= 2 ? fortaleza.color : '' }} />
                    <div className={`prf-barra ${fortaleza.nivel >= 3 ? 'activa' : ''}`} style={{ backgroundColor: fortaleza.nivel >= 3 ? fortaleza.color : '' }} />
                  </div>
                  <span className="prf-fortaleza-texto" style={{ color: fortaleza.color }}>
                    Seguridad: {fortaleza.texto}
                  </span>
                </div>
              )}

              {/* LISTA DE REQUISITOS (Opcional, muy útil para UX) */}
              {nueva.length > 0 && (
                <ul className="prf-requisitos">
                  <li className={nueva.length >= 8 ? 'ok' : ''}>
                    {nueva.length >= 8 ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} Mín. 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(nueva) ? 'ok' : ''}>
                    {/[A-Z]/.test(nueva) ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} 1 Mayúscula
                  </li>
                  <li className={/[0-9]/.test(nueva) ? 'ok' : ''}>
                    {/[0-9]/.test(nueva) ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} 1 Número
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(nueva) ? 'ok' : ''}>
                    {/[^A-Za-z0-9]/.test(nueva) ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} 1 Especial (!@#)
                  </li>
                </ul>
              )}

              {errores.nueva ? <p className="vst-error">{errores.nueva}</p> : null}
            </div>

            {/* CONFIRMAR NUEVA CONTRASEÑA */}
            <div className="vst-campo">
              <label htmlFor="prf-clave-confirmar">Confirmar nueva contraseña</label>
              <div className="prf-input-wrapper">
                <input
                  id="prf-clave-confirmar"
                  className="vst-input"
                  type={verConfirmacion ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmacion}
                  aria-invalid={errores.confirmacion ? true : undefined}
                  onChange={(e) => {
                    setConfirmacion(e.target.value)
                    limpiarError('confirmacion')
                  }}
                />
                <button
                  type="button"
                  className="prf-ojito"
                  onClick={() => setVerConfirmacion(!verConfirmacion)}
                  aria-label={verConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {verConfirmacion ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errores.confirmacion ? <p className="vst-error">{errores.confirmacion}</p> : null}
            </div>
          </div>

          <div className="prf-seg-acciones">
            <Button variante="primario" type="submit">
              Actualizar contraseña
            </Button>
          </div>
        </form>
      </section>

      <section className="vst-tarjeta prf-seg" aria-labelledby="prf-factor-titulo">
        <header className="prf-seg-cabecera">
          <span className="prf-seg-icono" aria-hidden="true">
            <ShieldCheck size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h2 id="prf-factor-titulo">Autenticación y sesiones</h2>
            <p>Refuerza el acceso y controla cuánto dura tu sesión activa.</p>
          </div>
        </header>

        <Interruptor
          id="prf-doble-factor"
          etiqueta="Autenticación en dos pasos"
          descripcion="Solicita un código adicional junto a la contraseña al iniciar sesión."
          activo={dobleFactor}
          onCambio={(valor) => {
            setDobleFactor(valor)
            avisar(
              valor
                ? 'Autenticación en dos pasos activada (demostración).'
                : 'Autenticación en dos pasos desactivada (demostración).',
            )
          }}
        />

        <div className="vst-fila">
          <div className="vst-fila-texto">
            <label htmlFor="prf-duracion">Cierre de sesión automático</label>
            <p>Tiempo de inactividad antes de cerrar la sesión.</p>
          </div>
          <select
            id="prf-duracion"
            className="vst-select prf-seg-select"
            value={duracion}
            onChange={(e) => {
              setDuracion(e.target.value)
              avisar(`Cierre automático configurado en «${e.target.value}» (demostración).`)
            }}
          >
            {DURACIONES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="vst-tarjeta prf-seg" aria-labelledby="prf-sesiones-titulo">
        <header className="prf-seg-cabecera">
          <span className="prf-seg-icono" aria-hidden="true">
            <LogOut size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h2 id="prf-sesiones-titulo">Sesiones activas</h2>
            <p>Este dispositivo: Chrome en Windows · última actividad hoy.</p>
          </div>
        </header>

        <div className="prf-seg-acciones">
          <Button
            variante="contorno"
            onClick={() => avisar('Se cerraron las demás sesiones (demostración).')}
          >
            Cerrar las demás sesiones
          </Button>
        </div>
      </section>
    </>
  )
}