import type {
  NamedApiResource,
  PokeApiPokemon,
  PokeApiSpecies,
} from '../entity/pokeapi.entity';
import type {
  PokemonDetail,
  PokemonSummary,
} from '../dto/pokemon-response.dto';

const ARTWORK_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

const PREFERRED_LANGUAGES = ['es', 'en'];

/** Extrae el id numérico de una URL de recurso de PokéAPI (".../pokemon/25/"). */
export function idFromResourceUrl(url: string): number | null {
  const match = /\/(\d+)\/?$/.exec(url);
  return match ? Number(match[1]) : null;
}

export function artworkUrl(id: number): string {
  return `${ARTWORK_BASE_URL}/${id}.png`;
}

export function toSummary(resource: NamedApiResource): PokemonSummary | null {
  const id = idFromResourceUrl(resource.url);
  return id === null
    ? null
    : { id, name: resource.name, image: artworkUrl(id) };
}

function pickByLanguage<T extends { language: NamedApiResource }>(
  entries: T[],
): T | undefined {
  for (const lang of PREFERRED_LANGUAGES) {
    const found = entries.find((entry) => entry.language.name === lang);
    if (found) return found;
  }
  return undefined;
}

/** Las descripciones vienen de los juegos e incluyen saltos de página y de línea forzados. */
function cleanFlavorText(text: string): string {
  return text
    .replace(/[\f\n\r\u00ad]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toDetail(
  pokemon: PokeApiPokemon,
  species: PokeApiSpecies | null,
): PokemonDetail {
  const flavor = species
    ? pickByLanguage(species.flavor_text_entries)
    : undefined;
  const genus = species ? pickByLanguage(species.genera) : undefined;

  return {
    id: pokemon.id,
    name: pokemon.name,
    image:
      pokemon.sprites.other?.['official-artwork']?.front_default ??
      pokemon.sprites.front_default,
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    baseExperience: pokemon.base_experience,
    types: [...pokemon.types]
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name),
    abilities: [...pokemon.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map((a) => ({ name: a.ability.name, hidden: a.is_hidden })),
    stats: pokemon.stats.map((s) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
    genus: genus?.genus ?? null,
    description: flavor ? cleanFlavorText(flavor.flavor_text) : null,
  };
}
