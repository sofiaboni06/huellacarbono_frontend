import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import {
  DOCUMENTOS_REPRESENTANTE,
  SECTORES_ECONOMICOS,
  TIPOS_ORGANIZACION,
  listarMunicipios,
} from '../../../../services/organizacionesService'
import type {
  Departamento,
  Municipio,
  Organizacion,
  OrganizacionFormulario,
} from '../../../../services/organizacionesService'

const VACIO: OrganizacionFormulario = {
  departamentoId: '',
  municipioId: '',
  nombre: '',
  nombreCorto: '',
  nit: '',
  tipo: '',
  sectorEconomico: '',
  correo: '',
  telefono: '',
  direccion: '',
  representanteNombre: '',
  representanteTipoDocumento: '',
  representanteNumeroDocumento: '',
  representanteCorreo: '',
  representanteTelefono: '',
  estado: 'activo',
}

const PASOS = ['Territorio', 'Organización', 'Contacto', 'Representante'] as const

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Errores = Partial<Record<keyof OrganizacionFormulario, string>>

interface ModalOrganizacionProps {
  abierto: boolean
  organizacion?: Organizacion | null
  departamentos: Departamento[]
  onCerrar: () => void
  onGuardar: (datos: OrganizacionFormulario) => Promise<boolean>
}

function validar(datos: OrganizacionFormulario): Errores {
  return {
    ...erroresTerritorio(datos),
    ...erroresOrganizacion(datos),
    ...erroresContacto(datos),
    ...erroresRepresentante(datos),
  }
}

function erroresTerritorio(datos: OrganizacionFormulario): Errores {
  const errores: Errores = {}
  if (!datos.departamentoId) errores.departamentoId = 'Selecciona un departamento.'
  if (!datos.municipioId) errores.municipioId = 'Selecciona un municipio.'
  return errores
}

function erroresOrganizacion(datos: OrganizacionFormulario): Errores {
  const errores: Errores = {}
  if (datos.nombre.trim().length < 2) errores.nombre = 'Ingresa el nombre de la organización.'
  if (!datos.nit.trim()) errores.nit = 'Ingresa el NIT.'
  if (!datos.tipo) errores.tipo = 'Selecciona el tipo.'
  return errores
}

function erroresContacto(datos: OrganizacionFormulario): Errores {
  const errores: Errores = {}
  if (datos.correo.trim() && !CORREO_RE.test(datos.correo.trim())) {
    errores.correo = 'Ingresa un correo válido.'
  }
  return errores
}

function erroresRepresentante(datos: OrganizacionFormulario): Errores {
  const errores: Errores = {}
  if (datos.representanteCorreo.trim() && !CORREO_RE.test(datos.representanteCorreo.trim())) {
    errores.representanteCorreo = 'Ingresa un correo válido.'
  }
  if (datos.representanteNumeroDocumento.trim() && !datos.representanteTipoDocumento) {
    errores.representanteTipoDocumento = 'Indica el tipo de documento.'
  }
  return errores
}

const VALIDAR_PASO = [erroresTerritorio, erroresOrganizacion, erroresContacto, erroresRepresentante]

export default function ModalOrganizacion({
  abierto,
  organizacion,
  departamentos,
  onCerrar,
  onGuardar,
}: ModalOrganizacionProps) {
  const editando = Boolean(organizacion)
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState<OrganizacionFormulario>(VACIO)
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setPaso(0)
    setErrores({})
    if (organizacion) {
      setDatos({
        departamentoId: organizacion.departamentoId,
        municipioId: organizacion.municipioId,
        nombre: organizacion.nombre,
        nombreCorto: organizacion.nombreCorto,
        nit: organizacion.nit,
        tipo: organizacion.tipo,
        sectorEconomico: organizacion.sectorEconomico,
        correo: organizacion.correo,
        telefono: organizacion.telefono,
        direccion: organizacion.direccion,
        representanteNombre: organizacion.representanteNombre,
        representanteTipoDocumento: organizacion.representanteTipoDocumento,
        representanteNumeroDocumento: organizacion.representanteNumeroDocumento,
        representanteCorreo: organizacion.representanteCorreo,
        representanteTelefono: organizacion.representanteTelefono,
        estado: organizacion.estado,
      })
      return
    }
    setDatos(VACIO)
    setMunicipios([])
  }, [abierto, organizacion])

  useEffect(() => {
    if (!abierto || !datos.departamentoId) {
      setMunicipios([])
      return
    }
    let vivo = true
    void listarMunicipios(datos.departamentoId)
      .then((lista) => {
        if (vivo) setMunicipios(lista)
      })
      .catch(() => {
        if (vivo) setMunicipios([])
      })
    return () => {
      vivo = false
    }
  }, [abierto, datos.departamentoId])

  function cambiar<K extends keyof OrganizacionFormulario>(campo: K, valor: OrganizacionFormulario[K]) {
    setDatos((previo) => {
      const siguiente = { ...previo, [campo]: valor }
      if (campo === 'departamentoId') siguiente.municipioId = ''
      return siguiente
    })
    setErrores((previo) => ({ ...previo, [campo]: undefined }))
  }

  function irAPaso(destino: number) {
    if (destino === paso) return
    if (destino < paso) {
      setPaso(destino)
      return
    }
    for (let indice = paso; indice < destino; indice += 1) {
      const encontrados = VALIDAR_PASO[indice](datos)
      if (Object.keys(encontrados).length > 0) {
        setErrores(encontrados)
        setPaso(indice)
        return
      }
    }
    setErrores({})
    setPaso(destino)
  }

  function avanzar() {
    const encontrados = VALIDAR_PASO[paso](datos)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return
    setPaso((actual) => Math.min(actual + 1, PASOS.length - 1))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (paso < PASOS.length - 1) {
      avanzar()
      return
    }
    const encontrados = validar(datos)
    setErrores(encontrados)
    const primero = VALIDAR_PASO.findIndex((revisar) => Object.keys(revisar(datos)).length > 0)
    if (primero >= 0) {
      setPaso(primero)
      return
    }
    setEnviando(true)
    const ok = await onGuardar(datos)
    setEnviando(false)
    if (ok) onCerrar()
  }

  const invalido = (campo: keyof OrganizacionFormulario) =>
    errores[campo] ? { 'aria-invalid': 'true' as const } : {}

  const ultimo = paso === PASOS.length - 1

  return (
    <Modal
      abierto={abierto}
      titulo={editando ? 'Editar organización' : 'Nueva organización'}
      onCerrar={onCerrar}
      ancho="640px"
    >
      <form className="gst-modal" onSubmit={enviar} noValidate>
        <ol className="org-pasos" aria-label="Pasos de la organización">
          {PASOS.map((nombre, indice) => (
            <li key={nombre}>
              <button
                type="button"
                className={`org-paso ${indice === paso ? 'activo' : ''} ${indice < paso ? 'listo' : ''}`}
                aria-current={indice === paso ? 'step' : undefined}
                onClick={() => irAPaso(indice)}
              >
                {nombre}
              </button>
            </li>
          ))}
        </ol>

        {paso === 0 ? (
          <>
            <h4 className="org-seccion">Dónde queda la organización</h4>
            <p className="org-ayuda">Elige el municipio. El departamento viene con él.</p>
            <div className="gst-rejilla">
              <div className="vst-campo">
                <label htmlFor="org-departamento">Departamento *</label>
                <select
                  id="org-departamento"
                  className="vst-select"
                  value={datos.departamentoId}
                  onChange={(e) => cambiar('departamentoId', e.target.value)}
                  {...invalido('departamentoId')}
                >
                  <option value="">Selecciona un departamento…</option>
                  {departamentos.map((departamento) => (
                    <option key={departamento.id} value={departamento.id}>
                      {departamento.nombre} ({departamento.codigo})
                    </option>
                  ))}
                </select>
                {errores.departamentoId ? <span className="vst-error">{errores.departamentoId}</span> : null}
              </div>
              <div className="vst-campo">
                <label htmlFor="org-municipio">Municipio *</label>
                <select
                  id="org-municipio"
                  className="vst-select"
                  value={datos.municipioId}
                  disabled={!datos.departamentoId}
                  onChange={(e) => cambiar('municipioId', e.target.value)}
                  {...invalido('municipioId')}
                >
                  <option value="">Selecciona un municipio…</option>
                  {municipios.map((municipio) => (
                    <option key={municipio.id} value={municipio.id}>
                      {municipio.nombre} ({municipio.codigo})
                    </option>
                  ))}
                </select>
                {errores.municipioId ? <span className="vst-error">{errores.municipioId}</span> : null}
              </div>
            </div>
          </>
        ) : null}

        {paso === 1 ? (
          <>
            <h4 className="org-seccion">Datos de la organización</h4>
            <p className="org-ayuda">El nombre no se repite dentro del mismo municipio. El NIT sí puede existir en otro.</p>
            <div className="gst-rejilla">
              <div className="vst-campo">
                <label htmlFor="org-nombre">Nombre *</label>
                <input
                  id="org-nombre"
                  className="vst-input"
                  value={datos.nombre}
                  onChange={(e) => cambiar('nombre', e.target.value)}
                  {...invalido('nombre')}
                />
                {errores.nombre ? <span className="vst-error">{errores.nombre}</span> : null}
              </div>
              <div className="vst-campo">
                <label htmlFor="org-corto">Nombre corto</label>
                <input
                  id="org-corto"
                  className="vst-input"
                  value={datos.nombreCorto}
                  onChange={(e) => cambiar('nombreCorto', e.target.value)}
                />
              </div>
              <div className="vst-campo">
                <label htmlFor="org-nit">NIT *</label>
                <input
                  id="org-nit"
                  className="vst-input"
                  value={datos.nit}
                  onChange={(e) => cambiar('nit', e.target.value)}
                  {...invalido('nit')}
                />
                {errores.nit ? <span className="vst-error">{errores.nit}</span> : null}
              </div>
              <div className="vst-campo">
                <label htmlFor="org-tipo">Tipo *</label>
                <select
                  id="org-tipo"
                  className="vst-select"
                  value={datos.tipo}
                  onChange={(e) => cambiar('tipo', e.target.value as OrganizacionFormulario['tipo'])}
                  {...invalido('tipo')}
                >
                  <option value="">Selecciona un tipo…</option>
                  {TIPOS_ORGANIZACION.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </option>
                  ))}
                </select>
                {errores.tipo ? <span className="vst-error">{errores.tipo}</span> : null}
              </div>
              <div className="vst-campo gst-ancha">
                <label htmlFor="org-sector">Sector económico</label>
                <select
                  id="org-sector"
                  className="vst-select"
                  value={datos.sectorEconomico}
                  onChange={(e) => cambiar('sectorEconomico', e.target.value)}
                >
                  <option value="">Sin sector</option>
                  {datos.sectorEconomico &&
                  !SECTORES_ECONOMICOS.some((grupo) =>
                    (grupo.opciones as readonly string[]).includes(datos.sectorEconomico)
                  ) ? (
                    <option value={datos.sectorEconomico}>{datos.sectorEconomico}</option>
                  ) : null}
                  {SECTORES_ECONOMICOS.map((grupo) => (
                    <optgroup key={grupo.grupo} label={grupo.grupo}>
                      {grupo.opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>
                          {opcion}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              {editando ? (
                <div className="vst-campo">
                  <label htmlFor="org-estado">Estado</label>
                  <select
                    id="org-estado"
                    className="vst-select"
                    value={datos.estado}
                    onChange={(e) => cambiar('estado', e.target.value as OrganizacionFormulario['estado'])}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {paso === 2 ? (
          <>
            <h4 className="org-seccion">Contacto</h4>
            <p className="org-ayuda">Correo, teléfono y dirección del domicilio. Puedes dejarlos vacíos.</p>
            <div className="gst-rejilla">
              <div className="vst-campo">
                <label htmlFor="org-correo">Correo</label>
                <input
                  id="org-correo"
                  className="vst-input"
                  type="email"
                  value={datos.correo}
                  onChange={(e) => cambiar('correo', e.target.value)}
                  {...invalido('correo')}
                />
                {errores.correo ? <span className="vst-error">{errores.correo}</span> : null}
              </div>
              <div className="vst-campo">
                <label htmlFor="org-telefono">Teléfono</label>
                <input
                  id="org-telefono"
                  className="vst-input"
                  value={datos.telefono}
                  onChange={(e) => cambiar('telefono', e.target.value)}
                />
              </div>
              <div className="vst-campo gst-ancha">
                <label htmlFor="org-direccion">Dirección</label>
                <input
                  id="org-direccion"
                  className="vst-input"
                  value={datos.direccion}
                  onChange={(e) => cambiar('direccion', e.target.value)}
                />
              </div>
            </div>
          </>
        ) : null}

        {paso === 3 ? (
          <>
            <h4 className="org-seccion">Representante legal</h4>
            <p className="org-ayuda">Es la ficha de contacto. No es una cuenta para entrar al sistema.</p>
            <div className="gst-rejilla">
              <div className="vst-campo">
                <label htmlFor="org-rep-nombre">Nombre</label>
                <input
                  id="org-rep-nombre"
                  className="vst-input"
                  value={datos.representanteNombre}
                  onChange={(e) => cambiar('representanteNombre', e.target.value)}
                />
              </div>
              <div className="vst-campo">
                <label htmlFor="org-rep-tipo">Tipo de documento</label>
                <select
                  id="org-rep-tipo"
                  className="vst-select"
                  value={datos.representanteTipoDocumento}
                  onChange={(e) => cambiar('representanteTipoDocumento', e.target.value)}
                  {...invalido('representanteTipoDocumento')}
                >
                  <option value="">Sin documento</option>
                  {DOCUMENTOS_REPRESENTANTE.map((documento) => (
                    <option key={documento.valor} value={documento.valor}>
                      {documento.etiqueta}
                    </option>
                  ))}
                </select>
                {errores.representanteTipoDocumento ? (
                  <span className="vst-error">{errores.representanteTipoDocumento}</span>
                ) : null}
              </div>
              <div className="vst-campo">
                <label htmlFor="org-rep-numero">Número de documento</label>
                <input
                  id="org-rep-numero"
                  className="vst-input"
                  value={datos.representanteNumeroDocumento}
                  onChange={(e) => cambiar('representanteNumeroDocumento', e.target.value)}
                />
              </div>
              <div className="vst-campo">
                <label htmlFor="org-rep-correo">Correo</label>
                <input
                  id="org-rep-correo"
                  className="vst-input"
                  type="email"
                  value={datos.representanteCorreo}
                  onChange={(e) => cambiar('representanteCorreo', e.target.value)}
                  {...invalido('representanteCorreo')}
                />
                {errores.representanteCorreo ? (
                  <span className="vst-error">{errores.representanteCorreo}</span>
                ) : null}
              </div>
              <div className="vst-campo">
                <label htmlFor="org-rep-telefono">Teléfono</label>
                <input
                  id="org-rep-telefono"
                  className="vst-input"
                  value={datos.representanteTelefono}
                  onChange={(e) => cambiar('representanteTelefono', e.target.value)}
                />
              </div>
            </div>
          </>
        ) : null}

        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          {paso > 0 ? (
            <Button variante="contorno" onClick={() => setPaso((actual) => actual - 1)} disabled={enviando}>
              Atrás
            </Button>
          ) : null}
          {ultimo ? (
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar organización'}
            </Button>
          ) : (
            <Button type="submit">Siguiente</Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
