// Subconjunto de las respuestas de PokéAPI v2 que realmente usa el BFF.

export interface NamedApiResource {
  name: string;
  url: string;
}

export interface PokeApiList {
  count: number;
  results: NamedApiResource[];
}

export interface PokeApiPokemon {
  id: number;
  name: string;
  height: number; // decímetros
  weight: number; // hectogramos
  base_experience: number | null;
  types: { slot: number; type: NamedApiResource }[];
  abilities: { is_hidden: boolean; slot: number; ability: NamedApiResource }[];
  stats: { base_stat: number; stat: NamedApiResource }[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null };
    };
  };
  species: NamedApiResource;
}

export interface PokeApiSpecies {
  genera: { genus: string; language: NamedApiResource }[];
  flavor_text_entries: {
    flavor_text: string;
    language: NamedApiResource;
    version: NamedApiResource;
  }[];
}
