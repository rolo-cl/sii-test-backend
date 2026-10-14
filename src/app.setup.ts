import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api/docs';

/** Configuración HTTP compartida entre el servidor real y los tests e2e. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}

/**
 * Publica la UI de OpenAPI en /api/docs y el spec en /api/docs-json.
 * Los esquemas los genera en el build el plugin de CLI de @nestjs/swagger (ver nest-cli.json).
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('BFF Explorador de Pokémon')
    .setDescription(
      'Backend for Frontend que expone una vista reducida de PokéAPI, adaptada al frontend.',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup(SWAGGER_PATH, app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
