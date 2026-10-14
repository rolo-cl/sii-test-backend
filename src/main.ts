import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger, SWAGGER_PATH } from './app.setup';
import { loadConfig } from './config/app.config';
import { createLogger } from './config/logger.factory';

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, {
    logger: createLogger(config),
  });

  configureApp(app);
  if (config.swaggerEnabled) {
    setupSwagger(app);
  }
  app.enableCors({
    origin: config.corsOrigin.split(',').map((o) => o.trim()),
    exposedHeaders: ['X-Request-Id'],
  });
  app.enableShutdownHooks();

  await app.listen(config.port);

  const logger = new Logger('Bootstrap');
  logger.log(
    `BFF escuchando en el puerto ${config.port} (logs: nivel=${config.logLevel}, formato=${config.logFormat})`,
  );
  if (config.swaggerEnabled) {
    logger.log(`Swagger disponible en /${SWAGGER_PATH}`);
  }
}
void bootstrap();
