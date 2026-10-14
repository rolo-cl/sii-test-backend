import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app.config';
import type {
  PokeApiList,
  PokeApiPokemon,
  PokeApiSpecies,
} from '../entity/pokeapi.entity';

/** Data access object for PokéAPI (thin HTTP client). Translates upstream failures into HTTP exceptions. */
@Injectable()
export class PokeApiDao {
  private readonly logger = new Logger(PokeApiDao.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  listAllPokemon(): Promise<PokeApiList> {
    // PokéAPI has no name search, so the full index (~1.3k entries, small payload) is fetched once.
    return this.get<PokeApiList>('/pokemon?limit=100000&offset=0');
  }

  getPokemon(idOrName: string): Promise<PokeApiPokemon> {
    return this.get<PokeApiPokemon>(`/pokemon/${encodeURIComponent(idOrName)}`);
  }

  getSpeciesByUrl(url: string): Promise<PokeApiSpecies> {
    return this.request<PokeApiSpecies>(url);
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>(`${this.config.pokeApiBaseUrl}${path}`);
  }

  private async request<T>(url: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.config.pokeApiTimeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        this.logger.warn(`Timeout calling ${url}`);
        throw new GatewayTimeoutException('PokéAPI did not respond in time');
      }
      this.logger.error(`Network error calling ${url}: ${String(error)}`);
      throw new BadGatewayException('PokéAPI is unreachable');
    }

    if (response.status === 404) {
      throw new NotFoundException('Pokémon not found');
    }
    if (!response.ok) {
      this.logger.error(`PokéAPI responded ${response.status} for ${url}`);
      throw new BadGatewayException('PokéAPI returned an unexpected error');
    }

    return (await response.json()) as T;
  }
}
