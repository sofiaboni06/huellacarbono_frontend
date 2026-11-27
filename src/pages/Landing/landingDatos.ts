import type { LucideIcon } from 'lucide-react'
import { Droplets, Leaf, TreePine, Users } from 'lucide-react'
import pasoLaptop from '../../assets/images/ld-paso-laptop.jpg'
import pasoGraficas from '../../assets/images/ld-paso-graficas.jpg'
import pasoPlaneta from '../../assets/images/ld-paso-planeta.jpg'

export type SeccionId = 'inicio' | 'calculadora' | 'reportes' | 'metodologia' | 'nosotros' | 'equipo'

export const NAV: { id: SeccionId; etiqueta: string; ruta?: string }[] = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'calculadora', etiqueta: 'Calculadora' },
  { id: 'reportes', etiqueta: 'Reportes' },
  { id: 'metodologia', etiqueta: 'Metodología' },
  { id: 'nosotros', etiqueta: 'Sobre Nosotros' },
  { id: 'equipo', etiqueta: 'Equipo', ruta: '/equipo' }
]

export type Tono = 'verde' | 'agua' | 'naturaleza' | 'marino'

export interface Indicador {
  icono: LucideIcon
  tono: Tono
  valor: string
  detalle: string
  variacion: string
  tendencia: 'baja' | 'sube'
}

/** Valores de ejemplo tomados de la referencia visual, no son datos del sistema. */
export const INDICADORES: Indicador[] = [
  { icono: Leaf, tono: 'verde', valor: '2.8 t', detalle: 'CO₂ eq/año', variacion: '18% vs. año anterior', tendencia: 'baja' },
  { icono: Droplets, tono: 'agua', valor: '1.3 mil m³/año', detalle: 'Huella hídrica', variacion: '12% vs. año anterior', tendencia: 'baja' },
  { icono: TreePine, tono: 'naturaleza', valor: '+12 árboles', detalle: 'Equivalentes', variacion: 'Tu impacto positivo', tendencia: 'sube' },
  { icono: Users, tono: 'marino', valor: '+5.000', detalle: 'Personas conscientes', variacion: 'En crecimiento', tendencia: 'sube' },
]

export interface Paso {
  numero: string
  titulo: string
  texto: string
  imagen: string
  alt: string
}

export const PASOS: Paso[] = [
  {
    numero: '01',
    titulo: 'Calcula tu huella',
    texto: 'Responde unas preguntas sobre tu consumo y hábitos.',
    imagen: pasoLaptop,
    alt: 'Portátil con un panel ecológico y hojas verdes',
  },
  {
    numero: '02',
    titulo: 'Analiza tus resultados',
    texto: 'Descubre tu impacto en carbono y agua.',
    imagen: pasoGraficas,
    alt: 'Gráfica de barras ascendente en tonos azules y verdes',
  },
  {
    numero: '03',
    titulo: 'Actúa por el planeta',
    texto: 'Aplica nuestras recomendaciones y haz la diferencia.',
    imagen: pasoPlaneta,
    alt: 'Planeta Tierra rodeado de hojas verdes',
  },
]

export type Miembro = {
  nombre: string
  rol: string
  github?: string
  avatar?: string
  etiquetas?: string[]
}

export const EQUIPO: Miembro[] = [
  {
    nombre: 'Henry Bastidas',
    rol: 'Product Owner',
    avatar: '/avatars/henry.png',
    etiquetas: ['Product Owner'],
  },
  {
    nombre: 'Alex Jhoan Chaguendo',
    rol: 'Tech Lead & Scrum Master | Solution Architect',
    github: 'ALexjh117',
    avatar: '/avatars/alex_fotogit.jpeg',
    etiquetas: ['Scrum Master', 'Lógica de negocio', 'Full Stack'],
  },
  {
    nombre: 'Sofia Bonilla Gallego',
    rol: 'Scrum Master & Team Coordinator · UI/UX',
    github: 'sofiaboni06',
    avatar: '/avatars/sofia-sg.jpeg',
    etiquetas: ['Full Stack', 'UI/UX', 'Team Coordinator'],
  },
  {
    nombre: 'María Paula Santacruz',
    rol: 'Frontend Developer · Web y Móvil · UI/UX',
    github: 'Paulasantacruz',
    avatar: '/avatars/paula-sg.jpeg',
    etiquetas: ['Web', 'Móvil', 'UI/UX'],
  },
  {
    nombre: 'Yusti Mebel Campo',
    rol: 'Full Stack Developer',
    github: 'mebelcampo',
    avatar: '/avatars/mebel-sg.jpeg',
    etiquetas: ['Full Stack', 'Web', 'Api', 'UI/UX'],
  },
  {
    nombre: 'Andres Mauricio Bustamante',
    rol: 'Full Stack Developer',
    github: 'MauricioG-Dev',
    avatar: '/avatars/mauricio.jpeg',
    etiquetas: ['Full Stack', 'Web', 'Quality Assurance'],
  },
]
