import { Inject, Injectable, Logger } from '@nestjs/common';
import { TtlCache } from '../util/ttl-cache';
import { APP_CONFIG, type AppConfig } from '../config/app.config';
import { PokeApiDao } from '../dao/pokeapi.dao';
import type { PokeApiSpecies } from '../entity/pokeapi.entity';
import { toDetail, toSummary } from '../mapper/pokemon.mapper';
import type {
  PokemonDetail,
  PokemonPage,
  PokemonSummary,
} from '../dto/pokemon-response.dto';
import { normalizeName } from '../util/normalize-name';
import { withRequestId } from '../util/request-context';

export interface ListParams {
  page: number;
  pageSize: number;
  search?: string;
}

const INDEX_KEY = 'index';

@Injectable()
export class PokemonService {
  private readonly logger = new Logger(PokemonService.name);
  private readonly indexCache: TtlCache<PokemonSummary[]>;
  private readonly detailCache: TtlCache<PokemonDetail>;

  constructor(
    private readonly pokeApiDao: PokeApiDao,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.indexCache = new TtlCache(config.cacheTtlMs, 1);
    this.detailCache = new TtlCache(config.cacheTtlMs, config.cacheMaxEntries);
  }

  async list({ page, pageSize, search }: ListParams): Promise<PokemonPage> {
    const index = await this.getIndex();
    const term = search ? normalizeName(search) : '';
    const filtered = term ? this.filterByName(index, term) : index;

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const start = (page - 1) * pageSize;

    return {
      count: filtered.length,
      page,
      pageSize,
      totalPages,
      results: filtered.slice(start, start + pageSize),
    };
  }

  getDetail(idOrName: string): Promise<PokemonDetail> {
    const key = normalizeName(idOrName);
    return this.detailCache.getOrLoad(key, async () => {
      // Solo se ejecuta cuando el detalle no está en caché.
      this.logger.debug(
        withRequestId(`Caché sin "${key}", consultando PokéAPI`),
      );
      const pokemon = await this.pokeApiDao.getPokemon(key);
      const species = await this.getSpeciesSafely(pokemon.species.url);
      return toDetail(pokemon, species);
    });
  }

  private getIndex(): Promise<PokemonSummary[]> {
    return this.indexCache.getOrLoad(INDEX_KEY, async () => {
      const { results } = await this.pokeApiDao.listAllPokemon();
      const index = results
        .map(toSummary)
        .filter((item): item is PokemonSummary => item !== null);
      this.logger.log(
        withRequestId(
          `Índice de Pokémon cargado en caché: ${index.length} entradas`,
        ),
      );
      return index;
    });
  }

  /** Coincidencia parcial; primero van los nombres que empiezan con el término. */
  private filterByName(
    index: PokemonSummary[],
    term: string,
  ): PokemonSummary[] {
    const prefix: PokemonSummary[] = [];
    const contains: PokemonSummary[] = [];
    for (const item of index) {
      if (item.name.startsWith(term)) prefix.push(item);
      else if (item.name.includes(term)) contains.push(item);
    }
    return [...prefix, ...contains];
  }

  /** Los datos de especie solo complementan el detalle; si fallan, el detalle se entrega igual. */
  private async getSpeciesSafely(url: string): Promise<PokeApiSpecies | null> {
    try {
      return await this.pokeApiDao.getSpeciesByUrl(url);
    } catch (error) {
      this.logger.warn(
        withRequestId(
          `No se pudo cargar la especie ${url}; se entrega el detalle sin descripción: ${String(error)}`,
        ),
      );
      return null;
    }
  }
}
