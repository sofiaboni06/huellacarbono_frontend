import { Check } from 'lucide-react'
import { MODULOS } from '../../../../services/datosDemo'
import type { Accion, MatrizPermisos } from '../../../../services/tipos'

/** Columnas de la matriz de permisos. */
const ACCIONES: { id: Accion; etiqueta: string }[] = [
  { id: 'consultar', etiqueta: 'Consultar' },
  { id: 'crear', etiqueta: 'Crear' },
  { id: 'editar', etiqueta: 'Editar' },
  { id: 'eliminar', etiqueta: 'Eliminar' },
]

interface TablaPermisosProps {
  matriz: MatrizPermisos
  onCambiar: (moduloId: string, accion: Accion, valor: boolean) => void
  deshabilitado?: boolean
}

/**
 * Tabla módulo × acción de los permisos.
 *
 * Cada casilla es un control accesible (`role="checkbox"` con `aria-checked`)
 * y dispara `onCambiar`; el estado de verdad vive en la vista, no aquí, para
 * que la matriz sea fácil de sustituir por la respuesta del backend.
 */
export default function TablaPermisos({ matriz, onCambiar, deshabilitado = false }: TablaPermisosProps) {
  return (
    <div className="gst-tabla-envoltura">
      <table className="gst-tabla gst-tabla--permisos">
        <caption className="gst-sr-only">
          Permisos de los módulos: consultar, crear, editar y eliminar
        </caption>
        <thead>
          <tr>
            <th scope="col">Módulo</th>
            {ACCIONES.map((accion) => (
              <th key={accion.id} scope="col">
                {accion.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULOS.map((modulo) => {
            const fila = matriz[modulo.id]
            return (
              <tr key={modulo.id}>
                <td>
                  <span className="gst-modulo">
                    <span className="gst-modulo-icono" aria-hidden="true">
                      <Check size={15} />
                    </span>
                    {modulo.nombre}
                  </span>
                </td>
                {ACCIONES.map((accion) => {
                  const marcado = Boolean(fila?.[accion.id])
                  const etiqueta = `${accion.etiqueta} en ${modulo.nombre}`
                  return (
                    <td key={accion.id} className="gst-permiso-celda">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={marcado}
                        aria-label={etiqueta}
                        title={etiqueta}
                        className="gst-check"
                        disabled={deshabilitado}
                        onClick={() => onCambiar(modulo.id, accion.id, !marcado)}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
