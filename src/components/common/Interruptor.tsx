interface InterruptorProps {
  id: string
  etiqueta: string
  descripcion?: string
  activo: boolean
  onCambio: (valor: boolean) => void
}

/** Interruptor real (role="switch") reutilizable en formularios de ajustes. */
export default function Interruptor({
  id,
  etiqueta,
  descripcion,
  activo,
  onCambio,
}: InterruptorProps) {
  return (
    <div className="vst-fila">
      <div className="vst-fila-texto">
        <label htmlFor={id}>{etiqueta}</label>
        {descripcion ? <p>{descripcion}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        className="vst-switch"
        aria-checked={activo}
        aria-label={etiqueta}
        onClick={() => onCambio(!activo)}
      />
    </div>
  )
}
