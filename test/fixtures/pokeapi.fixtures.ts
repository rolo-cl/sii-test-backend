import type {
  PokeApiList,
  PokeApiPokemon,
  PokeApiSpecies,
} from '../../src/entity/pokeapi.entity';

const BASE = 'https://pokeapi.co/api/v2';

export const listFixture: PokeApiList = {
  count: 5,
  results: [
    { name: 'bulbasaur', url: `${BASE}/pokemon/1/` },
    { name: 'pikachu', url: `${BASE}/pokemon/25/` },
    { name: 'raichu', url: `${BASE}/pokemon/26/` },
    { name: 'pichu', url: `${BASE}/pokemon/172/` },
    { name: 'pikachu-rock-star', url: `${BASE}/pokemon/10080/` },
  ],
};

export const pikachuFixture: PokeApiPokemon = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  base_experience: 112,
  types: [{ slot: 1, type: { name: 'electric', url: '' } }],
  abilities: [
    { slot: 3, is_hidden: true, ability: { name: 'lightning-rod', url: '' } },
    { slot: 1, is_hidden: false, ability: { name: 'static', url: '' } },
  ],
  stats: [
    { base_stat: 35, stat: { name: 'hp', url: '' } },
    { base_stat: 55, stat: { name: 'attack', url: '' } },
  ],
  sprites: {
    front_default: 'front.png',
    other: { 'official-artwork': { front_default: 'artwork.png' } },
  },
  species: { name: 'pikachu', url: `${BASE}/pokemon-species/25/` },
};

export const pikachuSpeciesFixture: PokeApiSpecies = {
  genera: [
    { genus: 'Mouse Pokémon', language: { name: 'en', url: '' } },
    { genus: 'Pokémon Ratón', language: { name: 'es', url: '' } },
  ],
  flavor_text_entries: [
    {
      flavor_text:
        'When several of\nthese POKéMON gather,\fthey can cause storms.',
      language: { name: 'en', url: '' },
      version: { name: 'red', url: '' },
    },
    {
      flavor_text: 'Cuanto más potente es la\nenergía eléctrica.',
      language: { name: 'es', url: '' },
      version: { name: 'x', url: '' },
    },
  ],
};
