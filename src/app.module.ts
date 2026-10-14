import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_CONFIG, loadConfig } from './config/app.config';
import { HealthController } from './controller/health.controller';
import { PokemonController } from './controller/pokemon.controller';
import { PokeApiDao } from './dao/pokeapi.dao';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
import { PokemonService } from './service/pokemon.service';

@Module({
  controllers: [PokemonController, HealthController],
  providers: [
    { provide: APP_CONFIG, useFactory: loadConfig },
    PokemonService,
    PokeApiDao,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*path');
  }
}
