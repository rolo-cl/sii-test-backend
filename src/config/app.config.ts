export interface AppConfig {
  port: number;
  corsOrigin: string;
  pokeApiBaseUrl: string;
  pokeApiTimeoutMs: number;
  cacheTtlMs: number;
  cacheMaxEntries: number;
  swaggerEnabled: boolean;
}

export const APP_CONFIG = Symbol('APP_CONFIG');

function intFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
  };
}
