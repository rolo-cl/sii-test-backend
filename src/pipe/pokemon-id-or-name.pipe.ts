import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { normalizeName } from '../util/normalize-name';

const VALID_ID_OR_NAME = /^[a-z0-9-]{1,50}$/;

/** Rejects malformed identifiers before they reach PokéAPI. */
@Injectable()
export class PokemonIdOrNamePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const normalized = normalizeName(value);
    if (!VALID_ID_OR_NAME.test(normalized)) {
      throw new BadRequestException(
        'idOrName must contain only letters, numbers and dashes',
      );
    }
    return normalized;
  }
}
