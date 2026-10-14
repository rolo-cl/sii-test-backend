// Contratos de respuesta que se exponen al frontend, independientes del formato de PokéAPI.
// Son clases (no interfaces) para que el plugin de Swagger pueda generar sus esquemas;
// los comentarios JSDoc pasan a ser las descripciones y ejemplos de cada propiedad.

export class PokemonSummary {
  /** @example 25 */
  id!: number;
  /** @example "pikachu" */
  name!: string;
  /** URL del artwork oficial, derivada del id. */
  image!: string;
}

export class PokemonPage {
  /** Total de Pokémon que coinciden con la búsqueda (no solo los de esta página). @example 1351 */
  count!: number;
  /** @example 1 */
  page!: number;
  /** @example 24 */
  pageSize!: number;
  /** @example 57 */
  totalPages!: number;
  results!: PokemonSummary[];
}

export class PokemonStat {
  /** @example "hp" */
  name!: string;
  /** @example 35 */
  value!: number;
}

export class PokemonAbility {
  /** @example "static" */
  name!: string;
  /** Las habilidades ocultas solo aparecen en condiciones especiales. */
  hidden!: boolean;
}

export class PokemonDetail {
  /** @example 25 */
  id!: number;
  /** @example "pikachu" */
  name!: string;
  image!: string | null;
  /** Metros. @example 0.4 */
  height!: number;
  /** Kilogramos. @example 6 */
  weight!: number;
  /** @example 112 */
  baseExperience!: number | null;
  /** Ordenados por slot. @example ["electric"] */
  types!: string[];
  abilities!: PokemonAbility[];
  stats!: PokemonStat[];
  /** Categoría en español, o en inglés si no existe. @example "Pokémon Ratón" */
  genus!: string | null;
  /** Descripción en español, o en inglés si no existe. */
  description!: string | null;
}
