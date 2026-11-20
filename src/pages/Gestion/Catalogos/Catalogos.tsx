import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../../components/common/PageHeader'
import PlantillaVista from '../../../components/layout/PlantillaVista'
import { usePerfil } from '../../../context/PerfilContext'
import PanelFactores from './PanelFactores'
import PanelMetodologias from './PanelMetodologias'
import PanelParametros from './PanelParametros'
import PanelSimple from './PanelSimple'
import './Catalogos.css'

const SECCIONES = [
  {
    id: 'tipos-agua',
    etiqueta: 'Tipos de agua',
    permiso: 'tipo_agua.ver',
  },
  {
    id: 'componentes',
    etiqueta: 'Componentes hídricos',
    permiso: 'componente_hidrico.ver',
  },
  {
    id: 'alcances',
    etiqueta: 'Alcances',
    permiso: 'alcance_emision.ver',
  },
  {
    id: 'metodologias',
    etiqueta: 'Metodologías',
    permiso: 'metodologia.ver',
  },
  {
    id: 'factores',
    etiqueta: 'Factores de emisión',
    permiso: 'factor_emision.ver',
  },
  {
    id: 'parametros',
    etiqueta: 'Parámetros hídricos',
    permiso: 'parametro_hidrico.ver',
  },
] as const

export default function Catalogos() {
  const { puede } = usePerfil()
  const [params, setParams] = useSearchParams()
  const visibles = useMemo(() => SECCIONES.filter((seccion) => puede(seccion.permiso)), [puede])
  const pedida = params.get('seccion')
  const activa = visibles.find((seccion) => seccion.id === pedida)?.id ?? visibles[0]?.id

  return (
    <PlantillaVista titulo="Catálogos" className="gst gst-usuarios cat">
      <PageHeader
        titulo="Catálogos"
        subtitulo="Listas que después se eligen al medir y al calcular. Unidades y fuentes de emisión se administran aparte."
      />
      <nav className="gst-tabs" aria-label="Catálogos paramétricos">
        {visibles.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            className={`gst-tab ${activa === seccion.id ? 'activo' : ''}`}
            aria-current={activa === seccion.id ? 'page' : undefined}
            onClick={() => setParams({ seccion: seccion.id })}
          >
            {seccion.etiqueta}
          </button>
        ))}
      </nav>

      {activa === 'tipos-agua' ? (
        <PanelSimple
          ruta="tipos-agua"
          titulo="Tipos de agua"
          descripcion="Clasifica el agua que se mide en una actividad: acueducto, pozo, lluvia, residual o reutilizada."
          permisoCrear="tipo_agua.crear"
          permisoEditar="tipo_agua.editar"
        />
      ) : null}
      {activa === 'componentes' ? (
        <PanelSimple
          ruta="componentes-hidricos"
          titulo="Componentes hídricos"
          descripcion="Partes del resultado: agua azul, agua verde y agua gris. No es el agua que se midió."
          permisoCrear="componente_hidrico.crear"
          permisoEditar="componente_hidrico.editar"
        />
      ) : null}
      {activa === 'alcances' ? (
        <PanelSimple
          ruta="alcances-emision"
          titulo="Alcances de emisión"
          descripcion="Alcance 1 es lo que la sede quema o fuga. Alcance 2 es la energía comprada. Alcance 3 es lo indirecto."
          permisoCrear="alcance_emision.crear"
          permisoEditar="alcance_emision.editar"
        />
      ) : null}
      {activa === 'metodologias' ? <PanelMetodologias /> : null}
      {activa === 'factores' ? <PanelFactores /> : null}
      {activa === 'parametros' ? <PanelParametros /> : null}
    </PlantillaVista>
  )
}
