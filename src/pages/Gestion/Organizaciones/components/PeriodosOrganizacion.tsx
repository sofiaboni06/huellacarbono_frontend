import { useCallback, useEffect, useState } from 'react'
import { CalendarRange, Pencil, Plus } from 'lucide-react'
import { useAviso } from '../../../../components/layout/PlantillaVista'
import Button from '../../../../components/common/Button'
import { usePerfil } from '../../../../context/PerfilContext'
import {
  actualizarPeriodo,
  crearPeriodo,
  etiquetaPeriodo,
  listarPeriodos,
} from '../../../../services/periodosService'
import type { Periodo, PeriodoFormulario } from '../../../../services/periodosService'
import ModalPeriodo from './ModalPeriodo'

function fechaLegible(iso: string) {
  const [anio, mes, dia] = iso.split('-')
  if (!anio || !mes || !dia) return iso
  return `${dia}/${mes}/${anio}`
}

export default function PeriodosOrganizacion({ organizacionId }: { organizacionId: string }) {
  const avisar = useAviso()
  const { puede } = usePerfil()
  const puedeVer = puede('periodo.ver')
  const puedeCrear = puede('periodo.crear')
  const puedeEditar = puede('periodo.editar')
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(false)
  const [edicion, setEdicion] = useState<Periodo | null>(null)

  const recargar = useCallback(async () => {
    if (!puedeVer) {
      setCargando(false)
      return
    }
    try {
      setPeriodos(await listarPeriodos(organizacionId))
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudieron cargar los periodos.')
    } finally {
      setCargando(false)
    }
  }, [avisar, organizacionId, puedeVer])

  useEffect(() => {
    void recargar()
  }, [recargar])

  async function guardar(datos: PeriodoFormulario) {
    try {
      if (edicion) {
        await actualizarPeriodo(edicion.id, datos)
        avisar('Periodo actualizado.')
      } else {
        await crearPeriodo(organizacionId, datos)
        avisar('Periodo creado.')
      }
      await recargar()
      return true
    } catch (error) {
      avisar(error instanceof Error ? error.message : 'No se pudo guardar el periodo.')
      return false
    }
  }

  if (!puedeVer) return null

  return (
    <section className="vst-tarjeta gst-tabla-tarjeta org-bloque">
      <div className="org-bloque-cabeza">
        <div>
          <h2>Periodos de medición</h2>
          <p>Este calendario es solo de esta empresa. Otra organización puede medir otras fechas.</p>
        </div>
        {puedeCrear ? (
          <Button
            onClick={() => {
              setEdicion(null)
              setModal(true)
            }}
          >
            <Plus size={16} />
            Nuevo periodo
          </Button>
        ) : null}
      </div>

      {cargando ? (
        <div className="gst-cargando" role="status">
          <span className="gst-spinner" aria-hidden="true" />
          Cargando periodos…
        </div>
      ) : periodos.length === 0 ? (
        <div className="gst-vacio">
          <CalendarRange size={26} />
          <p>Esta organización todavía no tiene periodos. Crea el primero antes de calcular.</p>
        </div>
      ) : (
        <div className="gst-tabla-envoltura">
          <table className="gst-tabla">
            <caption className="gst-sr-only">Periodos de la organización</caption>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                <th scope="col">Inicio</th>
                <th scope="col">Fin</th>
                <th scope="col">Estado</th>
                {puedeEditar ? <th scope="col">Acciones</th> : null}
              </tr>
            </thead>
            <tbody>
              {periodos.map((periodo) => (
                <tr key={periodo.id}>
                  <td>
                    <b>{periodo.nombre}</b>
                  </td>
                  <td>{fechaLegible(periodo.fechaInicio)}</td>
                  <td>{fechaLegible(periodo.fechaFin)}</td>
                  <td>{etiquetaPeriodo(periodo.estado)}</td>
                  {puedeEditar ? (
                    <td>
                      <button
                        type="button"
                        className="gst-accion"
                        aria-label={`Editar periodo ${periodo.nombre}`}
                        onClick={() => {
                          setEdicion(periodo)
                          setModal(true)
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalPeriodo
        abierto={modal}
        periodo={edicion}
        onCerrar={() => setModal(false)}
        onGuardar={guardar}
      />
    </section>
  )
}
