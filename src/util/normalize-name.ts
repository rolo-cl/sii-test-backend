/** Normaliza lo que escribe el usuario al formato de nombres de PokéAPI ("Mr Mime" -> "mr-mime"). */
export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}
