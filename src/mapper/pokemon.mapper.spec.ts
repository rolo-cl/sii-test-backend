import {
  pikachuFixture,
  pikachuSpeciesFixture,
} from '../../test/fixtures/pokeapi.fixtures';
import { idFromResourceUrl, toDetail, toSummary } from './pokemon.mapper';

describe('pokemon.mapper', () => {
  it('extracts ids from resource URLs', () => {
    expect(idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25);
    expect(idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/25')).toBe(25);
    expect(idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/')).toBeNull();
  });

  it('builds a summary with the official artwork URL', () => {
    expect(
      toSummary({
        name: 'pikachu',
        url: 'https://pokeapi.co/api/v2/pokemon/25/',
      }),
    ).toEqual({
      id: 25,
      name: 'pikachu',
      image: expect.stringMatching(/official-artwork\/25\.png$/) as string,
    });
  });

  it('maps a detail with converted units, sorted abilities and Spanish texts', () => {
    const detail = toDetail(pikachuFixture, pikachuSpeciesFixture);

    expect(detail).toMatchObject({
      id: 25,
      name: 'pikachu',
      image: 'artwork.png',
      height: 0.4,
      weight: 6,
      types: ['electric'],
      abilities: [
        { name: 'static', hidden: false },
        { name: 'lightning-rod', hidden: true },
      ],
      stats: [
        { name: 'hp', value: 35 },
        { name: 'attack', value: 55 },
      ],
      genus: 'Pokémon Ratón',
      description: 'Cuanto más potente es la energía eléctrica.',
    });
  });

  it('falls back to English and tolerates missing species', () => {
    const englishOnly = {
      ...pikachuSpeciesFixture,
      genera: pikachuSpeciesFixture.genera.filter(
        (g) => g.language.name === 'en',
      ),
      flavor_text_entries: pikachuSpeciesFixture.flavor_text_entries.filter(
        (f) => f.language.name === 'en',
      ),
    };
    expect(toDetail(pikachuFixture, englishOnly).description).toBe(
      'When several of these POKéMON gather, they can cause storms.',
    );
    expect(toDetail(pikachuFixture, null)).toMatchObject({
      genus: null,
      description: null,
    });
  });
});
