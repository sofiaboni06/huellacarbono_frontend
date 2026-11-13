import { useCallback, useEffect, useMemo, useState } from 'react'
import { RotateCcw, Save, ShieldCheck, TriangleAlert } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import PestanasGestion from '../components/PestanasGestion'
import TablaPermisos from './components/TablaPermisos'
import { listarPerfiles } from '../../../services/perfilesService'
import {
  cargarPermisos,
  contarPermisos,
  guardarPermisos,
  permisosGuardados,
} from '../../../services/permisosService'
import { MODULOS } from '../../../services/datosDemo'
import type { Accion, MatrizPermisos, Perfil } from '../../../services/tipos'
import './RolesPermisos.css'

/** Clave de sesión para recordar el último perfil configurado. */
const CLAVE_SESION = 'huellaverde.gestion.perfilActivo'

function leerPerfilSesion(): string {
  try {
    return window.sessionStorage.getItem(CLAVE_SESION) ?? ''
  } catch {
    return ''
  }
}

function guardarPerfilSesion(id: string): void {
  try {
    window.sessionStorage.setItem(CLAVE_SESION, id)
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Compara dos matrices módulo por módulo. */
function iguales(a: MatrizPermisos, b: MatrizPermisos): boolean {
  return MODULOS.every((modulo) => {
    const filaA = a[modulo.id]
    const filaB = b[modulo.id]
    if (!filaA || !filaB) return false
    return (
      filaA.consultar === filaB.consultar &&
      filaA.crear === filaB.crear &&
      filaA.editar === filaB.editar &&
      filaA.eliminar === filaB.eliminar
    )
  })
}

/**
 * Vista de Roles y Permisos.
 *
 * Selecciona un perfil, revisa o modifica su matriz de permisos por módulo y
 * guarda los cambios. La matriz vive en `permisosService` (almacenamiento
 * local con forma de API) para poder conectarla al backend sin tocar esta
 * pantalla.
 */
export default function RolesPermisos() {
  const avisar = useAviso()

  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [perfilId, setPerfilId] = useState('')
  const [matriz, setMatriz] = useState<MatrizPermisos>({})
  const [guardado, setGuardado] = useState<MatrizPermisos>({})
  const [cargandoPerfiles, setCargandoPerfiles] = useState(true)
  const [cargandoPermisos, setCargandoPermisos] = useState(false)
  const [guardando, setGuardando] = useState(false)

  /** Carga el catálogo de perfiles y preselecciona el primero. */
  useEffect(() => {
    let vivo = true
    void (async () => {
      const lista = await listarPerfiles()
      if (!vivo) return
      setPerfiles(lista)
      setCargandoPerfiles(false)
      // Recupera el último perfil visitado si sigue existiendo.
      const recordado = leerPerfilSesion()
      const valido = recordado && lista.some((perfil) => perfil.id === recordado)
      setPerfilId((actual) => actual || (valido ? recordado : '') || lista[0]?.id || '')
    })()
    return () => {
      vivo = false
    }
  }, [])

  /** Carga la matriz guardada del perfil seleccionado. */
  useEffect(() => {
    if (!perfilId) return
    let vivo = true
    setCargandoPermisos(true)
    void (async () => {
      const matrizServidor = await cargarPermisos(perfilId)
      if (!vivo) return
      setMatriz(matrizServidor)
      setGuardado(matrizServidor)
      setCargandoPermisos(false)
    })()
    return () => {
      vivo = false
    }
  }, [perfilId])

  const perfilActual = useMemo(
    () => perfiles.find((perfil) => perfil.id === perfilId) ?? null,
    [perfiles, perfilId],
  )

  const hayCambios = !iguales(matriz, guardado)
  const marcados = contarPermisos(matriz)

  /** Marca o desmarca una casilla concreta. */
  const cambiar = useCallback((moduloId: string, accion: Accion, valor: boolean) => {
    setMatriz((prev) => ({
      ...prev,
      [moduloId]: { ...prev[moduloId], [accion]: valor },
    }))
  }, [])

  /** Marca o desmarca todas las casillas del perfil de una vez. */
  function marcarTodo(valor: boolean) {
    setMatriz((prev) => {
      const siguiente: MatrizPermisos = { ...prev }
      for (const modulo of MODULOS) {
        siguiente[modulo.id] = {
          consultar: valor,
          crear: valor,
          editar: valor,
          eliminar: valor,
        }
      }
      return siguiente
    })
  }

  /** Descarta los cambios vuelve a la última matriz guardada. */
  function descartar() {
    const original = permisosGuardados(perfilId)
    setMatriz(original)
    setGuardado(original)
    avisar('Cambios descartados. Se recuperó la última configuración guardada.')
  }

  /** Guarda la matriz completa del perfil seleccionado. */
  async function guardar() {
    if (!perfilId) return
    setGuardando(true)
    const resultado = await guardarPermisos(perfilId, matriz)
    setGuardado(resultado)
    setMatriz(resultado)
    setGuardando(false)
    avisar(`Permisos de «${perfilActual?.nombre ?? 'perfil'}» guardados correctamente.`)
  }

  const bloqueado = cargandoPermisos || guardando || !perfilId

  return (
    <PlantillaVista titulo="Roles y Permisos" className="gst gst-roles">
      <PageHeader
        titulo="Roles y Permisos"
        subtitulo="Configura los accesos y las funcionalidades disponibles para cada perfil."
        acciones={
          <>
            <Button
              variante="contorno"
              onClick={descartar}
              disabled={bloqueado || !hayCambios}
            >
              <RotateCcw size={15} />
              Descartar
            </Button>
            <Button onClick={guardar} disabled={bloqueado || !hayCambios || guardando}>
              <Save size={15} />
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      />

      <PestanasGestion />

      <section className="vst-tarjeta gst-barra" aria-label="Selector de perfil">
        <label className="gst-filtro gst-filtro--perfil">
          <span>Perfil a configurar</span>
          <select
            className="vst-select"
            value={perfilId}
            onChange={(e) => {
              setPerfilId(e.target.value)
              guardarPerfilSesion(e.target.value)
            }}
            disabled={cargandoPerfiles || perfiles.length === 0}
          >
            {perfiles.length === 0 && <option value="">Sin perfiles disponibles</option>}
            {perfiles.map((perfil) => (
              <option key={perfil.id} value={perfil.id}>
                {perfil.nombre}
                {perfil.estado === 'inactivo' ? ' (inactivo)' : ''}
              </option>
            ))}
          </select>
        </label>

        {perfilActual && (
          <p className="gst-perfil-descripcion">
            <b>{perfilActual.nombre}</b>
            <span>{perfilActual.descripcion}</span>
          </p>
        )}

        {perfilActual?.estado === 'inactivo' && (
          <span className="gst-estado gst-estado--inactivo">Perfil inactivo</span>
        )}
      </section>

      <section className="vst-tarjeta gst-tabla-tarjeta" aria-label="Matriz de permisos">
        <div className="gst-barra gst-barra--acciones">
          <p className="gst-ayuda">
            Marca las casillas que cada perfil necesita dentro de HuellaVerde. Puedes marcar todo el
            módulo o limpiarlo con los accesos rápidos.
          </p>
          <div className="gst-accesos-rapidos">
            <button
              type="button"
              className="gst-acceso"
              onClick={() => marcarTodo(true)}
              disabled={guardando || bloqueado}
            >
              Marcar todo
            </button>
            <button
              type="button"
              className="gst-acceso"
              onClick={() => marcarTodo(false)}
              disabled={guardando || bloqueado}
            >
              Limpiar todo
            </button>
          </div>
        </div>

        {cargandoPerfiles || !perfilId ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            {cargandoPerfiles
              ? 'Cargando perfiles…'
              : 'Selecciona un perfil para ver sus permisos.'}
          </div>
        ) : cargandoPermisos ? (
          <div className="gst-cargando" role="status">
            <span className="gst-spinner" aria-hidden="true" />
            Cargando permisos…
          </div>
        ) : (
          <>
            <TablaPermisos matriz={matriz} onCambiar={cambiar} deshabilitado={guardando} />

            <div className="gst-resumen">
              <div className="gst-resumen-datos">
                <span className="gst-resumen-contador">
                  <ShieldCheck size={14} aria-hidden="true" />
                  {marcados} de {MODULOS.length * 4} permisos activos
                </span>
                {hayCambios ? (
                  <span className="gst-sucio">Cambios sin guardar</span>
                ) : (
                  <span>Configuración guardada</span>
                )}
              </div>
              <Button onClick={guardar} disabled={bloqueado || !hayCambios || guardando}>
                <Save size={15} />
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </>
        )}

        <p className="gst-demo">
          <TriangleAlert size={14} aria-hidden="true" />
          <span>
            Estructura de datos local (<code>src/services/permisosService.ts</code>): los permisos
            se guardan en este navegador y <b>no se aplican en el servidor</b>, porque la API aún no
            expone ese almacenamiento. La lógica queda desacoplada para conectarla al backend
            cambiando únicamente el servicio.
          </span>
        </p>
      </section>
    </PlantillaVista>
  )
}
