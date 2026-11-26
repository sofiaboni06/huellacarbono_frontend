import { AlertTriangle, CheckCircle2, Leaf } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { LineaCalculo, ResumenConsolidacion } from '../../../services/calculosService'
import { listarUnidades } from '../../../services/unidadesMedidaService'

/** Etiquetas de la clasificación de datos no calculados (backend: consolidacion.ts). */
const CLASIFICACION: Record<string, string> = {
  PENDIENTE_DATOS: 'Pendiente de datos',
  PENDIENTE_METODOLOGIA: 'Pendiente de metodología',
  PENDIENTE_DECISION: 'Pendiente de decisión o documentación',
  SIN_FACTOR_O_CONFIGURACION: 'Sin factor o configuración aplicable',
  DATO_INVALIDO: 'Dato con clasificación no válida',
  NO_APLICA: 'No aplica',
  BLOQUEADA: 'Fuente bloqueada',
}

const ESTADO_FICHA: Record<string, string> = {
  EJECUTABLE: 'Fuentes que calculan',
  NO_APLICA: 'No aplican',
  PENDIENTE_DECISION: 'Pendientes de decisión',
  PENDIENTE_DATOS: 'Pendientes de datos',
  PENDIENTE_METODOLOGIA: 'Pendientes de metodología',
}

const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const formatoMasa = new Intl.NumberFormat('es-CO', { maximumSignificantDigits: 6 })

function kg(valor: string) {
  return formato.format(Number(valor))
}

function toneladas(valor: string) {
  return formato.format(Number(valor) / 1000)
}

/**
 * Consolidación persistida por el backend: alcances, huella total, gases,
 * bases GWP, memorias fuera del total y datos no calculados. No recalcula
 * nada en el navegador: todo viene de `resumen_consolidacion`.
 */
export default function ConsolidacionHuella({ resumen }: { resumen: ResumenConsolidacion }) {
  const parcial = resumen.estadoResultado === 'PARCIAL'
  const gwp = resumen.conjuntoGwp
  const emisiones = resumen.porGas.filter((gas) => !gas.fueraDelTotal)
  const memorias = resumen.porGas.filter((gas) => gas.fueraDelTotal)

  return (
    <section className="cal-consolidacion" aria-label="Consolidación de la huella de carbono">
      <div
        className={`cal-aviso-caja ${parcial ? 'cal-aviso-caja--alerta' : ''}`}
        role={parcial ? 'alert' : 'status'}
      >
        {parcial ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
        <div>
          <strong>
            {parcial
              ? 'Resultado PARCIAL: hay datos del periodo que no entraron en la suma'
              : 'Resultado completo: todos los datos del periodo se calcularon'}
          </strong>
          <span className="cal-celda-detalle">
            {resumen.datos.recuperados} datos recuperados de la organización y el periodo ·{' '}
            {resumen.datos.calculados} calculados · {resumen.datos.noCalculados} no calculados
            {Object.entries(resumen.datos.porClasificacion).length
              ? ` (${Object.entries(resumen.datos.porClasificacion)
                  .map(([clave, total]) => `${CLASIFICACION[clave] ?? clave}: ${total}`)
                  .join(' · ')})`
              : ''}
          </span>
        </div>
      </div>

      <dl className="cal-indicadores cal-indicadores--alcances">
        {resumen.alcances.map((alcance) => (
          <div className="cal-indicador" key={alcance.codigo}>
            <dt>{alcance.nombre}</dt>
            <dd className="cal-num" title={`${alcance.totalCo2eKg} kg CO₂e`}>
              {kg(alcance.totalCo2eKg)} kg CO₂e
              <span className="cal-celda-detalle">
                {toneladas(alcance.totalCo2eKg)} t · {alcance.fuentesCalculadas} fuentes ·{' '}
                {alcance.datosCalculados} datos
                {alcance.datosPendientes ? ` · ${alcance.datosPendientes} pendientes` : ''}
              </span>
            </dd>
          </div>
        ))}
        <div className="cal-indicador cal-indicador--total">
          <dt>Huella total (A1 + A2 + A3){parcial ? ' — parcial' : ''}</dt>
          <dd className="cal-num" title={`${resumen.totalCo2eKg} kg CO₂e`}>
            {kg(resumen.totalCo2eKg)} kg CO₂e
            <span className="cal-celda-detalle">{toneladas(resumen.totalCo2eKg)} t CO₂e</span>
          </dd>
        </div>
      </dl>

      <p className="cal-ayuda">
        Unidad común: <strong>{resumen.unidad} CO₂e</strong>. Conjunto GWP de la metodología:{' '}
        <strong>
          {gwp ? `${gwp.codigo} (${gwp.estandarVersion}, ${gwp.horizonteAnios} años)` : 'sin conjunto'}
        </strong>
        . Verificación: suma de líneas {kg(resumen.verificacion.sumaLineasKg)} = suma de alcances{' '}
        {kg(resumen.verificacion.sumaAlcancesKg)} = total {kg(resumen.verificacion.totalKg)} kg;{' '}
        {resumen.verificacion.lineasDuplicadas} líneas duplicadas —{' '}
        <strong>{resumen.verificacion.coincide ? 'coincide' : 'NO coincide'}</strong>.
      </p>

      <div className="cal-bloque-tabla">
        <h3 className="cal-subtitulo">Base GWP de los factores</h3>
        <p className="cal-ayuda">{resumen.estrategiaGwp}</p>
        <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla">
            <thead>
              <tr>
                <th>Base de cálculo</th>
                <th>Líneas</th>
                <th>kg CO₂e</th>
              </tr>
            </thead>
            <tbody>
              {resumen.porBaseGwp.map((base) => (
                <tr key={base.base}>
                  <td>{base.base}</td>
                  <td className="cal-num">{base.lineas}</td>
                  <td className="cal-num">{kg(base.co2eKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla">
            <thead>
              <tr>
                <th>Alcance</th>
                <th>Base GWP</th>
                <th>kg CO₂e</th>
              </tr>
            </thead>
            <tbody>
              {resumen.alcances.flatMap((alcance) =>
                alcance.porBaseGwp.map((base) => (
                  <tr key={`${alcance.codigo}-${base.base}`}>
                    <td>{alcance.nombre}</td>
                    <td>{base.base}</td>
                    <td className="cal-num">{kg(base.co2eKg)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cal-bloque-tabla">
        <h3 className="cal-subtitulo">Emisiones por gas</h3>
        <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
          <table className="cal-historial-tabla">
            <thead>
              <tr>
                <th>Gas</th>
                <th>Especie</th>
                <th>Base</th>
                <th>Masa (kg)</th>
                <th>GWP aplicado</th>
                <th>kg CO₂e</th>
              </tr>
            </thead>
            <tbody>
              {emisiones.map((gas) => (
                <tr key={`${gas.baseCalculo}-${gas.gas}-${gas.especie ?? ''}`}>
                  <td>{gas.gas === 'CO2E' ? 'CO₂e (factor publicado)' : gas.gas}</td>
                  <td>{gas.especie ?? '—'}</td>
                  <td>{gas.baseCalculo === 'CO2E' ? 'CO₂e de la fuente' : 'Masa del gas'}</td>
                  <td className="cal-num">
                    {gas.baseCalculo === 'CO2E' ? '—' : formatoMasa.format(Number(gas.masaKg))}
                  </td>
                  <td className="cal-num">{gas.baseCalculo === 'CO2E' ? 'Ninguno (ya en CO₂e)' : gas.gwp ?? '—'}</td>
                  <td className="cal-num">{kg(gas.co2eKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cal-aviso-caja">
        <Leaf size={17} aria-hidden="true" />
        <div>
          <strong>Reportado aparte, fuera de la huella</strong>
          <span className="cal-celda-detalle">
            CO₂ biogénico: {formatoMasa.format(Number(resumen.memorias.co2BiogenicoKg))} kg · Absorciones:{' '}
            {formatoMasa.format(Number(resumen.memorias.absorcionesKg))} kg CO₂. {resumen.memorias.nota}
            {memorias.length ? ` (${memorias.map((gas) => gas.especie).join(', ')})` : ''}
          </span>
        </div>
      </div>

      {resumen.omitidos.length ? (
        <div className="cal-bloque-tabla">
          <h3 className="cal-subtitulo">Datos no calculados ({resumen.omitidos.length})</h3>
          <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
            <table className="cal-historial-tabla">
              <thead>
                <tr>
                  <th>Dato</th>
                  <th>Alcance</th>
                  <th>Fuente</th>
                  <th>Estado</th>
                  <th>Causa</th>
                </tr>
              </thead>
              <tbody>
                {resumen.omitidos.map((item) => (
                  <tr key={item.datoId}>
                    <td className="cal-num">{item.datoId}</td>
                    <td>{item.alcanceCodigo ?? '—'}</td>
                    <td>
                      {[item.fuenteCodigo, item.fuenteNombre].filter(Boolean).join(' · ')}
                    </td>
                    <td>
                      <span className="cal-estado revision">
                        {CLASIFICACION[item.clasificacion] ?? item.clasificacion}
                      </span>
                    </td>
                    <td>{item.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <p className="cal-ayuda">
        Catálogo de fuentes:{' '}
        {Object.entries(resumen.coberturaCatalogo)
          .map(([estado, total]) => `${ESTADO_FICHA[estado] ?? estado}: ${total}`)
          .join(' · ')}
        .
      </p>
    </section>
  )
}

/** Trazabilidad por línea guardada: dato, método, factor, gas, base GWP y CO2e. */
export function TablaTrazabilidad({ lineas }: { lineas: LineaCalculo[] }) {
  const [simbolosUnidad, setSimbolosUnidad] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let activa = true
    void listarUnidades()
      .then((unidades) => {
        if (activa) setSimbolosUnidad(new Map(unidades.map((unidad) => [String(unidad.id), unidad.symbol])))
      })
      .catch(() => {
        // Los valores y unidades permanecen trazados por ID; nunca se inventa un símbolo.
        if (activa) setSimbolosUnidad(new Map())
      })
    return () => {
      activa = false
    }
  }, [])

  return (
    <div className="cal-tabla-envoltura cal-historial-tabla-envoltura">
      <table className="cal-historial-tabla">
        <thead>
          <tr>
            <th>Alcance</th>
            <th>Fuente</th>
            <th>Cantidad original</th>
            <th>Cantidad convertida con el factor aplicado</th>
            <th>Método</th>
            <th>Factor</th>
            <th>Gas</th>
            <th>Emisión del gas</th>
            <th>Base GWP</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea) => (
            <tr key={linea.id}>
              <td>{linea.alcanceNombre || linea.alcanceCodigo}</td>
              <td>
                {[linea.fuenteCodigo, linea.fuenteNombre].filter(Boolean).join(' · ')}
                <span className="cal-celda-detalle">
                  {linea.actividadNombre}
                  {linea.procesoNombre ? ` · ${linea.procesoNombre}` : ''}
                </span>
              </td>
              <td className="cal-num">
                {linea.cantidadOriginal || '—'}{' '}
                {linea.unidadOriginalId ? (simbolosUnidad.get(linea.unidadOriginalId) || 'Unidad no disponible') : ''}
              </td>
              <td className="cal-num">
                {linea.cantidadConvertida
                  ? `${linea.cantidadConvertida} ${linea.unidadFactorId ? (simbolosUnidad.get(linea.unidadFactorId) || 'Unidad no disponible') : 'Unidad no disponible'}`
                  : 'Conversión no registrada'}
              </td>
              <td>{linea.metodologia || '—'}</td>
              <td className="cal-num">
                {linea.factorValor || '—'}
                <span className="cal-celda-detalle">
                  {[linea.factorCodigo, linea.factorFuente, linea.factorAnioAplicacion]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </td>
              <td>
                {linea.gasCalculado || '—'}
                {linea.gasEspecifico ? <span className="cal-celda-detalle">{linea.gasEspecifico}</span> : null}
              </td>
              <td className="cal-num">{linea.cantidadEmision || '—'}</td>
              <td>
                {linea.baseFactor === 'CO2E'
                  ? `CO₂e publicado · ${linea.gwpBaseFactor || 'GWP no declarado'}`
                  : linea.valorGwp
                    ? `GWP ${linea.valorGwp}${linea.gwpVersion ? ` (${linea.gwpVersion})` : ''}`
                    : linea.baseFactor === 'MASA_GAS'
                      ? 'Memoria fuera del total (0 CO₂e)'
                      : '—'}
              </td>
              <td className="cal-resultado cal-num">
                {linea.valorCo2e} {linea.unidad}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
