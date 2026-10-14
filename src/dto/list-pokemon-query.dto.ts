import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListPokemonQueryDto {
  /** Número de página, empezando en 1. */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  /** Cantidad de resultados por página. */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 24;

  /**
   * Búsqueda parcial por nombre, sin distinguir mayúsculas. Primero van los nombres que empiezan con el término.
   * @example "char"
   */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;
}
