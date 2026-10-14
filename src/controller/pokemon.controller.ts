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
@ApiBadGatewayResponse({ description: 'PokéAPI falló o no está disponible' })
@ApiGatewayTimeoutResponse({ description: 'PokéAPI no respondió a tiempo' })
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  /**
   * Lista el catálogo paginado, con filtro opcional por nombre
   */
  @ApiBadRequestResponse({ description: 'Parámetros de consulta inválidos' })
  @Get()
  list(@Query() query: ListPokemonQueryDto): Promise<PokemonPage> {
    return this.pokemonService.list(query);
  }

  /**
   * Obtiene el detalle de un Pokémon
   */
  @ApiParam({
    name: 'idOrName',
    description:
      'Nombre del Pokémon (sin distinguir mayúsculas) o su número de Pokédex nacional',
    example: 'pikachu',
  })
  @ApiBadRequestResponse({ description: 'Id o nombre con formato inválido' })
  @ApiNotFoundResponse({ description: 'Pokémon no encontrado' })
  @Get(':idOrName')
  detail(
    @Param('idOrName', PokemonIdOrNamePipe) idOrName: string,
  ): Promise<PokemonDetail> {
    return this.pokemonService.getDetail(idOrName);
  }
}
