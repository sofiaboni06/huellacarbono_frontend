import { useEffect, useState, type RefObject } from 'react'
import type { SeccionId } from '../landingDatos'

/** Muestra con una transición los elementos marcados con `data-revelar` al entrar en pantalla. */
export function useRevelar(raiz: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nodos = raiz.current?.querySelectorAll<HTMLElement>('[data-revelar]')
    if (!nodos?.length) return
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducido || !('IntersectionObserver' in window)) {
      nodos.forEach((n) => n.classList.add('es-visible'))
      return
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('es-visible')
          observador.unobserve(e.target)
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    nodos.forEach((n) => observador.observe(n))
    return () => observador.disconnect()
  }, [raiz])
}

/** Devuelve la sección que cruza el centro de la ventana, para marcarla en la navegación. */
export function useSeccionActiva(ids: SeccionId[]) {
  const [activa, setActiva] = useState<SeccionId>(ids[0])

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) setActiva(e.target.id as SeccionId)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const nodo = document.getElementById(id)
      if (nodo) observador.observe(nodo)
    })
    return () => observador.disconnect()
  }, [ids])

  return activa
}

/** Indica si la página ya se desplazó, para dar fondo a la barra fija. */
export function useDesplazado(centinela: RefObject<HTMLElement | null>) {
  const [desplazado, setDesplazado] = useState(false)

  useEffect(() => {
    const nodo = centinela.current
    if (!nodo) return
    const observador = new IntersectionObserver(([e]) => setDesplazado(!e.isIntersecting))
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [centinela])

  return desplazado
}
