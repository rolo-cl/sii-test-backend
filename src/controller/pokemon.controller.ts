import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiGatewayTimeoutResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ListPokemonQueryDto } from '../dto/list-pokemon-query.dto';
import { PokemonDetail, PokemonPage } from '../dto/pokemon-response.dto';
import { PokemonService } from '../service/pokemon.service';
import { PokemonIdOrNamePipe } from '../pipe/pokemon-id-or-name.pipe';

@ApiTags('pokemon')
@ApiBadGatewayResponse({ description: 'PokéAPI failed or is unreachable' })
@ApiGatewayTimeoutResponse({ description: 'PokéAPI did not respond in time' })
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  /**
   * List the catalog, paginated and optionally filtered by name
   */
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @Get()
  list(@Query() query: ListPokemonQueryDto): Promise<PokemonPage> {
    return this.pokemonService.list(query);
  }

  /**
   * Get the detail of a Pokémon
   */
  @ApiParam({
    name: 'idOrName',
    description: 'Pokémon name (case-insensitive) or national dex id',
    example: 'pikachu',
  })
  @ApiBadRequestResponse({ description: 'Malformed id or name' })
  @ApiNotFoundResponse({ description: 'Pokémon not found' })
  @Get(':idOrName')
  detail(
    @Param('idOrName', PokemonIdOrNamePipe) idOrName: string,
  ): Promise<PokemonDetail> {
    return this.pokemonService.getDetail(idOrName);
  }
}
