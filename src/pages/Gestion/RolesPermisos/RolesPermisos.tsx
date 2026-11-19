import { useCallback, useEffect, useMemo, useState } from 'react'
import { RotateCcw, Save, ShieldCheck, TriangleAlert } from 'lucide-react'
import PlantillaVista, { useAviso } from '../../../components/layout/PlantillaVista'
import PageHeader from '../../../components/common/PageHeader'
import Button from '../../../components/common/Button'
import PestanasGestion from '../components/PestanasGestion'
import TablaPermisos from './components/TablaPermisos'
import { usePerfil } from '../../../context/PerfilContext'
import { listarPerfiles } from '../../../services/perfilesService'
import {
  accionGuardable,
  cargarPermisos,
  cambiarMatriz,
  contarPermisos,
  guardarPermisos,
  marcarMatriz,
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
  const { puede } = usePerfil()
  const puedeEditar = puede('rol.editar')

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
      try {
        const lista = await listarPerfiles()
        if (!vivo) return
        setPerfiles(lista)
        const recordado = leerPerfilSesion()
        const valido = recordado && lista.some((perfil) => perfil.id === recordado)
        setPerfilId((actual) => actual || (valido ? recordado : '') || lista[0]?.id || '')
      } catch (error) {
        if (vivo) avisar(error instanceof Error ? error.message : 'No fue posible cargar los perfiles.')
      } finally {
        if (vivo) setCargandoPerfiles(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [avisar])

  /** Carga la matriz guardada del perfil seleccionado. */
  useEffect(() => {
    if (!perfilId) return
    let vivo = true
    setCargandoPermisos(true)
    void (async () => {
      try {
        const matrizServidor = await cargarPermisos(perfilId)
        if (!vivo) return
        setMatriz(matrizServidor)
        setGuardado(matrizServidor)
      } catch (error) {
        if (vivo) avisar(error instanceof Error ? error.message : 'No fue posible cargar los permisos.')
      } finally {
        if (vivo) setCargandoPermisos(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [perfilId, avisar])

  const perfilActual = useMemo(
    () => perfiles.find((perfil) => perfil.id === perfilId) ?? null,
    [perfiles, perfilId],
  )

  const hayCambios = !iguales(matriz, guardado)
  const marcados = contarPermisos(matriz)

  /** Marca o desmarca una casilla y las que comparten su código. */
  const cambiar = useCallback((moduloId: string, accion: Accion, valor: boolean) => {
    setMatriz((prev) => cambiarMatriz(prev, moduloId, accion, valor))
  }, [])

  /** Marca o desmarca las casillas que el servidor puede guardar. */
  function marcarTodo(valor: boolean) {
    setMatriz((prev) => marcarMatriz(prev, valor))
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
    try {
      const resultado = await guardarPermisos(perfilId, matriz)
      setGuardado(resultado)
      setMatriz(resultado)
      avisar(`Permisos de «${perfilActual?.nombre ?? 'perfil'}» guardados correctamente.`)
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No fue posible guardar los permisos.')
    } finally {
      setGuardando(false)
    }
  }

  const bloqueado = cargandoPermisos || guardando || !perfilId || !puedeEditar

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
            Consultar usuarios abre la vista Usuarios. Consultar roles abre Perfiles y Roles y
            permisos, que comparten el mismo permiso. Crear y editar muestran los botones de esas
            vistas. Inicio, Cálculo e Informe siguen visibles al entrar: el servidor todavía no
            tiene un permiso para ocultarlos. Eliminar tampoco se puede asignar.
          </p>
          <div className="gst-accesos-rapidos">
            <button
              type="button"
              className="gst-acceso"
              onClick={() => marcarTodo(true)}
              disabled={bloqueado}
            >
              Marcar todo
            </button>
            <button
              type="button"
              className="gst-acceso"
              onClick={() => marcarTodo(false)}
              disabled={bloqueado}
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
            <TablaPermisos
              matriz={matriz}
              onCambiar={cambiar}
              deshabilitado={bloqueado}
              puedeMarcar={accionGuardable}
            />

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
            Los cambios se guardan en el servidor. Tiene que quedar un usuario activo que pueda
            administrar usuarios y roles.
          </span>
        </p>
      </section>
    </PlantillaVista>
  )
}
