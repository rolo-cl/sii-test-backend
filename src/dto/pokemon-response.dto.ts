// Response contracts exposed to the frontend. Decoupled from PokéAPI's raw shape.
// Declared as classes (not interfaces) so the Swagger CLI plugin can generate their schemas;
// JSDoc comments become property descriptions and examples.

export class PokemonSummary {
  /** @example 25 */
  id!: number;
  /** @example "pikachu" */
  name!: string;
  /** Official artwork URL derived from the id. */
  image!: string;
}

export class PokemonPage {
  /** Total Pokémon matching the search (not just this page). @example 1351 */
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
  /** Hidden abilities only appear under special conditions. */
  hidden!: boolean;
}

export class PokemonDetail {
  /** @example 25 */
  id!: number;
  /** @example "pikachu" */
  name!: string;
  image!: string | null;
  /** Metres. @example 0.4 */
  height!: number;
  /** Kilograms. @example 6 */
  weight!: number;
  /** @example 112 */
  baseExperience!: number | null;
  /** Ordered by slot. @example ["electric"] */
  types!: string[];
  abilities!: PokemonAbility[];
  stats!: PokemonStat[];
  /** Category in Spanish, falling back to English. @example "Pokémon Ratón" */
  genus!: string | null;
  /** Flavor text in Spanish, falling back to English. */
  description!: string | null;
}
