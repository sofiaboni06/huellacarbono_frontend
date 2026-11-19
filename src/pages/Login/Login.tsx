import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, Send, User } from 'lucide-react'
import Modal from '../../components/common/Modal'
import { api } from '../../services/api'
import { guardarSesion } from '../../services/sesion'
import escenaTierra from '../../assets/images/login-fondo-4k.jpg'
import logoFabrica from '../../assets/images/logo-fabrica.png'
import '../../styles/variables.css'
import './Login.css'

interface ErroresLogin {
  usuario?: string
  password?: string
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CLAVE_USUARIO_RECORDADO = 'hv:usuario-recordado'

function LogoHoja({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#20D878" d="M30 58c-1-8-6-14-12-18 8 1 14 6 16 14 1-10 6-20 16-26-6 10-10 20-12 30 8-6 14-16 16-26-2 16-10 28-24 26z" />
      <path fill="#83F45B" d="M28 50C16 38 12 20 22 8c2 12 8 20 16 26C30 20 40 10 54 8 46 24 38 38 28 50z" />
      <path d="M30 46C24 36 22 24 26 14" fill="none" stroke="#0B3025" strokeWidth="1.3" strokeLinecap="round" opacity="0.35" />
    </svg>
  )
}

function IconoGota() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 4s-8 9.2-8 15.2a8 8 0 0 0 16 0C24 13.2 16 4 16 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M13 18.5c.6 2 2.2 3.2 4 3.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconoCO2() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true">
      <text
        x="0"
        y="20"
        fill="currentColor"
        fontFamily="Poppins, sans-serif"
        fontSize="16"
        fontWeight="700"
      >
        CO
      </text>
      <text
        x="23"
        y="23"
        fill="currentColor"
        fontFamily="Poppins, sans-serif"
        fontSize="10"
        fontWeight="700"
      >
        2
      </text>
    </svg>
  )
}

function IconoReportes() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 24V14M13 24V10M20 24V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18 8h8M22.5 4.5 26 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconoCorazon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#83F45B"
        d="M12 20s-7-4.4-7-9.1C5 8 6.8 6.2 9 6.2c1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.2 0 4 1.8 4 4.7C19 15.6 12 20 12 20z"
      />
    </svg>
  )
}

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
    <div className="hv-login">
      <img className="hv-login__bg" src={escenaTierra} alt="" />

      <header className="hv-top">
        <div className="hv-brand">
          <LogoHoja size={30} />
          <p className="hv-wordmark">
            Huella<span>Verde</span>
          </p>
          <img className="hv-brand__fabrica" src={logoFabrica} alt="Fábrica de Software" />
          <span className="hv-brand__rule" aria-hidden="true" />
          <p className="hv-brand__tag">Analiza · Calcula · Protege</p>
        </div>
        <p className="hv-pill">
          <IconoCorazon />
          Un planeta más verde, está en tus manos
        </p>
      </header>

      <div className="hv-login__main">
        <section className="hv-hero" aria-label="Presentación de HuellaVerde">
          <h1 className="hv-hero__title">
            <span>Un planeta más</span>
            <span>sostenible,</span>
            <span className="hv-hero__accent">en tus manos</span>
          </h1>
          <p className="hv-hero__desc">
            Calcula tu huella ambiental y contribuye a un futuro más verde.
          </p>
          <ul className="hv-feats">
            <li className="hv-feat">
              <IconoGota />
              <strong>Huella Hídrica</strong>
              <span>Cuida el agua</span>
            </li>
            <li className="hv-feat">
              <IconoCO2 />
              <strong>Huella de Carbono</strong>
              <span>Reduce emisiones</span>
            </li>
            <li className="hv-feat">
              <IconoReportes />
              <strong>Reportes en tiempo real</strong>
              <span>Mide tu impacto</span>
            </li>
          </ul>
        </section>

        <section className="hv-card" aria-label="Inicio de sesión">
          <div className="hv-card__mark" aria-hidden="true">
            <LogoHoja size={28} />
          </div>
          <h2 className="hv-card__title">¡Bienvenido!</h2>
          <p className="hv-card__subtitle">Inicia sesión para continuar</p>

          <form className="hv-card__form" onSubmit={enviarLogin} noValidate>
            <Campo
              error={errores.usuario}
              icono={<User className="login-input__lead" size={18} aria-hidden="true" />}
              extra={<Send className="login-input__trail" size={16} aria-hidden="true" />}
            >
              <input
                type="email"
                name="usuario"
                autoComplete="username"
                placeholder="Correo electrónico"
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
              error={errores.password}
              icono={<Lock className="login-input__lead" size={18} aria-hidden="true" />}
              extra={
                <button
                  type="button"
                  className="login-input__eye"
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
                placeholder="Contraseña"
                aria-label="Contraseña"
                aria-invalid={Boolean(errores.password)}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errores.password) setErrores((prev) => ({ ...prev, password: undefined }))
                }}
              />
            </Campo>

            <div className="hv-card__options">
              <label className="hv-check">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                />
                <span>Recordarme</span>
              </label>
              <button type="button" className="hv-forgot" onClick={abrirRecuperacion}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="login-btn login-btn--primary" disabled={enviando}>
              <span>{enviando ? 'Ingresando…' : 'Ingresar'}</span>
              <span className="login-btn__arrow" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </button>

            {aviso && (
              <p className="hv-card__aviso" role="alert">
                {aviso}
              </p>
            )}

            <div className="hv-sep" aria-hidden="true">
              <span />
              <i>o</i>
              <span />
            </div>

            <button type="button" className="login-btn login-btn--google" onClick={iniciarConGoogle}>
              <LogoGoogle /> Iniciar con Google
            </button>
          </form>

          <footer className="hv-card__footer">
            <LogoHoja size={16} />
            <span className="hv-card__brand">
              Huella<span>Verde</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Juntos por un planeta mejor</span>
          </footer>

          <Modal
            abierto={modalRecuperacion}
            titulo="Recuperar contraseña"
            onCerrar={cerrarRecuperacion}
            ancho="430px"
          >
            {solicitudEnviada ? (
              <div className="recovery__done">
                <span className="recovery__done-icon" aria-hidden="true">
                  <Mail size={20} />
                </span>
                <p className="recovery__done-title">Solicitud registrada</p>
                <p className="recovery__text">
                  Entorno de demostración: no hay backend conectado, por lo que no se envió ningún
                  correo a <strong>{correo.trim()}</strong>. Cuando el servicio esté disponible,
                  recibirás el enlace para restablecer tu contraseña.
                </p>
                <button type="button" className="login-btn login-btn--google" onClick={cerrarRecuperacion}>
                  Entendido
                </button>
              </div>
            ) : (
              <form className="recovery" onSubmit={enviarRecuperacion} noValidate>
                <p className="recovery__text">
                  Escribe el correo con el que te registraste y te mostraremos los pasos para
                  restablecer tu contraseña.
                </p>
                <div className={`login-input${errorCorreo ? ' login-input--error' : ''}`}>
                  <Mail className="login-input__lead" size={17} aria-hidden="true" />
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
                  <p className="login-field-error" role="alert">
                    {errorCorreo}
                  </p>
                )}
                <button type="submit" className="login-btn login-btn--primary">
                  <span>Solicitar recuperación</span>
                </button>
                <p className="recovery__note">
                  <strong>Nota:</strong> demostración sin backend, no se envían correos reales.
                </p>
              </form>
            )}
          </Modal>
        </section>
      </div>

      <div className="hv-scroll" aria-hidden="true">
        <span className="hv-scroll__mouse">
          <i />
        </span>
        <span>Desliza para descubrir más</span>
      </div>
    </div>
  )
}

function Campo({
  error,
  icono,
  extra,
  children,
}: {
  error?: string
  icono: ReactNode
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="hv-field">
      <div className={`login-input${error ? ' login-input--error' : ''}`}>
        {icono}
        {children}
        {extra}
      </div>
      {error && (
        <p className="login-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
