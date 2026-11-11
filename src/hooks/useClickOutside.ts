import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/** Cierra el elemento cuando se hace clic fuera de él. */
export function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
  activo: boolean,
): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!activo) return
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activo, onOutside])

  return ref
}
