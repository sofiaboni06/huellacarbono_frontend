import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../../../components/common/Modal'
import Button from '../../../../components/common/Button'
import { listarUsuarios } from '../../../../services/usuariosService'
import type { Sede } from '../../../../services/organizacionesService'
import type { Usuario } from '../../../../services/tipos'

interface ModalUsuariosSedeProps {
  abierto: boolean
  sede: Sede | null
  onCerrar: () => void
  onGuardar: (usuarioIds: string[]) => Promise<boolean>
}

export default function ModalUsuariosSede({
  abierto,
  sede,
  onCerrar,
  onGuardar,
}: ModalUsuariosSedeProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [elegidos, setElegidos] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!abierto || !sede) return
    setElegidos(sede.usuarios.map((usuario) => usuario.id))
    setBusqueda('')
    setError('')
    let vivo = true
    void listarUsuarios()
      .then((lista) => {
        if (vivo) setUsuarios(lista.filter((usuario) => usuario.estado === 'activo'))
      })
      .catch((fallo: unknown) => {
        if (vivo) setError(fallo instanceof Error ? fallo.message : 'No se pudieron cargar los usuarios.')
      })
    return () => {
      vivo = false
    }
  }, [abierto, sede])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return usuarios
    return usuarios.filter((usuario) => {
      const nombre = `${usuario.nombres} ${usuario.apellidos} ${usuario.correo}`.toLowerCase()
      return nombre.includes(texto)
    })
  }, [usuarios, busqueda])

  function alternar(id: string) {
    setElegidos((previo) => (previo.includes(id) ? previo.filter((item) => item !== id) : [...previo, id]))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    const ok = await onGuardar(elegidos)
    setEnviando(false)
    if (ok) onCerrar()
  }

  return (
    <Modal
      abierto={abierto}
      titulo={sede ? `Usuarios de ${sede.nombre}` : 'Usuarios de la sede'}
      onCerrar={onCerrar}
      ancho="560px"
    >
      <form className="gst-modal" onSubmit={enviar}>
        <p className="org-ayuda">Una persona puede estar en varias sedes. Aquí solo ves las de esta.</p>
        <input
          className="vst-input"
          type="search"
          value={busqueda}
          placeholder="Buscar usuario…"
          aria-label="Buscar usuario"
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {error ? <p className="vst-error">{error}</p> : null}
        <div className="org-usuarios" role="group" aria-label="Usuarios activos">
          {visibles.length === 0 ? (
            <p className="org-ayuda">No hay usuarios activos para mostrar.</p>
          ) : (
            visibles.map((usuario) => (
              <label key={usuario.id} className="org-usuario">
                <input
                  type="checkbox"
                  checked={elegidos.includes(usuario.id)}
                  onChange={() => alternar(usuario.id)}
                />
                <span>
                  <b>
                    {usuario.nombres} {usuario.apellidos}
                  </b>
                  <small>{usuario.correo}</small>
                </span>
              </label>
            ))
          )}
        </div>
        <div className="gst-modal-pie">
          <Button variante="contorno" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando || !sede}>
            {enviando ? 'Guardando…' : 'Guardar asignación'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
