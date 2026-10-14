import { ConsoleLogger } from '@nestjs/common';
import { LOG_LEVELS, type AppConfig } from './app.config';

/**
 * Logger de la aplicación. `pretty` es legible en consola; `json` emite una línea JSON por log,
 * pensado para agregadores (Loki, CloudWatch, ELK, etc.).
 */
export function createLogger({
  logLevel,
  logFormat,
}: AppConfig): ConsoleLogger {
  const enabledLevels = LOG_LEVELS.slice(0, LOG_LEVELS.indexOf(logLevel) + 1);
  return new ConsoleLogger({
    prefix: 'BFF',
    logLevels: enabledLevels,
    json: logFormat === 'json',
    colors: logFormat === 'pretty',
  });
}
