import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Droplets, Leaf, BarChart3 } from 'lucide-react'
import Modal from '../../components/common/Modal'
import { api } from '../../services/api'
import { guardarSesion } from '../../services/sesion'
import fondoLogin from '../../assets/images/hero-tierra-fondo-hd.jpg'
import logoGeova from '../../assets/images/logo-huella.png'
import '../../styles/variables.css'
import './Login.css'

interface ErroresLogin {
  usuario?: string
  password?: string
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CLAVE_USUARIO_RECORDADO = 'hv:usuario-recordado'

function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState<string>(() => {
    try {
      return localStorage.getItem(CLAVE_USUARIO_RECORDADO) ?? ''
    } catch {
      return ''
    }
  })
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [recordarme, setRecordarme] = useState(true)

  const [errores, setErrores] = useState<ErroresLogin>({})
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [modalRecuperacion, setModalRecuperacion] = useState(false)
  const [correo, setCorreo] = useState('')
  const [errorCorreo, setErrorCorreo] = useState('')
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)

  const enviarLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nuevos: ErroresLogin = {}
    const correoIngresado = usuario.trim()
    if (!correoIngresado) {
      nuevos.usuario = 'Ingresa tu correo electrónico.'
    } else if (!CORREO_RE.test(correoIngresado)) {
      nuevos.usuario = 'Ingresa el correo con el que está registrada la cuenta.'
    }
    if (!password) {
      nuevos.password = 'Ingresa tu contraseña.'
    }

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      setAviso('')
      return
    }

    try {
      if (recordarme) localStorage.setItem(CLAVE_USUARIO_RECORDADO, correoIngresado)
      else localStorage.removeItem(CLAVE_USUARIO_RECORDADO)
    } catch {
      /* almacenamiento no disponible */
    }

    setEnviando(true)
    setAviso('')
    try {
      const respuesta = await api<{
        data: {
          token: string
          user: {
            id: number
            nombres: string
            apellidos: string
            email: string
            roles: { name: string }[]
            permissions?: string[]
            lastAccessAt: string | null
          }
        }
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: correoIngresado, password }),
      })
      const cuenta = respuesta.data.user
      guardarSesion(respuesta.data.token, {
        id: String(cuenta.id),
        nombres: cuenta.nombres,
        apellidos: cuenta.apellidos,
        correo: cuenta.email,
        rol: cuenta.roles[0]?.name ?? '',
        ultimoAcceso: cuenta.lastAccessAt ?? '',
        permisos: cuenta.permissions ?? [],
      })
      navigate('/inicio')
    } catch (error) {
      setAviso(error instanceof Error ? error.message : 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  const abrirRecuperacion = () => {
    setCorreo('')
    setErrorCorreo('')
    setSolicitudEnviada(false)
    setModalRecuperacion(true)
  }

  const cerrarRecuperacion = () => setModalRecuperacion(false)

  const enviarRecuperacion = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const valor = correo.trim()

    if (!valor) {
      setErrorCorreo('Escribe el correo de recuperación.')
      return
    }
    if (!CORREO_RE.test(valor)) {
      setErrorCorreo('El correo no tiene un formato válido.')
      return
    }

    setErrorCorreo('')
    setSolicitudEnviada(true)
  }

  const iniciarConGoogle = () => {
    setAviso('El inicio de sesión con Google todavía no está disponible.')
  }

  return (
    <div className="ge-login">
      <img className="ge-login__bg" src={fondoLogin} alt="" />

      <div className="ge-login__shell">
        {/* Left: Brand / Visual */}
        <section className="ge-brand" aria-label="Información de GEOVA">
          <div className="ge-brand__top">
            <img className="ge-brand__logo" src={logoGeova} alt="Logo GEOVA" />
            <div className="ge-brand__titles">
              <p className="ge-brand__name">GEOVA</p>
              <p className="ge-brand__slogan">Gestión y Evaluación de la Huella de Carbono y Agua.</p>
            </div>
          </div>

          <div className="ge-brand__content">
            <p className="ge-brand__eyebrow">Plataforma ambiental</p>
            <h1 className="ge-brand__headline">
              Gestión ambiental
              <span>con enfoque sostenible.</span>
            </h1>
            <p className="ge-brand__desc">
              Calcula y visualiza tu huella de carbono y agua para tomar decisiones con impacto real.
            </p>

            <div className="ge-brand__cards">
              <div className="ge-feature">
                <span className="ge-feature__icon" aria-hidden="true"><Droplets size={18} /></span>
                <div>
                  <strong>Huella Hídrica</strong>
                  <p>Uso del agua en tus procesos.</p>
                </div>
              </div>
              <div className="ge-feature">
                <span className="ge-feature__icon" aria-hidden="true"><Leaf size={18} /></span>
                <div>
                  <strong>Huella de Carbono</strong>
                  <p>Emisiones y oportunidades de mejora.</p>
                </div>
              </div>
              <div className="ge-feature">
                <span className="ge-feature__icon" aria-hidden="true"><BarChart3 size={18} /></span>
                <div>
                  <strong>Reportes claros</strong>
                  <p>Resultados visuales y accionables.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Auth card */}
        <section className="ge-auth" aria-label="Inicio de sesión">
          <div className="ge-card">
            <div className="ge-card__head">
              <img className="ge-card__logo" src={logoGeova} alt="" aria-hidden="true" />
              <div>
                <p className="ge-card__welcome">Bienvenido a GEOVA</p>
                <h2 className="ge-card__title">Inicia sesión</h2>
                <p className="ge-card__subtitle">Accede a tu plataforma de gestión ambiental.</p>
              </div>
            </div>

            <form className="ge-form" onSubmit={enviarLogin} noValidate>
              <Campo
                label="Correo electrónico"
                error={errores.usuario}
                icono={<Mail className="ge-input__lead" size={18} aria-hidden="true" />}
              >
                <input
                  type="email"
                  name="usuario"
                  autoComplete="username"
                  placeholder="nombre@empresa.com"
                  aria-label="Correo electrónico"
                  aria-invalid={Boolean(errores.usuario)}
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value)
                    if (errores.usuario) setErrores((prev) => ({ ...prev, usuario: undefined }))
                  }}
                />
              </Campo>

              <Campo
                label="Contraseña"
                error={errores.password}
                icono={<Lock className="ge-input__lead" size={18} aria-hidden="true" />}
                extra={
                  <button
                    type="button"
                    className="ge-input__eye"
                    onClick={() => setVerPassword((v) => !v)}
                    aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={verPassword}
                  >
                    {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              >
                <input
                  type={verPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  aria-label="Contraseña"
                  aria-invalid={Boolean(errores.password)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errores.password) setErrores((prev) => ({ ...prev, password: undefined }))
                  }}
                />
              </Campo>

              <div className="ge-form__row">
                <label className="ge-check">
                  <input
                    type="checkbox"
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                  />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="ge-link" onClick={abrirRecuperacion}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" className="ge-btn ge-btn--primary" disabled={enviando}>
                <span>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</span>
                <span className="ge-btn__arrow" aria-hidden="true">
                  <ArrowRight size={18} />
                </span>
              </button>

              {aviso && (
                <p className="ge-alert" role="alert">
                  {aviso}
                </p>
              )}

              <div className="ge-sep" aria-hidden="true">
                <span />
                <i>o</i>
                <span />
              </div>

              <button type="button" className="ge-btn ge-btn--google" onClick={iniciarConGoogle}>
                <LogoGoogle /> Continuar con Google
              </button>
            </form>

            <p className="ge-card__footnote">Protegido. Usa tus credenciales corporativas o de acceso asignadas.</p>
          </div>
        </section>
      </div>

      <Modal
        abierto={modalRecuperacion}
        titulo="Recuperar contraseña"
        onCerrar={cerrarRecuperacion}
        ancho="430px"
      >
        {solicitudEnviada ? (
          <div className="ge-recovery__done">
            <span className="ge-recovery__done-icon" aria-hidden="true">
              <Mail size={20} />
            </span>
            <p className="ge-recovery__done-title">Solicitud registrada</p>
            <p className="ge-recovery__text">
              Entorno de demostración: no hay backend conectado, por lo que no se envió ningún
              correo a <strong>{correo.trim()}</strong>. Cuando el servicio esté disponible,
              recibirás el enlace para restablecer tu contraseña.
            </p>
            <button type="button" className="ge-btn ge-btn--google" onClick={cerrarRecuperacion}>
              Entendido
            </button>
          </div>
        ) : (
          <form className="ge-recovery" onSubmit={enviarRecuperacion} noValidate>
            <p className="ge-recovery__text">
              Escribe el correo con el que te registraste y te mostraremos los pasos para
              restablecer tu contraseña.
            </p>
            <div className={`ge-input${errorCorreo ? ' ge-input--error' : ''}`}>
              <Mail className="ge-input__lead" size={17} aria-hidden="true" />
              <input
                type="email"
                name="correo"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                aria-label="Correo electrónico de recuperación"
                aria-invalid={Boolean(errorCorreo)}
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value)
                  if (errorCorreo) setErrorCorreo('')
                }}
              />
            </div>
            {errorCorreo && (
              <p className="ge-field-error" role="alert">
                {errorCorreo}
              </p>
            )}
            <button type="submit" className="ge-btn ge-btn--primary">
              <span>Solicitar recuperación</span>
            </button>
            <p className="ge-recovery__note">
              <strong>Nota:</strong> demostración sin backend, no se envían correos reales.
            </p>
          </form>
        )}
      </Modal>
    </div>
  )
}

function Campo({
  label,
  error,
  icono,
  extra,
  children,
}: {
  label: string
  error?: string
  icono: ReactNode
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="ge-field">
      <label className="ge-field__label">{label}</label>
      <div className={`ge-input${error ? ' ge-input--error' : ''}`}>
        {icono}
        {children}
        {extra}
      </div>
      {error && (
        <p className="ge-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
