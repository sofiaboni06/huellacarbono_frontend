import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import './Modal.css'

interface ModalProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  ancho?: string
}

export default function Modal({ abierto, titulo, onCerrar, children, ancho = '460px' }: ModalProps) {
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div className="modal-overlay" onMouseDown={onCerrar} role="presentation">
      <div
        className="modal-panel"
        style={{ maxWidth: ancho }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="modal-head">
          <h3>{titulo}</h3>
          <button type="button" className="modal-close" onClick={onCerrar} aria-label="Cerrar ventana">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
