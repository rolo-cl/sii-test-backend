import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api/docs';

/** HTTP-level setup shared by the real server and the e2e tests. */
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
 * Serves the OpenAPI UI at /api/docs and the spec at /api/docs-json.
 * Schemas are generated at build time by the @nestjs/swagger CLI plugin (see nest-cli.json).
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Pokémon Explorer BFF')
    .setDescription(
      'Backend for Frontend that exposes a trimmed, frontend-friendly view of PokéAPI.',
    )
    .setVersion('1.0')
    .build();

  SwaggerModule.setup(SWAGGER_PATH, app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
