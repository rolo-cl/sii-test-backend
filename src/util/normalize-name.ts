/** Normalizes user input to PokéAPI naming ("Mr Mime" -> "mr-mime"). */
export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}
