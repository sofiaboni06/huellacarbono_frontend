import { useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, CalendarClock, Mail, Pencil, ShieldCheck } from 'lucide-react'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import PageHeader from '../../components/common/PageHeader'
import { useAviso } from '../../components/layout/PlantillaVista'
import { usePerfil } from '../../context/PerfilContext'
import type { PerfilEditable } from '../../context/PerfilContext'
import fotoPerfil from '../../assets/images/profile.png'
import './SeccionPerfil.css'

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validar(borrador: PerfilEditable): Record<string, string> {
  const fallos: Record<string, string> = {}
  if (borrador.nombre.trim().length < 2) fallos.nombre = 'Ingresa tu nombre (mínimo 2 caracteres).'
  if (borrador.apellidos.trim().length < 2) {
    fallos.apellidos = 'Ingresa tus apellidos (mínimo 2 caracteres).'
  }
  if (!CORREO_VALIDO.test(borrador.correo.trim())) {
    fallos.correo = 'Ingresa un correo electrónico válido.'
  }
  if (borrador.cargo.trim().length < 2) fallos.cargo = 'Ingresa tu cargo.'
  if (borrador.organizacion.trim().length < 2) {
    fallos.organizacion = 'Ingresa tu organización.'
  }
  return fallos
}

/** Sección principal de perfil: datos personales e información del sistema. */
export default function SeccionPerfil() {
  const { perfil, rol, ultimoAcceso, guardarPerfil } = usePerfil()
  const avisar = useAviso()

  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState<PerfilEditable>(perfil)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`.trim()

  const abrir = () => {
    setBorrador(perfil)
    setErrores({})
    setEditando(true)
  }

  const cerrar = () => {
    setEditando(false)
    setErrores({})
  }

  const cambiar = (clave: keyof PerfilEditable, valor: string) => {
    setBorrador((prev) => ({ ...prev, [clave]: valor }))
    setErrores((prev) => {
      if (!prev[clave]) return prev
      const copia = { ...prev }
      delete copia[clave]
      return copia
    })
  }

  const guardar = (evento: FormEvent) => {
    evento.preventDefault()
    const fallos = validar(borrador)
    setErrores(fallos)
    if (Object.keys(fallos).length > 0) return

    guardarPerfil({
      nombre: borrador.nombre.trim(),
      apellidos: borrador.apellidos.trim(),
      correo: borrador.correo.trim(),
      cargo: borrador.cargo.trim(),
      organizacion: borrador.organizacion.trim(),
    })
    setEditando(false)
    avisar('Perfil actualizado correctamente. Los cambios se mantienen en esta sesión.')
  }

  const sistema = [
    { etiqueta: 'Rol', valor: rol, Icono: ShieldCheck },
    { etiqueta: 'Organización', valor: perfil.organizacion, Icono: Building2 },
    { etiqueta: 'Último acceso', valor: ultimoAcceso, Icono: CalendarClock },
  ]

  return (
    <>
      <PageHeader titulo="Mi Perfil" subtitulo="Gestiona tu información personal." />

      <section className="vst-tarjeta prf-identidad-tarjeta" aria-labelledby="prf-identidad-titulo">
        <span className="prf-avatar-marco">
          <img className="prf-avatar" src={fotoPerfil} alt={`Foto de ${nombreCompleto}`} />
        </span>

        <div className="prf-identidad">
          <h2 id="prf-identidad-titulo">{nombreCompleto}</h2>
          <p className="prf-identidad-cargo">{perfil.cargo}</p>
          <p className="prf-identidad-correo">
            <Mail size={14} strokeWidth={2.1} aria-hidden="true" />
            {perfil.correo}
          </p>
        </div>

        <Button variante="primario" onClick={abrir}>
          <Pencil size={15} strokeWidth={2.3} aria-hidden="true" />
          Editar perfil
        </Button>
      </section>

      <section className="vst-tarjeta prf-sistema" aria-labelledby="prf-sistema-titulo">
        <h2 id="prf-sistema-titulo">Información del sistema</h2>
        <dl className="prf-sistema-lista">
          {sistema.map(({ etiqueta, valor, Icono }) => (
            <div key={etiqueta} className="prf-sistema-item">
              <span className="prf-sistema-icono" aria-hidden="true">
                <Icono size={17} strokeWidth={2.1} />
              </span>
              <div>
                <dt>{etiqueta}</dt>
                <dd>{valor}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="prf-sistema-nota">
          Los datos de organización y rol los administran los usuarios administradores.
        </p>
      </section>

      <Modal abierto={editando} titulo="Editar perfil" onCerrar={cerrar} ancho="540px">
        <form className="prf-formulario" onSubmit={guardar} noValidate>
          <div className="prf-formulario-rejilla">
            <div className="vst-campo">
              <label htmlFor="prf-nombre">Nombre</label>
              <input
                id="prf-nombre"
                className="vst-input"
                type="text"
                value={borrador.nombre}
                aria-invalid={errores.nombre ? true : undefined}
                onChange={(e) => cambiar('nombre', e.target.value)}
              />
              {errores.nombre ? <p className="vst-error">{errores.nombre}</p> : null}
            </div>

            <div className="vst-campo">
              <label htmlFor="prf-apellidos">Apellidos</label>
              <input
                id="prf-apellidos"
                className="vst-input"
                type="text"
                value={borrador.apellidos}
                aria-invalid={errores.apellidos ? true : undefined}
                onChange={(e) => cambiar('apellidos', e.target.value)}
              />
              {errores.apellidos ? <p className="vst-error">{errores.apellidos}</p> : null}
            </div>

            <div className="vst-campo prf-campo-ancho">
              <label htmlFor="prf-correo">Correo electrónico</label>
              <input
                id="prf-correo"
                className="vst-input"
                type="email"
                value={borrador.correo}
                aria-invalid={errores.correo ? true : undefined}
                onChange={(e) => cambiar('correo', e.target.value)}
              />
              {errores.correo ? <p className="vst-error">{errores.correo}</p> : null}
            </div>

            <div className="vst-campo">
              <label htmlFor="prf-cargo">Cargo</label>
              <input
                id="prf-cargo"
                className="vst-input"
                type="text"
                value={borrador.cargo}
                aria-invalid={errores.cargo ? true : undefined}
                onChange={(e) => cambiar('cargo', e.target.value)}
              />
              {errores.cargo ? <p className="vst-error">{errores.cargo}</p> : null}
            </div>

            <div className="vst-campo">
              <label htmlFor="prf-organizacion">Organización</label>
              <input
                id="prf-organizacion"
                className="vst-input"
                type="text"
                value={borrador.organizacion}
                aria-invalid={errores.organizacion ? true : undefined}
                onChange={(e) => cambiar('organizacion', e.target.value)}
              />
              {errores.organizacion ? <p className="vst-error">{errores.organizacion}</p> : null}
            </div>
          </div>

          <p className="prf-formulario-nota">
            Demostración: los cambios se guardan en el estado de la aplicación, no en un servidor.
          </p>

          <div className="prf-formulario-acciones">
            <Button variante="contorno" onClick={cerrar}>
              Cancelar
            </Button>
            <Button variante="primario" type="submit">
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
