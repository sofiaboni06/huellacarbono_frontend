import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Cloud,
  Droplets,
  Eye,
  EyeOff,
  House,
  Leaf,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import Modal from '../../components/common/Modal'
import hvLeaf from '../../assets/images/hv-leaf.png'
import senaLogo from '../../assets/images/sena-logo.png'
import '../../styles/variables.css'
import './Login.css'

interface ErroresLogin {
  usuario?: string
  password?: string
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CLAVE_USUARIO_RECORDADO = 'hv:usuario-recordado'

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
  const [avisoDemo, setAvisoDemo] = useState('')

  const [modalRecuperacion, setModalRecuperacion] = useState(false)
  const [correo, setCorreo] = useState('')
  const [errorCorreo, setErrorCorreo] = useState('')
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)

  /** Evita navegar tras desmontar la vista. */
  const accesoDemo = useRef<number | null>(null)
  useEffect(() => () => {
    if (accesoDemo.current !== null) window.clearTimeout(accesoDemo.current)
  }, [])

  /* ---------------- Validación de demostración del formulario ---------------- */
  const enviarLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nuevos: ErroresLogin = {}
    if (!usuario.trim()) {
      nuevos.usuario = 'Ingresa tu usuario o correo electrónico.'
    }
    if (!password) {
      nuevos.password = 'Ingresa tu contraseña.'
    }

    setErrores(nuevos)

    if (Object.keys(nuevos).length > 0) {
      setAvisoDemo('')
      return
    }

    // No hay backend en esta fase: la validación ocurre íntegramente en el navegador.
    try {
      if (recordarme) {
        localStorage.setItem(CLAVE_USUARIO_RECORDADO, usuario.trim())
      } else {
        localStorage.removeItem(CLAVE_USUARIO_RECORDADO)
      }
    } catch {
      /* almacenamiento no disponible */
    }

    setAvisoDemo(
      'Acceso de demostración: la validación ocurrió solo en tu navegador. No hay backend ' +
        'ni autenticación real; entrando a Inicio…',
    )

    // Acceso demostrativo: no existe autenticación, únicamente navegación al panel.
    accesoDemo.current = window.setTimeout(() => {
      accesoDemo.current = null
      navigate('/inicio')
    }, 900)
  }

  /* ---------------- Recuperación de contraseña (sin backend) ---------------- */
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

  return (
    <div className="hv-login">
      <div className="hv-login__shell">
        {/* ============ PANEL IZQUIERDO ============ */}
        <section className="hv-panel hv-panel--brand" aria-label="Presentación de HuellaVerde">
          <header className="brand__head">
            <img className="brand__mark" src={hvLeaf} alt="" aria-hidden="true" />
            <div className="brand__titles">
              <h1 className="brand__wordmark">
                Huella<span className="brand__wordmark-accent">Verde</span>
              </h1>
              <p className="brand__tagline">Calcula · Analiza · Protege</p>
            </div>
          </header>

          <div className="brand__mid">
            <span className="brand__rule" aria-hidden="true" />
            <p className="brand__slogan">
              Juntos por un
              <br />
              planeta más <span className="brand__slogan-accent">sostenible</span>
            </p>
            <p className="brand__desc">
              Plataforma para el cálculo de
              <br />
              Huella Hídrica y Huella de Carbono
            </p>
          </div>

          <ul className="brand__icons">
            <li className="brand__icon">
              <Droplets size={20} aria-hidden="true" />
              <span className="hv-sr-only">Huella Hídrica</span>
            </li>
            <li className="brand__icon">
              <Leaf size={20} aria-hidden="true" />
              <span className="hv-sr-only">Huella de Carbono</span>
            </li>
            <li className="brand__icon">
              <Cloud size={20} aria-hidden="true" />
              <span className="hv-sr-only">Emisiones atmosféricas</span>
            </li>
          </ul>
        </section>

        {/* ============ PANEL DERECHO (FORMULARIO) ============ */}
        <section className="hv-panel hv-panel--card">
          <h2 className="card__title">Iniciar Sesión</h2>
          <p className="card__subtitle">Ingresa tus credenciales para continuar</p>

          <form className="card__form" onSubmit={enviarLogin} noValidate>
            {/* Usuario */}
            <div className="hv-field-login">
              <div className={`login-input${errores.usuario ? ' login-input--error' : ''}`}>
                <User className="login-input__lead" size={17} aria-hidden="true" />
                <input
                  type="text"
                  name="usuario"
                  autoComplete="username"
                  placeholder="Usuario o correo electrónico"
                  aria-label="Usuario o correo electrónico"
                  aria-invalid={Boolean(errores.usuario)}
                  value={usuario}
                  onChange={(e) => {
                    setUsuario(e.target.value)
                    if (errores.usuario) setErrores((prev) => ({ ...prev, usuario: undefined }))
                  }}
                />
              </div>
              {errores.usuario && (
                <p className="login-field-error" role="alert">
                  {errores.usuario}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="hv-field-login">
              <div className={`login-input${errores.password ? ' login-input--error' : ''}`}>
                <Lock className="login-input__lead" size={17} aria-hidden="true" />
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
                <button
                  type="button"
                  className="login-input__eye"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verPassword}
                >
                  {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errores.password && (
                <p className="login-field-error" role="alert">
                  {errores.password}
                </p>
              )}
            </div>

            {/* Recordarme / recuperar */}
            <div className="card__options">
              <label className="card__remember">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                />
                <span>Recordarme</span>
              </label>
              <button type="button" className="card__forgot" onClick={abrirRecuperacion}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="login-btn login-btn--primary">
              Ingresar <ArrowRight size={17} aria-hidden="true" />
            </button>

            {avisoDemo && (
              <p className="card__demo" role="status">
                <strong>Modo demostración.</strong> {avisoDemo}
              </p>
            )}

            <div className="card__separator" aria-hidden="true">
              <span />
              <i>o</i>
              <span />
            </div>

            <button type="button" className="login-btn login-btn--home" onClick={() => navigate('/')}>
              <House size={16} aria-hidden="true" /> Volver al inicio
            </button>
          </form>

          <footer className="card__footer">
            <span className="card__footer-brand">
              Huella<span>Verde</span>
            </span>
            <span className="card__footer-dot" aria-hidden="true" />
            {/* Filtro SVG: convierte el fondo blanco del logo SENA en
                transparencia (luminancia → alfa) sin modificar el recurso. */}
            <svg
              aria-hidden="true"
              focusable="false"
              width="0"
              height="0"
              style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
            >
              <defs>
                <filter
                  id="hv-key-white"
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  colorInterpolationFilters="sRGB"
                >
                  {/* Alfa = alfa_entrada − luminancia: el fondo blanco
                      (lum 1) queda transparente y el logo (lum baja)
                      opaco; los píxeles fuera del área también caen a 0. */}
                  <feColorMatrix
                    type="matrix"
                    values="1 0 0 0 0
                            0 1 0 0 0
                            0 0 1 0 0
                            -0.2126 -0.7152 -0.0722 1 0"
                  />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="1.6" intercept="0" />
                  </feComponentTransfer>
                </filter>
              </defs>
            </svg>
            <img
              className="card__footer-sena"
              src={senaLogo}
              alt="SENA — Servicio Nacional de Aprendizaje"
              style={{ filter: 'url(#hv-key-white)' }}
            />
          </footer>

          {/* ============ MODAL DE RECUPERACIÓN ============ */}
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
                <button type="button" className="login-btn login-btn--home" onClick={cerrarRecuperacion}>
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
                  Solicitar recuperación
                </button>
                <p className="recovery__note">
                  <strong>Nota:</strong> demostración sin backend, no se envían correos reales.
                </p>
              </form>
            )}
          </Modal>
        </section>
      </div>
    </div>
  )
}
