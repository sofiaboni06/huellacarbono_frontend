export type Cobertura = 'cubierto' | 'parcial'

export interface DocumentoGuia {
  id: string
  titulo: string
  origen: string
  resumen: string
  archivo: string
  archivoNombre: string
}

export interface CrucePaso {
  guia: string
  titulo: string
  segunGuia: string
  enPlataforma: string
  donde: string
  cobertura: Cobertura
  pendiente: string
}

export interface BloqueGuia {
  id: string
  titulo: string
  parrafos: string[]
  filas?: { titulo: string; detalle: string }[]
}

/** Documentos que entregó el product owner. El cruce de abajo sigue este mismo procedimiento. */
export const DOCUMENTOS_GUIA: DocumentoGuia[] = [
  {
    id: 'calculo',
    titulo: 'Guía de cálculo de la huella de carbono',
    origen: 'Metodologías, variables, actividades, fórmulas y aplicación en productos',
    resumen:
      'Procedimiento para medir una organización, un proceso o un producto: límites, alcances, datos de actividad, factores, fórmula, intensidad, plan de reducción e informe.',
    archivo: '/guias/guia-calculo-huella-carbono.docx',
    archivoNombre: 'Guia_calculo_huella_de_carbono.docx',
  },
  {
    id: 'practica',
    titulo: 'Guía práctica paso a paso',
    origen: 'Misma metodología, redactada como recorrido de aprendizaje',
    resumen:
      'Recorre las mismas ocho etapas, con las variables por actividad, los alcances 1, 2 y 3, y el ejercicio de la fábrica de empaques.',
    archivo: '/guias/guia-practica-huella-carbono.docx',
    archivoNombre: 'Guia_practica_huella_carbono.docx',
  },
]

/**
 * Cruce provisional para que el product owner compare el procedimiento de las guías
 * con lo que ya hace la calculadora de huella de carbono.
 */
export const CRUCE_PROCESO: CrucePaso[] = [
  {
    guia: 'Paso 1',
    titulo: 'Definir objetivo y alcance',
    segunGuia:
      'Se responde qué se mide, dónde, qué actividades entran y en qué periodo. Los límites son organizacional, operacional y temporal. En un producto se define además la unidad funcional.',
    enPlataforma:
      'El paso 1 de la calculadora fija la organización y el periodo de medición. Las sedes quedan en la ficha de la organización y salen en el informe.',
    donde: 'Huella de carbono · paso 1',
    cobertura: 'cubierto',
    pendiente:
      'Todavía no se elige el enfoque de consolidación (control operacional, control financiero o participación accionaria). La unidad funcional se pide en el paso 3, junto con las unidades producidas.',
  },
  {
    guia: 'Paso 2',
    titulo: 'Identificar fuentes y alcances',
    segunGuia:
      'Las fuentes se clasifican en alcance 1 (directas), alcance 2 (energía adquirida) y alcance 3 (cadena de valor). No todas son obligatorias: se documenta qué entra y qué queda por fuera.',
    enPlataforma:
      'Cada consumo del paso 2 lleva actividad, proceso, fuente y alcance. El resultado y el PDF los agrupan por alcance.',
    donde: 'Huella de carbono · paso 2',
    cobertura: 'cubierto',
    pendiente:
      'No hay un campo aparte para dejar por escrito los criterios de inclusión y exclusión del inventario.',
  },
  {
    guia: 'Paso 3',
    titulo: 'Recopilar datos de actividad',
    segunGuia:
      'La cantidad sale de facturas, bitácoras o registros de producción, con su unidad y su evidencia. La guía recomienda cubrir los doce meses del periodo.',
    enPlataforma:
      'El paso 2 guarda cantidad, unidad y documento de soporte por cada actividad del periodo elegido.',
    donde: 'Huella de carbono · paso 2',
    cobertura: 'cubierto',
    pendiente:
      'El periodo lo define la organización. La pantalla no exige que el inventario cubra doce meses.',
  },
  {
    guia: 'Paso 4',
    titulo: 'Seleccionar factores de emisión',
    segunGuia:
      'Cada actividad se convierte con un factor documentado (valor, unidad, año, cobertura y fuente). En Colombia se prefieren factores nacionales, como el del SIN de la UPME, cuando apliquen.',
    enPlataforma:
      'Los factores viven en Catálogos, atados a una versión de metodología. En el paso 3 se elige esa versión y el cálculo usa el factor vigente de la fuente y la unidad.',
    donde: 'Catálogos y paso 3',
    cobertura: 'cubierto',
    pendiente:
      'Si el factor está en un gas suelto, la guía pide multiplicar también por el potencial de calentamiento global. Hoy el cálculo espera el factor ya expresado en kg CO₂e.',
  },
  {
    guia: 'Paso 5',
    titulo: 'Calcular las emisiones',
    segunGuia:
      'La fórmula general es emisiones (kg CO₂e) = dato de actividad × factor de emisión. El ejercicio de la guía da 500 + 415,8 + 175 = 1.090,8 kg CO₂e.',
    enPlataforma:
      'El paso 3 aplica esa multiplicación a los consumos activos y guarda el cálculo. Los números del ejemplo están en la guía rápida de la misma pantalla, para contrastar.',
    donde: 'Huella de carbono · paso 3',
    cobertura: 'cubierto',
    pendiente:
      'Los factores del ejemplo son didácticos. Un inventario real debe usar los factores cargados en catálogos, no esos valores de práctica.',
  },
  {
    guia: 'Paso 6',
    titulo: 'Consolidar por fuente y alcance',
    segunGuia:
      'Se suma el total, se pasa a toneladas (dividir entre 1.000) y, si hay producción, se calcula la intensidad: total ÷ unidades. El ejemplo con 10.000 empaques da 0,10908 kg CO₂e por unidad.',
    enPlataforma:
      'El paso 4 muestra el total, las toneladas, la intensidad y el desglose por actividad, proceso, alcance y fuente. El informe también agrupa por fuente y por alcance.',
    donde: 'Huella de carbono · paso 4',
    cobertura: 'cubierto',
    pendiente:
      'La intensidad solo aparece si en el paso 3 se informaron las unidades producidas. Los gráficos de evolución están en Reportes.',
  },
  {
    guia: 'Paso 7',
    titulo: 'Analizar y proponer reducción',
    segunGuia:
      'A cada fuente relevante le corresponde una estrategia, un indicador y una meta cuantificable, comparable con una línea base del mismo límite y periodo.',
    enPlataforma:
      'Al terminar el cálculo, el paso 4 arma el plan con fuente, estrategia, indicador y meta, y lo incluye en el PDF.',
    donde: 'Huella de carbono · paso 4',
    cobertura: 'parcial',
    pendiente:
      'Falta el seguimiento: comparar un periodo posterior contra la línea base y ver el porcentaje de reducción alcanzado.',
  },
  {
    guia: 'Paso 8',
    titulo: 'Elaborar el informe',
    segunGuia:
      'El informe identifica organización o producto, objetivo, metodología, periodo, límites, datos, factores, fórmula, resultados, plan, limitaciones y evidencias. Una declaración formal puede pedir verificación independiente.',
    enPlataforma:
      'El PDF del paso 4 reúne organización, NIT, sedes, periodo, metodología, datos de actividad, factores, resultados por fuente y alcance, y el plan de reducción.',
    donde: 'Informe PDF del paso 4',
    cobertura: 'parcial',
    pendiente:
      'El informe todavía no tiene bloques propios de limitaciones, incertidumbres, exclusiones ni de verificación independiente.',
  },
]

export const BLOQUES_GUIA: BloqueGuia[] = [
  {
    id: 'que-es',
    titulo: 'Qué mide la huella',
    parrafos: [
      'La huella de carbono es el total de gases de efecto invernadero de lo que se evalúa: una organización, un proceso, un servicio o un producto. El resultado se expresa en kg CO₂e o en t CO₂e.',
      'Para sumar gases distintos se usa el potencial de calentamiento global y se deja documentada la versión de esos valores. Los gases que contempla la guía son CO₂, CH₄, N₂O, HFC, PFC, SF₆ y NF₃.',
    ],
  },
  {
    id: 'metodologias',
    titulo: 'Metodologías',
    parrafos: [
      'Antes de calcular se decide si el objeto es una organización, un proceso o un producto. Para empresa o institución, la guía recomienda GHG Protocol o ISO 14064-1. Para un producto o empaque, ISO 14067 junto con el análisis de ciclo de vida (ISO 14040 e ISO 14044). El IPCC aporta directrices y factores por fuente.',
      'En la plataforma esa elección es la versión de metodología del paso 3. El catálogo puede tener GHG Protocol, ISO 14064-1, ISO 14067 o IPCC; el cálculo usa la versión que se seleccione.',
    ],
    filas: [
      { titulo: 'GHG Protocol', detalle: 'Inventario organizacional. Clasifica en alcances 1, 2 y 3.' },
      { titulo: 'ISO 14064-1', detalle: 'Cuantificación y reporte de emisiones de la organización.' },
      { titulo: 'ISO 14067', detalle: 'Huella del producto a lo largo de su ciclo de vida.' },
      { titulo: 'IPCC', detalle: 'Directrices para energía, agricultura, residuos e industria.' },
    ],
  },
  {
    id: 'alcances',
    titulo: 'Alcances 1, 2 y 3',
    parrafos: [
      'El límite operacional dice qué fuentes se contabilizan. La guía las agrupa así, y el registro de consumos pide el alcance en cada fila.',
    ],
    filas: [
      {
        titulo: 'Alcance 1 · directas',
        detalle: 'Fuentes propias o bajo control: combustibles de vehículos y calderas, plantas y fugas de refrigerante.',
      },
      {
        titulo: 'Alcance 2 · energía adquirida',
        detalle: 'Electricidad, vapor, calor o refrigeración comprados y consumidos.',
      },
      {
        titulo: 'Alcance 3 · otras indirectas',
        detalle: 'Cadena de valor: materias primas, transporte contratado, residuos, distribución y fin de vida.',
      },
    ],
  },
  {
    id: 'formula',
    titulo: 'Fórmula y ejercicio de la guía',
    parrafos: [
      'Cuando el factor ya está en CO₂ equivalente: emisiones (kg CO₂e) = dato de actividad × factor de emisión. Si el factor es de un solo gas, se multiplica además por su potencial de calentamiento global.',
      'Ejercicio didáctico de la fábrica de empaques: 2.500 kWh × 0,20 = 500 kg CO₂e (alcance 2); 180 L de gasolina × 2,31 = 415,8 kg CO₂e (alcance 1); 350 kg de residuos × 0,50 = 175 kg CO₂e (alcance 3). Total: 1.090,8 kg CO₂e, es decir 1,0908 t CO₂e. Con 10.000 empaques, la intensidad es 0,10908 kg CO₂e por empaque.',
      'Esos factores son de práctica. La guía pide no usarlos como factores oficiales de un inventario colombiano.',
    ],
  },
  {
    id: 'producto',
    titulo: 'Producto o empaque',
    parrafos: [
      'La huella de producto no se mezcla con la organizacional: cambian la unidad de análisis, los límites y las reglas. El ciclo de vida puede ir de la cuna a la puerta, de la cuna a la tumba o de la cuna a la cuna.',
      'El lote de «empaque de cartón» de la guía suma 130 kg CO₂e (100 kg de cartón, 150 kWh y 200 t·km). Con 1.000 empaques, quedan 0,13 kg CO₂e por empaque.',
      'Hoy la calculadora permite cargar esas actividades por proceso y sacar la intensidad por unidad funcional. Todavía no hay un selector del límite de ciclo de vida.',
    ],
  },
]

export const CHEQUEO: { item: string; cobertura: Cobertura; donde: string }[] = [
  { item: 'Objetivo, organización y periodo', cobertura: 'cubierto', donde: 'Paso 1' },
  { item: 'Metodología reconocida y su versión', cobertura: 'cubierto', donde: 'Paso 3 y catálogos' },
  { item: 'Fuentes directas e indirectas con alcance', cobertura: 'cubierto', donde: 'Paso 2' },
  { item: 'Datos de actividad, unidad y evidencia', cobertura: 'cubierto', donde: 'Paso 2' },
  { item: 'Factores documentados por fuente y unidad', cobertura: 'cubierto', donde: 'Catálogos' },
  { item: 'Fórmula dato × factor en CO₂e', cobertura: 'cubierto', donde: 'Paso 3' },
  { item: 'Total, toneladas e intensidad', cobertura: 'cubierto', donde: 'Paso 4' },
  { item: 'Resultado por fuente y por alcance', cobertura: 'cubierto', donde: 'Paso 4 e informe' },
  { item: 'Plan con estrategia, indicador y meta', cobertura: 'parcial', donde: 'Paso 4, sin seguimiento' },
  { item: 'Informe con datos, factores y resultados', cobertura: 'parcial', donde: 'PDF, sin limitaciones ni verificación' },
  { item: 'Enfoque de consolidación del inventario', cobertura: 'parcial', donde: 'No se pide en pantalla' },
  { item: 'Factor de un gas suelto × PCG', cobertura: 'parcial', donde: 'El factor debe venir ya en CO₂e' },
  { item: 'Límite de ciclo de vida del producto', cobertura: 'parcial', donde: 'Solo intensidad y procesos' },
]
