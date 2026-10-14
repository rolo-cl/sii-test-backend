import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_CONFIG, type AppConfig } from '../config/app.config';
import { PokeApiDao } from '../dao/pokeapi.dao';
import {
  listFixture,
  pikachuFixture,
  pikachuSpeciesFixture,
} from '../../test/fixtures/pokeapi.fixtures';
import { PokemonService } from './pokemon.service';

describe('PokemonService', () => {
  let service: PokemonService;
  let dao: jest.Mocked<
    Pick<PokeApiDao, 'listAllPokemon' | 'getPokemon' | 'getSpeciesByUrl'>
  >;

  beforeEach(async () => {
    dao = {
      listAllPokemon: jest.fn().mockResolvedValue(listFixture),
      getPokemon: jest.fn().mockResolvedValue(pikachuFixture),
      getSpeciesByUrl: jest.fn().mockResolvedValue(pikachuSpeciesFixture),
    };
    const config: Partial<AppConfig> = {
      cacheTtlMs: 60_000,
      cacheMaxEntries: 10,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PokemonService,
        { provide: PokeApiDao, useValue: dao },
        { provide: APP_CONFIG, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(PokemonService);
  });

  describe('list', () => {
    it('paginates the full index', async () => {
      const page = await service.list({ page: 2, pageSize: 2 });

      expect(page).toMatchObject({
        count: 5,
        page: 2,
        pageSize: 2,
        totalPages: 3,
      });
      expect(page.results.map((p) => p.name)).toEqual(['raichu', 'pichu']);
    });

    it('filters by name, ranking prefix matches first', async () => {
      const page = await service.list({ page: 1, pageSize: 10, search: 'chu' });
      expect(page.results.map((p) => p.name)).toEqual([
        'pikachu',
        'raichu',
        'pichu',
        'pikachu-rock-star',
      ]);

      const prefixed = await service.list({
        page: 1,
        pageSize: 10,
        search: 'pi',
      });
      expect(prefixed.results.map((p) => p.name)).toEqual([
        'pikachu',
        'pichu',
        'pikachu-rock-star',
      ]);
    });

    it('normalizes the search term', async () => {
      const page = await service.list({
        page: 1,
        pageSize: 10,
        search: '  Pikachu Rock ',
      });
      expect(page.results.map((p) => p.name)).toEqual(['pikachu-rock-star']);
    });

    it('returns an empty page when nothing matches', async () => {
      const page = await service.list({ page: 1, pageSize: 10, search: 'zzz' });
      expect(page).toMatchObject({ count: 0, totalPages: 1, results: [] });
    });

    it('fetches the upstream index only once', async () => {
      await service.list({ page: 1, pageSize: 10 });
      await service.list({ page: 2, pageSize: 10, search: 'pi' });
      expect(dao.listAllPokemon).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDetail', () => {
    it('combines pokemon and species data', async () => {
      const detail = await service.getDetail('Pikachu');

      expect(dao.getPokemon).toHaveBeenCalledWith('pikachu');
      expect(detail.genus).toBe('Pokémon Ratón');
    });

    it('caches details', async () => {
      await service.getDetail('pikachu');
      await service.getDetail('pikachu');
      expect(dao.getPokemon).toHaveBeenCalledTimes(1);
    });

    it('still returns the detail when species fails', async () => {
      dao.getSpeciesByUrl.mockRejectedValueOnce(new Error('down'));
      const detail = await service.getDetail('pikachu');
      expect(detail).toMatchObject({ name: 'pikachu', description: null });
    });

    it('propagates not found errors', async () => {
      dao.getPokemon.mockRejectedValueOnce(new NotFoundException());
      await expect(service.getDetail('missingno')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
