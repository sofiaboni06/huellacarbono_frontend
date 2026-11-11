import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import { CENTROS, REGIONALES } from '../../../../services/datosDemo'
import { correoDuplicado } from '../../../../services/usuariosService'
import type { Estado, Perfil, Regional, TipoDocumento, Usuario, UsuarioFormulario } from '../../../../services/tipos'

/** Tipos de documento soportados. */
const TIPOS_DOCUMENTO: TipoDocumento[] = ['CC', 'CE', 'TI', 'NIT']

/** Formulario vacío (alta de usuario). */
const VACIO: UsuarioFormulario = {
  tipoDocumento: 'CC',
  numeroDocumento: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  regional: 'Regional Bogotá',
  centro: 'SENA Bogotá',
  perfil: '',
  estado: 'activo',
}

type Errores = Partial<Record<keyof UsuarioFormulario, string>>

interface ModalUsuarioProps {
  abierto: boolean
  usuario?: Usuario | null
  perfiles: Perfil[]
  onCerrar: () => void
  onGuardar: (datos: UsuarioFormulario) => Promise<boolean>
}

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Valida el formulario completo. Devuelve el mapa de errores. */
function validar(datos: UsuarioFormulario, idExcluido?: string): Errores {
  const errores: Errores = {}
  const numero = datos.numeroDocumento.trim()

  if (!numero) errores.numeroDocumento = 'El número de documento es obligatorio.'
  else if (numero.length < 5) errores.numeroDocumento = 'Ingresa al menos 5 caracteres.'

  if (!datos.nombres.trim()) errores.nombres = 'Los nombres son obligatorios.'
  else if (datos.nombres.trim().length < 2) errores.nombres = 'Ingresa al menos 2 caracteres.'

  if (!datos.apellidos.trim()) errores.apellidos = 'Los apellidos son obligatorios.'
  else if (datos.apellidos.trim().length < 2) errores.apellidos = 'Ingresa al menos 2 caracteres.'

  const correo = datos.correo.trim()
  if (!correo) errores.correo = 'El correo electrónico es obligatorio.'
  else if (!CORREO_RE.test(correo)) errores.correo = 'Ingresa un correo válido.'
  else if (correoDuplicado(correo, idExcluido)) errores.correo = 'Este correo ya está registrado.'

  const telefono = datos.telefono.replace(/\s+/g, '')
  if (!telefono) errores.telefono = 'El teléfono es obligatorio.'
  else if (!/^\d{7,10}$/.test(telefono)) errores.telefono = 'Ingresa de 7 a 10 dígitos.'

  if (!datos.regional) errores.regional = 'Selecciona una regional.'
  if (!datos.centro) errores.centro = 'Selecciona un centro de formación.'
  if (!datos.perfil) errores.perfil = 'Asigna un perfil.'
  if (!datos.estado) errores.estado = 'Selecciona un estado.'

  return errores
}

/**
 * Modal de alta y edición de usuarios.
 * Ambos flujos comparten el mismo formulario y las mismas validaciones.
 */
export default function ModalUsuario({
  abierto,
  usuario,
  perfiles,
  onCerrar,
  onGuardar,
}: ModalUsuarioProps) {
  const editando = Boolean(usuario)
  const [datos, setDatos] = useState<UsuarioFormulario>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  // Carga los datos del usuario seleccionado (o reinicia el alta).
  useEffect(() => {
    if (!abierto) return
    if (usuario) {
      const { id: _id, ...resto } = usuario
      setDatos({ ...resto })
    } else {
      setDatos({ ...VACIO })
    }
    setErrores({})
    setEnviando(false)
  }, [abierto, usuario])

  /** Centros disponibles para la regional elegida. */
  const centros = useMemo(() => CENTROS[datos.regional] ?? [], [datos.regional])

  /** Perfiles vigentes (los inactivos se muestran deshabilitados). */
  const perfilesDisponibles = useMemo(
    () => perfiles.filter((perfil) => perfil.estado === 'activo' || perfil.id === datos.perfil),
    [perfiles, datos.perfil],
  )

  function cambiar(campo: keyof UsuarioFormulario, valor: string) {
    setDatos((prev) => {
      const siguiente: UsuarioFormulario = { ...prev, [campo]: valor }
      // Al cambiar la regional, el centro se recalcula si ya no pertenece a ella.
      if (campo === 'regional') {
        const centrosNuevos = CENTROS[valor as Regional] ?? []
        if (!centrosNuevos.includes(siguiente.centro)) siguiente.centro = centrosNuevos[0] ?? ''
      }
      return siguiente
    })
    setErrores((prev) => ({ ...prev, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const encontrados = validar(datos, usuario?.id)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    const ok = await onGuardar({
      ...datos,
      numeroDocumento: datos.numeroDocumento.trim(),
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      correo: datos.correo.trim().toLowerCase(),
      telefono: datos.telefono.replace(/\s+/g, ''),
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
            <label htmlFor="usu-tipo-doc">Tipo de documento</label>
            <select
              id="usu-tipo-doc"
              className="vst-select"
              value={datos.tipoDocumento}
              onChange={(e) => cambiar('tipoDocumento', e.target.value)}
            >
              {TIPOS_DOCUMENTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-doc">Número de documento *</label>
            <input
              id="usu-doc"
              className="vst-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1023456789"
              value={datos.numeroDocumento}
              onChange={(e) => cambiar('numeroDocumento', e.target.value)}
              {...invalido('numeroDocumento')}
            />
            {errores.numeroDocumento && <span className="vst-error">{errores.numeroDocumento}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-nombres">Nombres *</label>
            <input
              id="usu-nombres"
              className="vst-input"
              type="text"
              autoComplete="given-name"
              placeholder="Sofía"
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
              placeholder="Gallego"
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
              placeholder="nombre@sena.edu.co"
              value={datos.correo}
              onChange={(e) => cambiar('correo', e.target.value)}
              {...invalido('correo')}
            />
            {errores.correo && <span className="vst-error">{errores.correo}</span>}
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-telefono">Teléfono *</label>
            <input
              id="usu-telefono"
              className="vst-input"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              placeholder="3001234567"
              value={datos.telefono}
              onChange={(e) => cambiar('telefono', e.target.value)}
              {...invalido('telefono')}
            />
            {errores.telefono && <span className="vst-error">{errores.telefono}</span>}
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
            <label htmlFor="usu-regional">Regional</label>
            <select
              id="usu-regional"
              className="vst-select"
              value={datos.regional}
              onChange={(e) => cambiar('regional', e.target.value)}
            >
              {REGIONALES.map((regional) => (
                <option key={regional} value={regional}>
                  {regional}
                </option>
              ))}
            </select>
          </div>

          <div className="vst-campo">
            <label htmlFor="usu-centro">Centro de formación *</label>
            <select
              id="usu-centro"
              className="vst-select"
              value={datos.centro}
              onChange={(e) => cambiar('centro', e.target.value)}
              {...invalido('centro')}
            >
              {centros.map((centro) => (
                <option key={centro} value={centro}>
                  {centro}
                </option>
              ))}
            </select>
            {errores.centro && <span className="vst-error">{errores.centro}</span>}
          </div>

          <div className="vst-campo gst-ancha">
            <label htmlFor="usu-perfil">Perfil asignado *</label>
            <select
              id="usu-perfil"
              className="vst-select"
              value={datos.perfil}
              onChange={(e) => cambiar('perfil', e.target.value)}
              {...invalido('perfil')}
            >
              <option value="">Selecciona un perfil…</option>
              {perfilesDisponibles.map((perfil) => (
                <option key={perfil.id} value={perfil.nombre}>
                  {perfil.nombre}
                  {perfil.estado === 'inactivo' ? ' (inactivo)' : ''}
                </option>
              ))}
            </select>
            {errores.perfil && <span className="vst-error">{errores.perfil}</span>}
          </div>
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
