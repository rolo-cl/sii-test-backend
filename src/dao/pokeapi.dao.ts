import {
  BadGatewayException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app.config';
import { withRequestId } from '../util/request-context';
import type {
  PokeApiList,
  PokeApiPokemon,
  PokeApiSpecies,
} from '../entity/pokeapi.entity';

/** DAO de PokéAPI (cliente HTTP liviano). Traduce las fallas de PokéAPI a excepciones HTTP. */
@Injectable()
export class PokeApiDao {
  private readonly logger = new Logger(PokeApiDao.name);

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  listAllPokemon(): Promise<PokeApiList> {
    // PokéAPI no permite buscar por nombre, así que se descarga una vez el índice completo (~1.300 entradas, payload liviano).
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
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(this.config.pokeApiTimeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        this.logger.warn(
          withRequestId(
            `Timeout llamando a ${url} (${this.config.pokeApiTimeoutMs}ms)`,
          ),
        );
        throw new GatewayTimeoutException('PokéAPI did not respond in time');
      }
      this.logger.error(
        withRequestId(`Error de red llamando a ${url}: ${String(error)}`),
      );
      throw new BadGatewayException('PokéAPI is unreachable');
    }

    this.logger.debug(
      withRequestId(
        `PokéAPI GET ${url} -> ${response.status} (${Date.now() - startedAt}ms)`,
      ),
    );

    if (response.status === 404) {
      throw new NotFoundException('Pokémon not found');
    }
    if (!response.ok) {
      this.logger.error(
        withRequestId(`PokéAPI respondió ${response.status} para ${url}`),
      );
      throw new BadGatewayException('PokéAPI returned an unexpected error');
    }

    return (await response.json()) as T;
  }
}
