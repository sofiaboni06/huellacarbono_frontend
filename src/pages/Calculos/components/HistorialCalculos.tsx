import { History } from 'lucide-react'
import { HISTORIAL_DEMO } from '../../../data/demo'
import './HistorialCalculos.css'

/** Tabla del historial de cálculos (datos de demostración). */
export default function HistorialCalculos() {
  return (
    <section className="cal-historial vst-tarjeta" aria-labelledby="cal-historial-titulo">
      <header className="cal-historial-cabecera">
        <h2 id="cal-historial-titulo">Cálculos registrados</h2>
        <span className="cal-historial-contador">{HISTORIAL_DEMO.length} registros</span>
      </header>

      {HISTORIAL_DEMO.length === 0 ? (
        <p className="cal-historial-vacio">
          <History size={18} aria-hidden="true" />
          Aún no hay cálculos registrados.
        </p>
      ) : (
        <div className="cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla">
            <caption className="cal-historial-oculto">Historial de cálculos de huella</caption>
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Periodo</th>
                <th scope="col">Sede</th>
                <th scope="col">Resultado</th>
                <th scope="col">Fecha</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {HISTORIAL_DEMO.map((item) => (
                <tr key={item.id}>
                  <th scope="row">{item.tipo}</th>
                  <td>{item.periodo}</td>
                  <td>{item.sede}</td>
                  <td className="cal-resultado">{item.resultado}</td>
                  <td>{item.fecha}</td>
                  <td>
                    <span
                      className={`cal-estado ${
                        item.estado === 'Completado' ? 'ok' : 'revision'
                      }`}
                    >
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="cal-historial-nota">
        Datos de demostración: los cálculos reales se guardarán cuando el backend esté conectado.
      </p>
    </section>
  )
}
