/**
 * Formato es-CO de un decimal recibido como texto del backend, sin pasarlo por
 * Number: solo cambia separadores, así no altera la precisión calculada.
 */
export function formatoDecimal(valor: string) {
  const [entero, decimales] = valor.split('.')
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimales ? `${miles},${decimales}` : miles
}
