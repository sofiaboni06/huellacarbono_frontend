import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import Button from '../../components/common/Button'
import Interruptor from '../../components/common/Interruptor'
import PageHeader from '../../components/common/PageHeader'
import { useAviso } from '../../components/layout/PlantillaVista'
import './SeccionSeguridad.css'

const DURACIONES = ['15 minutos', '30 minutos', '1 hora', '2 horas', 'Nunca']

/** Sección de seguridad: cambio de contraseña, doble factor y sesiones. */
export default function SeccionSeguridad() {
  const avisar = useAviso()

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [dobleFactor, setDobleFactor] = useState(false)
  const [duracion, setDuracion] = useState('30 minutos')

  const cambiarClave = (evento: FormEvent) => {
    evento.preventDefault()
    const fallos: Record<string, string> = {}

    if (!actual) fallos.actual = 'Ingresa tu contraseña actual.'
    if (nueva.length < 8) fallos.nueva = 'La nueva contraseña debe tener al menos 8 caracteres.'
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
            <div className="vst-campo">
              <label htmlFor="prf-clave-actual">Contraseña actual</label>
              <input
                id="prf-clave-actual"
                className="vst-input"
                type="password"
                autoComplete="current-password"
                value={actual}
                aria-invalid={errores.actual ? true : undefined}
                onChange={(e) => {
                  setActual(e.target.value)
                  limpiarError('actual')
                }}
              />
              {errores.actual ? <p className="vst-error">{errores.actual}</p> : null}
            </div>

            <div className="vst-campo">
              <label htmlFor="prf-clave-nueva">Nueva contraseña</label>
              <input
                id="prf-clave-nueva"
                className="vst-input"
                type="password"
                autoComplete="new-password"
                value={nueva}
                aria-invalid={errores.nueva ? true : undefined}
                onChange={(e) => {
                  setNueva(e.target.value)
                  limpiarError('nueva')
                }}
              />
              {errores.nueva ? <p className="vst-error">{errores.nueva}</p> : null}
            </div>

            <div className="vst-campo">
              <label htmlFor="prf-clave-confirmar">Confirmar nueva contraseña</label>
              <input
                id="prf-clave-confirmar"
                className="vst-input"
                type="password"
                autoComplete="new-password"
                value={confirmacion}
                aria-invalid={errores.confirmacion ? true : undefined}
                onChange={(e) => {
                  setConfirmacion(e.target.value)
                  limpiarError('confirmacion')
                }}
              />
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
