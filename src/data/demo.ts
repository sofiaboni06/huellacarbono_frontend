/** Datos de demostración de la plataforma HuellaVerde.
 * No representan información de un servidor real. */

export interface NotificacionDemo {
  id: string
  titulo: string
  mensaje: string
  tiempo: string
  leida: boolean
  tipo: 'exito' | 'info' | 'usuario' | 'alerta'
}

export const NOTIFICACIONES_INICIALES: NotificacionDemo[] = [
  {
    id: 'n1',
    titulo: 'Cálculo de Huella Hídrica completado',
    mensaje: 'El periodo 2026-I fue procesado correctamente.',
    tiempo: 'Hace 5 min',
    leida: false,
    tipo: 'exito',
  },
  {
    id: 'n2',
    titulo: 'Nuevo reporte disponible: 2026-I',
    mensaje: 'El Reporte General ya se puede consultar y descargar.',
    tiempo: 'Hace 1 h',
    leida: false,
    tipo: 'info',
  },
  {
    id: 'n3',
    titulo: 'Usuario María López asignado',
    mensaje: 'María López se unió a la organización SENA.',
    tiempo: 'Hace 2 h',
    leida: true,
    tipo: 'usuario',
  },
  {
    id: 'n4',
    titulo: 'Meta de reducción alcanzada',
    mensaje: 'La reducción lograda se mantiene en 18% del periodo.',
    tiempo: 'Ayer',
    leida: true,
    tipo: 'exito',
  },
]

export interface ActividadItem {
  id: string
  texto: string
  tiempo: string
  tipo: 'exito' | 'info' | 'usuario'
}

export const ACTIVIDAD_RECIENTE: ActividadItem[] = [
  { id: 'a1', texto: 'Cálculo de Huella Hídrica completado', tiempo: 'Hace 5 min', tipo: 'exito' },
  { id: 'a2', texto: 'Nuevo reporte disponible: 2026-I', tiempo: 'Hace 1 h', tipo: 'info' },
  { id: 'a3', texto: 'Usuario María López asignado', tiempo: 'Hace 2 h', tipo: 'usuario' },
]

export interface ReporteDemo {
  id: string
  titulo: string
  formato: string
  descripcion: string
}

export const REPORTES_DISPONIBLES: ReporteDemo[] = [
  { id: 'r1', titulo: 'Reporte General', formato: 'PDF', descripcion: 'Resumen integral del periodo' },
  { id: 'r2', titulo: 'Análisis por Periodo', formato: 'PDF', descripcion: 'Comparativa mensual 2026-I' },
  { id: 'r3', titulo: 'Comparativo Anual', formato: 'PDF', descripcion: '2025 vs 2026' },
]

export const REPORTES_ADICIONALES: ReporteDemo[] = [
  { id: 'r4', titulo: 'Huella Hídrica por Sede', formato: 'PDF', descripcion: 'Desglose por sede' },
  { id: 'r5', titulo: 'Inventario de Emisiones', formato: 'PDF', descripcion: 'Fuentes de carbono' },
  { id: 'r6', titulo: 'Resumen de Agua', formato: 'PDF', descripcion: 'Consumo y reúso' },
]

export const PERIODOS = ['2026-I', '2025-II', '2025-I', '2024-II']

export const SEDES = ['Sede Principal', 'Sede Bogotá', 'Sede Regional Costa', 'Sede Regional Andes']

export interface FaqItem {
  id: string
  pregunta: string
  respuesta: string
}

export const PREGUNTAS_FRECUENTES: FaqItem[] = [
  {
    id: 'f1',
    pregunta: '¿Qué es la Huella Hídrica?',
    respuesta:
      'Es la cantidad total de agua utilizada directa e indirectamente por la organización durante un periodo de medición. En HuellaVerde se expresa en metros cúbicos (m³).',
  },
  {
    id: 'f2',
    pregunta: '¿Qué es la Huella de Carbono?',
    respuesta:
      'Es la suma de gases de efecto invernadero emitidos por las actividades de la organización, expresada en toneladas equivalentes de CO₂ (tCO₂e).',
  },
  {
    id: 'f3',
    pregunta: '¿Cómo creo un nuevo cálculo?',
    respuesta:
      'Ingresa a Cálculos, elige el tipo de huella, completa los tres pasos (datos básicos, consumo y resultados) y guarda el resultado en el historial.',
  },
  {
    id: 'f4',
    pregunta: '¿Puedo exportar los reportes?',
    respuesta:
      'Sí. En la sección Reportes puedes descargar el Reporte General, el Análisis por Periodo y el Comparativo Anual en formato PDF.',
  },
  {
    id: 'f5',
    pregunta: '¿Quién puede editar mi perfil?',
    respuesta:
      'Tú puedes actualizar tu información personal desde Mi perfil. Los datos de organización y rol los administran los usuarios administradores.',
  },
]

export const GUIAS_USO = [
  {
    id: 'g1',
    titulo: 'Primeros pasos en HuellaVerde',
    descripcion: 'Configura tu organización, periodo y sede en menos de 5 minutos.',
    duracion: '5 min',
  },
  {
    id: 'g2',
    titulo: 'Registrar el consumo del periodo',
    descripcion: 'Captura los datos de agua, energía, combustible y transporte.',
    duracion: '8 min',
  },
  {
    id: 'g3',
    titulo: 'Interpretar el dashboard',
    descripcion: 'Lee los indicadores, tendencias y accesos rápidos del inicio.',
    duracion: '4 min',
  },
  {
    id: 'g4',
    titulo: 'Generar y compartir reportes',
    descripcion: 'Descarga los PDF disponibles y compáralos entre periodos.',
    duracion: '6 min',
  },
]

export interface HistorialItem {
  id: string
  tipo: string
  periodo: string
  sede: string
  resultado: string
  fecha: string
  estado: string
}

export const HISTORIAL_DEMO: HistorialItem[] = [
  { id: 'h1', tipo: 'Huella Hídrica', periodo: '2026-I', sede: 'Sede Principal', resultado: '1.245 m³', fecha: '06/11/2026', estado: 'Completado' },
  { id: 'h2', tipo: 'Huella de Carbono', periodo: '2026-I', sede: 'Sede Principal', resultado: '892 tCO₂e', fecha: '05/11/2026', estado: 'Completado' },
  { id: 'h3', tipo: 'Huella Hídrica', periodo: '2025-II', sede: 'Sede Bogotá', resultado: '1.108 m³', fecha: '18/10/2026', estado: 'Completado' },
  { id: 'h4', tipo: 'Huella de Carbono', periodo: '2025-II', sede: 'Sede Regional Costa', resultado: '945 tCO₂e', fecha: '12/10/2026', estado: 'En revisión' },
  { id: 'h5', tipo: 'Huella Hídrica', periodo: '2025-I', sede: 'Sede Principal', resultado: '1.032 m³', fecha: '27/09/2026', estado: 'Completado' },
]

/** Series mensuales de demostración para las gráficas (Ene - Dic). */
export const EVOLUCION_12_MESES = [
  { mes: 'Ene', hidrica: 720, carbono: 430 },
  { mes: 'Feb', hidrica: 1080, carbono: 640 },
  { mes: 'Mar', hidrica: 860, carbono: 520 },
  { mes: 'Abr', hidrica: 1310, carbono: 760 },
  { mes: 'May', hidrica: 1140, carbono: 810 },
  { mes: 'Jun', hidrica: 1260, carbono: 700 },
  { mes: 'Jul', hidrica: 980, carbono: 560 },
  { mes: 'Ago', hidrica: 1180, carbono: 740 },
  { mes: 'Sep', hidrica: 1090, carbono: 690 },
  { mes: 'Oct', hidrica: 1400, carbono: 930 },
  { mes: 'Nov', hidrica: 1150, carbono: 780 },
  { mes: 'Dic', hidrica: 1330, carbono: 860 },
]

export const DISTRIBUCION_FUENTES = [
  { nombre: 'Energía', valor: 68, color: '#3b82f6' },
  { nombre: 'Transporte', valor: 20, color: '#22c55e' },
  { nombre: 'Procesos', valor: 12, color: '#a3e635' },
]

export interface PerfilUsuario {
  nombre: string
  cargo: string
  correo: string
  telefono: string
  organizacion: string
  rol: string
  ultimoAcceso: string
}

export const PERFIL_USUARIO: PerfilUsuario = {
  nombre: 'Sofia Gallego',
  cargo: 'Analista Ambiental',
  correo: 'sofia.gallego@sena.edu.co',
  telefono: '+57 310 456 7890',
  organizacion: 'SENA',
  rol: 'Analista Ambiental',
  ultimoAcceso: '06/11/2026 - 08:45 a.m.',
}
