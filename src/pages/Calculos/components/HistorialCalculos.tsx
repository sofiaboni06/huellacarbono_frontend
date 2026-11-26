import { useEffect, useRef, useState } from 'react'
import { Eye, FileDown, History, X } from 'lucide-react'
import Button from '../../../components/common/Button'
import { useAviso } from '../../../components/layout/PlantillaVista'
import { ErrorApi } from '../../../services/api'
import {
  listarCalculosCarbono,
  obtenerCalculoCarbono,
  obtenerInformeCarbono,
} from '../../../services/calculosService'
import { crearPdf, descargarArchivo } from '../../../utils/generarPdf'
import { lineasInforme } from '../../../utils/informeCarbono'
import type { CalculoCarbono } from '../../../services/calculosService'
import ConsolidacionHuella, { TablaTrazabilidad } from './ConsolidacionHuella'
import './HistorialCalculos.css'

function fechaLegible(valor: string) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Historial de los cálculos de carbono guardados por la API. */
export default function HistorialCalculos() {
  const avisar = useAviso()
  const [calculos, setCalculos] = useState<CalculoCarbono[]>([])
  const [detalle, setDetalle] = useState<CalculoCarbono | null>(null)
  const [cargando, setCargando] = useState(true)
  const detalleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void listarCalculosCarbono()
      .then(setCalculos)
      .catch((error: unknown) => {
        avisar(error instanceof ErrorApi ? error.message : 'No se pudo cargar el historial.')
      })
      .finally(() => setCargando(false))
  }, [avisar])

  async function abrir(id: string) {
    try {
      const datos = await obtenerCalculoCarbono(id)
      setDetalle(datos)
      window.requestAnimationFrame(() => {
        detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    } catch (error) {
      avisar(error instanceof ErrorApi ? error.message : 'No se pudo abrir el cálculo.')
    }
  }

  return (
    <div className="cal-historial-contenedor">
      <section className="cal-historial vst-tarjeta" aria-labelledby="cal-historial-titulo">
        <header className="cal-historial-cabecera">
          <div>
            <h2 id="cal-historial-titulo">Cálculos de carbono registrados</h2>
            <p className="cal-ayuda">Haz clic en cualquier fila para ver el desglose completo y descargar su informe.</p>
          </div>
          <span className="cal-historial-contador">{calculos.length} registros</span>
        </header>

        {cargando ? (
          <p className="cal-ayuda">Cargando historial…</p>
        ) : calculos.length === 0 ? (
          <p className="cal-historial-vacio">
            <History size={18} aria-hidden="true" />
            Aún no hay cálculos de carbono guardados. Completa un cálculo en la pestaña Huella de Carbono para verlo aquí.
          </p>
        ) : (
          <div className="cal-historial-tabla-envoltura">
            <table className="cal-historial-tabla">
              <thead>
                <tr>
                  <th scope="col">Organización</th>
                  <th scope="col">Periodo</th>
                  <th scope="col">Metodología</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Resultado</th>
                  <th scope="col">Fecha</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {calculos.map((item) => {
                  const activo = detalle?.id === item.id
                  return (
                    <tr
                      key={item.id}
                      className={`cal-historial-fila ${activo ? 'activo' : ''}`}
                      onClick={() => void abrir(item.id)}
                    >
                      <th scope="row">{item.organizacionNombre}</th>
                      <td>{item.periodoNombre}</td>
                      <td>
                        {item.metodologiaNombre} {item.numeroVersion}
                      </td>
                      <td>
                        {item.estado === 'HISTORICO'
                          ? 'Histórico'
                          : ['CALCULADO', 'APROBADO'].includes(item.estado)
                            ? 'Vigente'
                            : item.estado}
                      </td>
                      <td className="cal-resultado cal-num">
                        {item.totalCo2e ? `${item.totalCo2e} ${item.unidadResultado}` : 'Sin total'}
                        {item.toneladasCo2e ? ` · ${item.toneladasCo2e} t` : ''}
                      </td>
                      <td>{fechaLegible(item.fechaCalculo)}</td>
                      <td>
                        <Button
                          variante={activo ? 'primario' : 'fantasma'}
                          className="cal-btn-compacto"
                          onClick={(evento) => {
                            evento.stopPropagation()
                            void abrir(item.id)
                          }}
                        >
                          <Eye size={14} aria-hidden="true" />
                          {activo ? 'Viendo' : 'Ver detalle'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detalle ? (
        <section
          ref={detalleRef}
          className="cal-historial vst-tarjeta"
          aria-label={`Detalle del cálculo de ${detalle.organizacionNombre}`}
        >
          <header className="cal-historial-cabecera">
            <div>
              <h2>
                {detalle.organizacionNombre} · {detalle.periodoNombre}
              </h2>
              <p className="cal-ayuda">
                {detalle.metodologiaNombre} {detalle.numeroVersion}
                {detalle.fechaCalculo ? ` · ${fechaLegible(detalle.fechaCalculo)}` : ''}
              </p>
            </div>
            <div className="cal-papeles-acciones">
              <Button
                variante="contorno"
                className="cal-btn-compacto"
                onClick={() => {
                  void obtenerInformeCarbono(detalle.id)
                    .then((informe) => {
                      const blob = crearPdf(
                        lineasInforme(informe),
                        'HuellaVerde · Informe de huella de carbono.',
                      )
                      descargarArchivo(`informe-carbono-${detalle.id}.pdf`, blob)
                      avisar('Informe PDF descargado.')
                    })
                    .catch((error: unknown) => {
                      avisar(
                        error instanceof ErrorApi ? error.message : 'No se pudo armar el informe.',
                      )
                    })
                }}
              >
                <FileDown size={15} aria-hidden="true" />
                Descargar informe PDF
              </Button>
              <Button
                variante="fantasma"
                className="cal-btn-compacto"
                onClick={() => setDetalle(null)}
                aria-label="Cerrar detalle"
              >
                <X size={15} aria-hidden="true" />
                Cerrar
              </Button>
            </div>
          </header>

          <dl className="cal-indicadores cal-indicadores--compacto">
            <div className="cal-indicador">
              <dt>Total emitido</dt>
              <dd className="cal-num">
                {detalle.totalCo2e || '0'} {detalle.unidadResultado}
              </dd>
            </div>
            <div className="cal-indicador">
              <dt>Toneladas CO₂e</dt>
              <dd className="cal-num">
                {detalle.toneladasCo2e ? `${detalle.toneladasCo2e} t CO₂e` : '—'}
              </dd>
            </div>
            <div className="cal-indicador">
              <dt>Intensidad</dt>
              <dd className="cal-num">
                {detalle.intensidadCo2e
                  ? `${detalle.intensidadCo2e} kg/${detalle.unidadFuncional || 'unidad'}`
                  : 'No indicada'}
              </dd>
            </div>
          </dl>

          {detalle.observacion ? <p className="cal-ayuda">{detalle.observacion}</p> : null}

          {detalle.resumenConsolidacion ? (
            <ConsolidacionHuella resumen={detalle.resumenConsolidacion} />
          ) : (
            <p className="cal-ayuda">
              Cálculo anterior al motor 2.2.0: no tiene consolidación guardada por alcance y base GWP.
            </p>
          )}

          <TablaTrazabilidad lineas={detalle.lineas} />
        </section>
      ) : null}
    </div>
  )
}
