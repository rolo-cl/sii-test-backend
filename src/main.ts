import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './app.setup';
import { APP_CONFIG, type AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  configureApp(app);
  if (config.swaggerEnabled) {
    setupSwagger(app);
  }
  app.enableCors({ origin: config.corsOrigin.split(',').map((o) => o.trim()) });
  app.enableShutdownHooks();

  await app.listen(config.port);
}
void bootstrap();
