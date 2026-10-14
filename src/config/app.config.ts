import type { LogLevel } from '@nestjs/common';

export type LogFormat = 'pretty' | 'json';

export interface AppConfig {
  port: number;
  corsOrigin: string;
  pokeApiBaseUrl: string;
  pokeApiTimeoutMs: number;
  cacheTtlMs: number;
  cacheMaxEntries: number;
  swaggerEnabled: boolean;
  logLevel: LogLevel;
  logFormat: LogFormat;
}

export const APP_CONFIG = Symbol('APP_CONFIG');

function intFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Niveles de Nest ordenados de más a menos severo. */
export const LOG_LEVELS: LogLevel[] = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
];

function logLevelFromEnv(): LogLevel {
  const value = process.env.LOG_LEVEL as LogLevel | undefined;
  return value && LOG_LEVELS.includes(value) ? value : 'log';
}

export function loadConfig(): AppConfig {
  return {
    port: intFromEnv('PORT', 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
    pokeApiBaseUrl: (
      process.env.POKEAPI_BASE_URL ?? 'https://pokeapi.co/api/v2'
    ).replace(/\/+$/, ''),
    pokeApiTimeoutMs: intFromEnv('POKEAPI_TIMEOUT_MS', 8000),
    cacheTtlMs: intFromEnv('CACHE_TTL_SECONDS', 3600) * 1000,
    cacheMaxEntries: intFromEnv('CACHE_MAX_ENTRIES', 500),
    swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
    logLevel: logLevelFromEnv(),
    logFormat: process.env.LOG_FORMAT === 'json' ? 'json' : 'pretty',
  };
}
