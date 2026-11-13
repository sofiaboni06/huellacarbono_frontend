/**
 * Semillas de datos de demostración del módulo de Gestión.
 *
 * Son los datos con los que arranca la aplicación mientras no exista un
 * backend. Todo lo que hay aquí es etiquetado como demostración: no procede
 * de un servicio real y debe sustituirse por la API cuando esté disponible.
 */

import type { MatrizPermisos, Modulo, Perfil, Regional, Usuario } from './tipos'

/** Regionales administrativas. */
export const REGIONALES: Regional[] = [
  'Regional Bogotá',
  'Regional Antioquia',
  'Regional Valle',
  'Regional Caribe',
  'Regional Oriental',
  'Regional Sur',
]

/** Centros de formación de demostración, agrupados por regional. */
export const CENTROS: Record<Regional, string[]> = {
  'Regional Bogotá': ['SENA Bogotá', 'SENA Chía', 'SENA Soacha'],
  'Regional Antioquia': ['SENA Medellín', 'SENA Bello', 'SENA Itagüí'],
  'Regional Valle': ['SENA Cali', 'SENA Palmira', 'SENA Tuluá'],
  'Regional Caribe': ['SENA Barranquilla', 'SENA Bucaramanga', 'SENA Cartagena'],
  'Regional Oriental': ['SENA Ibagué', 'SENA Neiva', 'SENA Villavicencio'],
  'Regional Sur': ['SENA Pasto', 'SENA Popayán', 'SENA Florencia'],
}

/** Perfiles de acceso de demostración. */
export const PERFILES_DEMO: Perfil[] = [
  {
    id: 'administrador',
    nombre: 'Administrador',
    descripcion: 'Acceso administrativo a la plataforma.',
    estado: 'activo',
  },
  {
    id: 'analista',
    nombre: 'Analista Ambiental',
    descripcion: 'Analiza y reporta datos ambientales.',
    estado: 'activo',
  },
  {
    id: 'consultor',
    nombre: 'Consultor',
    descripcion: 'Consulta información y genera reportes.',
    estado: 'activo',
  },
  {
    id: 'operador',
    nombre: 'Operador',
    descripcion: 'Registra y valida información.',
    estado: 'activo',
  },
]

/** Módulos de HuellaVerde sobre los que se administran permisos. */
export const MODULOS: Modulo[] = [
  { id: 'inicio', nombre: 'Inicio' },
  { id: 'calculo', nombre: 'Cálculo' },
  { id: 'informe', nombre: 'Informe' },
  { id: 'usuarios', nombre: 'Usuarios' },
  { id: 'perfiles', nombre: 'Perfiles' },
  { id: 'roles', nombre: 'Roles y permisos' },
]

type Fila = [boolean, boolean, boolean, boolean]

/** Construye una matriz de permisos a partir de filas compactas. */
function matriz(filas: Record<string, Fila>): MatrizPermisos {
  const salida: MatrizPermisos = {}
  for (const modulo of MODULOS) {
    const [consultar, crear, editar, eliminar] = filas[modulo.id] ?? [false, false, false, false]
    salida[modulo.id] = { consultar, crear, editar, eliminar }
  }
  return salida
}

/** Permisos iniciales de cada perfil (demostración). */
export const PERMISOS_DEMO: Record<string, MatrizPermisos> = {
  administrador: matriz({
    inicio: [true, true, true, true],
    calculo: [true, true, true, true],
    informe: [true, true, true, true],
    usuarios: [true, true, true, true],
    perfiles: [true, true, true, true],
    roles: [true, true, true, true],
  }),
  analista: matriz({
    inicio: [true, false, false, false],
    calculo: [true, true, true, false],
    informe: [true, true, true, false],
    usuarios: [true, false, false, false],
    perfiles: [true, false, false, false],
    roles: [false, false, false, false],
  }),
  consultor: matriz({
    inicio: [true, false, false, false],
    calculo: [true, false, false, false],
    informe: [true, false, false, false],
    usuarios: [true, false, false, false],
    perfiles: [false, false, false, false],
    roles: [false, false, false, false],
  }),
  operador: matriz({
    inicio: [true, false, false, false],
    calculo: [true, true, true, false],
    informe: [true, false, false, false],
    usuarios: [false, false, false, false],
    perfiles: [false, false, false, false],
    roles: [false, false, false, false],
  }),
}

/** Fila de usuario: [tipo, número, nombres, apellidos, correo, teléfono, centro, perfil, estado]. */
type FilaUsuario = [
  TipoDoc,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  'activo' | 'inactivo',
]

type TipoDoc = 'CC' | 'CE' | 'TI' | 'NIT'

const FILAS: FilaUsuario[] = [
  ['CC', '1023456789', 'Sofía', 'Gallego', 'sofia.gallego@sena.edu.co', '3001234567', 'SENA Bogotá', 'Analista Ambiental', 'activo'],
  ['CC', '79456123', 'Carlos', 'Pérez', 'carlos.perez@sena.edu.co', '3012345678', 'SENA Medellín', 'Administrador', 'activo'],
  ['CC', '1019876543', 'María', 'López', 'maria.lopez@sena.edu.co', '3023456789', 'SENA Cali', 'Analista Ambiental', 'activo'],
  ['CC', '1032456781', 'David', 'Rodríguez', 'david.rodriguez@sena.edu.co', '3034567890', 'SENA Bogotá', 'Consultor', 'activo'],
  ['CC', '1045678912', 'Ana', 'Torres', 'ana.torres@sena.edu.co', '3045678901', 'SENA Bucaramanga', 'Operador', 'activo'],
  ['CC', '1056789123', 'Jorge', 'Ramírez', 'jorge.ramirez@sena.edu.co', '3056789012', 'SENA Medellín', 'Consultor', 'activo'],
  ['CE', 'PE987654', 'Laura', 'Gómez', 'laura.gomez@sena.edu.co', '3067890123', 'SENA Bogotá', 'Administrador', 'activo'],
  ['CC', '1067891234', 'Andrés', 'Mejía', 'andres.mejia@sena.edu.co', '3078901234', 'SENA Cali', 'Operador', 'inactivo'],
  ['CC', '1078912345', 'Camila', 'Vargas', 'camila.vargas@sena.edu.co', '3089012345', 'SENA Barranquilla', 'Analista Ambiental', 'activo'],
  ['CC', '1089123456', 'Felipe', 'Castro', 'felipe.castro@sena.edu.co', '3090123456', 'SENA Bucaramanga', 'Consultor', 'activo'],
  ['CC', '1091234567', 'Daniela', 'Ruiz', 'daniela.ruiz@sena.edu.co', '3001112233', 'SENA Medellín', 'Operador', 'activo'],
  ['CC', '1102345678', 'Sebastián', 'Herrera', 'sebastian.herrera@sena.edu.co', '3011122334', 'SENA Bogotá', 'Analista Ambiental', 'inactivo'],
  ['CC', '1113456789', 'Valentina', 'Mora', 'valentina.mora@sena.edu.co', '3021122335', 'SENA Cali', 'Consultor', 'activo'],
  ['NIT', '900123456', 'Ricardo', 'Peña', 'ricardo.pena@sena.edu.co', '3031122336', 'SENA Barranquilla', 'Administrador', 'activo'],
  ['CC', '1124567890', 'Isabela', 'Cruz', 'isabela.cruz@sena.edu.co', '3041122337', 'SENA Bogotá', 'Operador', 'activo'],
  ['CC', '1135678901', 'Mateo', 'Silva', 'mateo.silva@sena.edu.co', '3051122338', 'SENA Medellín', 'Analista Ambiental', 'activo'],
  ['CC', '1146789012', 'Gabriela', 'Ríos', 'gabriela.rios@sena.edu.co', '3061122339', 'SENA Bucaramanga', 'Consultor', 'inactivo'],
  ['CE', 'VE456789', 'Alejandro', 'Nieto', 'alejandro.nieto@sena.edu.co', '3071122340', 'SENA Cali', 'Operador', 'activo'],
  ['CC', '1157890123', 'Carolina', 'Restrepo', 'carolina.restrepo@sena.edu.co', '3081122341', 'SENA Medellín', 'Administrador', 'activo'],
  ['CC', '1168901234', 'Diego', 'Fuentes', 'diego.fuentes@sena.edu.co', '3091122342', 'SENA Barranquilla', 'Analista Ambiental', 'activo'],
  ['CC', '1179012345', 'Paula', 'Guerrero', 'paula.guerrero@sena.edu.co', '3002223344', 'SENA Bogotá', 'Consultor', 'activo'],
  ['CC', '1180123456', 'Nicolás', 'Bravo', 'nicolas.bravo@sena.edu.co', '3012223345', 'SENA Medellín', 'Operador', 'inactivo'],
  ['CC', '1191234567', 'Sandra', 'Melo', 'sandra.melo@sena.edu.co', '3022223346', 'SENA Cali', 'Analista Ambiental', 'activo'],
  ['CC', '1202345678', 'Esteban', 'Villa', 'esteban.villa@sena.edu.co', '3032223347', 'SENA Bucaramanga', 'Consultor', 'activo'],
]

/** Región a la que pertenece cada centro (para derivar la regional en pantalla). */
const REGIONAL_DEL_CENTRO: Record<string, Regional> = {}
for (const [regional, centros] of Object.entries(CENTROS)) {
  for (const centro of centros) REGIONAL_DEL_CENTRO[centro] = regional as Regional
}

/** Convierte las filas compactas en registros completos de usuario. */
function construirUsuarios(): Usuario[] {
  return FILAS.map((fila, indice) => {
    const [tipoDocumento, numeroDocumento, nombres, apellidos, correo, telefono, centro, perfil, estado] = fila
    return {
      id: `usu-${String(indice + 1).padStart(3, '0')}`,
      tipoDocumento,
      numeroDocumento,
      nombres,
      apellidos,
      correo,
      telefono,
      regional: REGIONAL_DEL_CENTRO[centro] ?? 'Regional Bogotá',
      centro,
      perfil,
      estado,
    }
  })
}

/** Usuarios de demostración (24 registros). */
export const USUARIOS_DEMO: Usuario[] = construirUsuarios()

/** Devuelve la regional de un centro conocido. */
export function regionalDe(centro: string): Regional {
  return REGIONAL_DEL_CENTRO[centro] ?? 'Regional Bogotá'
}
