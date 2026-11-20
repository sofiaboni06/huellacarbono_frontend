import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import { correoDuplicado } from '../../../../services/usuariosService'
import { etiquetaPerfil } from '../../../../services/tipos'
import type { Estado, Perfil, Usuario, UsuarioFormulario } from '../../../../services/tipos'
import type { CentroFormacion } from '../../../../services/centrosService'

const VACIO: UsuarioFormulario = {
  nombres: '',
  apellidos: '',
  correo: '',
  perfilId: '',
  centroId: '',
  estado: 'activo',
  password: '',
  passwordConfirmation: '',
}

type Errores = Partial<Record<keyof UsuarioFormulario, string>>

interface ModalUsuarioProps {
  abierto: boolean
  usuario?: Usuario | null
  perfiles: Perfil[]
  /** El administrador general elige el centro. El del centro hereda el suyo. */
  eligeCentro: boolean
  centros: CentroFormacion[]
  onCerrar: () => void
  onGuardar: (datos: UsuarioFormulario) => Promise<boolean>
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function esAdministradorGeneral(perfilId: string, perfiles: Perfil[]) {
  return perfiles.find((perfil) => perfil.id === perfilId)?.nombre === 'ADMINISTRADOR'
}

function validar(
  datos: UsuarioFormulario,
  editando: boolean,
  perfiles: Perfil[],
  eligeCentro: boolean,
  idExcluido?: string,
): Errores {
  const errores: Errores = {}

  if (!datos.nombres.trim()) errores.nombres = 'Los nombres son obligatorios.'
  else if (datos.nombres.trim().length < 2) errores.nombres = 'Ingresa al menos 2 caracteres.'

  if (!datos.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.'
  else if (datos.apellidos.trim().length < 2) errores.apellidos = 'Ingresa al menos 2 caracteres.'

  const correo = datos.correo.trim()
  if (!correo) errores.correo = 'El correo electrónico es obligatorio.'
  else if (!CORREO_RE.test(correo)) errores.correo = 'Ingresa un correo válido.'
  else if (correoDuplicado(correo, idExcluido)) errores.correo = 'Este correo ya está registrado.'

  if (!datos.perfilId) errores.perfilId = 'Asigna un perfil.'
  else if (eligeCentro && !esAdministradorGeneral(datos.perfilId, perfiles) && !datos.centroId) {
    errores.centroId = 'Asigna el centro de formación.'
  }

  const pideClave = !editando || datos.password.length > 0 || datos.passwordConfirmation.length > 0
  if (pideClave) {
    if (datos.password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres.'
    if (datos.password !== datos.passwordConfirmation) {
      errores.passwordConfirmation = 'La confirmación no coincide.'
    }
  }

  return errores
}

export default function ModalUsuario({
  abierto,
  usuario,
  perfiles,
  eligeCentro,
  centros,
  onCerrar,
  onGuardar,
}: ModalUsuarioProps) {
  const editando = Boolean(usuario)
  const [datos, setDatos] = useState<UsuarioFormulario>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    if (usuario) {
      setDatos({
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        perfilId: usuario.perfilId,
        centroId: usuario.centroId,
        estado: usuario.estado,
        password: '',
        passwordConfirmation: '',
      })
    } else {
      setDatos({ ...VACIO })
    }
    setErrores({})
    setEnviando(false)
  }, [abierto, usuario])

  const perfilesDisponibles = useMemo(
    () => perfiles.filter((perfil) => perfil.estado === 'activo' || perfil.id === datos.perfilId),
    [perfiles, datos.perfilId],
  )
  const pideCentro = eligeCentro && !esAdministradorGeneral(datos.perfilId, perfiles)
  const centrosDisponibles = centros.filter((centro) => centro.activo || centro.id === datos.centroId)

  function cambiar(campo: keyof UsuarioFormulario, valor: string) {
    setDatos((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validar(datos, editando, perfiles, eligeCentro, usuario?.id)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    const general = esAdministradorGeneral(datos.perfilId, perfiles)
    const ok = await onGuardar({
      ...datos,
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      correo: datos.correo.trim().toLowerCase(),
      centroId: eligeCentro && !general ? datos.centroId : '',
    })
    setEnviando(false)
    if (ok) onCerrar()
  }

  const invalido = (campo: keyof UsuarioFormulario) =>
    errores[campo] ? { 'aria-invalid': 'true' as const } : {}

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar usuario' : 'Nuevo usuario'}
      onCerrar={onCerrar}
      ancho="660px"
    >
      <form className="gst-modal" onSubmit={enviar} noValidate>
        <div className="gst-rejilla">
          <div className="vst-campo">
            <label htmlFor="usu-nombres">Nombres *</label>
            <input
              id="usu-nombres"
              className="vst-input"
              type="text"
              autoComplete="given-name"
              placeholder="Ana"
              value={datos.nombres}
              onChange={(e) => cambiar('nombres', e.target.value)}
              {...invalido('nombres')}
            />
            {errores.nombres && <span className="vst-error">{errores.nombres}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-apellidos">Apellidos *</label>
            <input
              id="usu-apellidos"
              className="vst-input"
              type="text"
              autoComplete="family-name"
              placeholder="Pérez"
              value={datos.apellidos}
              onChange={(e) => cambiar('apellidos', e.target.value)}
              {...invalido('apellidos')}
            />
            {errores.apellidos && <span className="vst-error">{errores.apellidos}</span>}
          </div>

          <div className="vst-campo gst-ancha">
            <label htmlFor="usu-correo">Correo electrónico *</label>
            <input
              id="usu-correo"
              className="vst-input"
              type="email"
              autoComplete="off"
              placeholder="ana.perez@correo.com"
              value={datos.correo}
              onChange={(e) => cambiar('correo', e.target.value)}
              {...invalido('correo')}
            />
            {errores.correo && <span className="vst-error">{errores.correo}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-clave">{editando ? 'Nueva contraseña' : 'Contraseña *'}</label>
            <input
              id="usu-clave"
              className="vst-input"
              type="password"
              autoComplete="new-password"
              placeholder={editando ? 'Déjala vacía para no cambiarla' : 'Mínimo 8 caracteres'}
              value={datos.password}
              onChange={(e) => cambiar('password', e.target.value)}
              {...invalido('password')}
            />
            {errores.password && <span className="vst-error">{errores.password}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-clave-2">Confirmar contraseña</label>
            <input
              id="usu-clave-2"
              className="vst-input"
              type="password"
              autoComplete="new-password"
              value={datos.passwordConfirmation}
              onChange={(e) => cambiar('passwordConfirmation', e.target.value)}
              {...invalido('passwordConfirmation')}
            />
            {errores.passwordConfirmation && (
              <span className="vst-error">{errores.passwordConfirmation}</span>
            )}
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-estado">Estado</label>
            <select
              id="usu-estado"
              className="vst-select"
              value={datos.estado}
              onChange={(e) => cambiar('estado', e.target.value as Estado)}
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-perfil">Perfil asignado *</label>
            <select
              id="usu-perfil"
              className="vst-select"
              value={datos.perfilId}
              onChange={(e) => cambiar('perfilId', e.target.value)}
              {...invalido('perfilId')}
            >
              <option value="">Selecciona un perfil…</option>
              {perfilesDisponibles.map((perfil) => (
                <option key={perfil.id} value={perfil.id}>
                  {etiquetaPerfil(perfil.nombre)}
                  {perfil.estado === 'inactivo' ? ' (inactivo)' : ''}
                </option>
              ))}
            </select>
            {errores.perfilId && <span className="vst-error">{errores.perfilId}</span>}
          </div>

          {pideCentro ? (
            <div className="vst-campo gst-ancha">
              <label htmlFor="usu-centro">Centro de formación *</label>
              <select
                id="usu-centro"
                className="vst-select"
                value={datos.centroId}
                onChange={(e) => cambiar('centroId', e.target.value)}
                {...invalido('centroId')}
              >
                <option value="">Selecciona un centro…</option>
                {centrosDisponibles.map((centro) => (
                  <option key={centro.id} value={centro.id}>
                    {centro.nombre}
                    {centro.regionalNombre ? ` · ${centro.regionalNombre}` : ''}
                    {centro.activo ? '' : ' (inactivo)'}
                  </option>
                ))}
              </select>
              {errores.centroId && <span className="vst-error">{errores.centroId}</span>}
            </div>
          ) : eligeCentro ? null : (
            <p className="gst-ayuda gst-ancha">
              El usuario queda en tu centro de formación y solo verá las empresas que él mismo registre.
            </p>
          )}
        </div>

        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
