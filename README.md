# Explorador de Pokémon — BFF (NestJS)

Backend for Frontend del desafío **Explorador de Pokémon**. Expone una API pequeña y estable para la aplicación Angular y actúa como intermediario con [PokéAPI](https://pokeapi.co).

La solución está dividida en dos repositorios:

| Repositorio | Contenido |
| --- | --- |
| [`sii-test-backend`](https://github.com/rolo-cl/sii-test-backend) (este) | BFF en NestJS 11 |
| [`sii-test-frontend`](https://github.com/rolo-cl/sii-test-frontend) | Aplicación en Angular 21 |

## Ejecutar la solución completa (Docker)

Requisitos: **Docker** con **Docker Compose v2**. No hace falta Node instalado.

```bash
# Clonar ambos repositorios uno al lado del otro
git clone https://github.com/rolo-cl/sii-test-backend.git
git clone https://github.com/rolo-cl/sii-test-frontend.git

cd sii-test-backend
docker compose up --build
```

- Aplicación: <http://localhost:8080>
- BFF (acceso directo, opcional): <http://localhost:3000/api/pokemon>
- Documentación Swagger: <http://localhost:3000/api/docs> (spec OpenAPI en `/api/docs-json`)

El mismo `docker-compose.yml` existe en ambos repositorios, así que se puede levantar desde cualquiera de los dos. Si los repos no están en carpetas hermanas, indica la ruta con `FRONTEND_CONTEXT=/ruta/al/frontend docker compose up --build`. Los puertos se cambian con `FRONTEND_PORT` y `BACKEND_PORT`.

### Solo el BFF

```bash
docker build -t pokemon-bff .
docker run --rm -p 3000:3000 pokemon-bff
```

### Tests y lint (también con Docker)

```bash
docker run --rm -v "$PWD":/app -v /app/node_modules -w /app node:24-alpine sh -c "npm ci && npm run lint && npm test && npm run test:e2e"
```

Los tests e2e levantan la aplicación Nest completa con `fetch` simulado, así que no dependen de PokéAPI ni de la red.

### Sin Docker (opcional)

Con Node 22+: `npm ci && npm run start:dev`.

## Configuración

Todas las variables son opcionales (ver [`.env.example`](.env.example)):

| Variable | Default | Descripción |
| --- | --- | --- |
| `PORT` | `3000` | Puerto HTTP |
| `CORS_ORIGIN` | `http://localhost:4200` | Orígenes permitidos (separados por coma). Solo se usa cuando el frontend no está detrás del mismo origen, por ejemplo con `ng serve` sin proxy |
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | URL base de PokéAPI |
| `POKEAPI_TIMEOUT_MS` | `8000` | Timeout por request a PokéAPI |
| `CACHE_TTL_SECONDS` | `3600` | TTL de la caché en memoria |
| `CACHE_MAX_ENTRIES` | `500` | Máximo de detalles cacheados |
| `SWAGGER_ENABLED` | `true` | Publica la documentación en `/api/docs`. Con `false` se desactiva |

## API

Todas las rutas tienen el prefijo `/api` (definido en [`app.setup.ts`](src/app.setup.ts)). La documentación interactiva está en **`/api/docs`**.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/pokemon?page=1&pageSize=24&search=char` | Catálogo paginado. `search` filtra por nombre (coincidencia parcial, sin distinguir mayúsculas). `pageSize` máximo 100 |
| `GET` | `/api/pokemon/:idOrName` | Detalle normalizado de un Pokémon por nombre o id |
| `GET` | `/api/health` | Healthcheck (lo usa Docker) |
| `GET` | `/api/docs` | Swagger UI (`/api/docs-json` entrega el spec OpenAPI) |

Controladores: [`PokemonController`](src/controller/pokemon.controller.ts) y [`HealthController`](src/controller/health.controller.ts).

Ejemplo de respuesta de detalle:

```json
{
  "id": 25,
  "name": "pikachu",
  "image": "https://raw.githubusercontent.com/.../official-artwork/25.png",
  "height": 0.4,
  "weight": 6,
  "baseExperience": 112,
  "types": ["electric"],
  "abilities": [{ "name": "static", "hidden": false }, { "name": "lightning-rod", "hidden": true }],
  "stats": [{ "name": "hp", "value": 35 }, "..."],
  "genus": "Pokémon Ratón",
  "description": "Levanta su cola para vigilar los alrededores..."
}
```

Errores: `400` si los parámetros son inválidos, `404` si el Pokémon no existe, `502` o `504` si PokéAPI falla o no responde a tiempo.

## Estructura del código

El código está organizado por capas, al estilo Java EE. Cada request fluye `controller → service → dao`:

```
src/
├── controller/   Capa REST: rutas, validación de entrada y documentación Swagger
├── service/      Lógica de negocio: búsqueda, paginación, caché y composición del detalle
├── dao/          Acceso a datos: único punto que habla con PokéAPI y traduce sus errores a HTTP
├── entity/       Tipos crudos que devuelve PokéAPI (lo que entrega el DAO)
├── dto/          Contratos de entrada (query params) y de respuesta hacia el frontend
├── mapper/       Conversión entity → DTO (unidades, idioma, orden)
├── pipe/         Validación del parámetro de ruta
├── config/       Configuración leída desde variables de entorno
├── util/         Utilidades genéricas (caché TTL, normalización de nombres)
├── app.module.ts Registro de controllers y providers (inyección de dependencias)
├── app.setup.ts  Prefijo /api, ValidationPipe global y Swagger
└── main.ts       Punto de entrada
test/
├── app.e2e-spec.ts   Tests e2e
└── fixtures/         Respuestas simuladas de PokéAPI
```

Los tests unitarios (`*.spec.ts`) están junto al archivo que prueban, según la convención de NestJS/Jest.

## Decisiones técnicas

- **Contratos propios en vez de reenviar PokéAPI.** El BFF devuelve solo lo que la UI necesita, con unidades convertidas (m/kg), habilidades ordenadas y textos en español (con inglés como respaldo). El payload de detalle pasa de ~300 KB a menos de 1 KB, y el frontend no conoce la forma de PokéAPI.
- **Búsqueda por nombre en el BFF.** PokéAPI no permite buscar por coincidencia parcial. El BFF descarga una vez el índice de nombres (~1.350 entradas, un payload liviano), lo cachea y filtra y pagina en memoria. Así, catálogo y búsqueda comparten el mismo endpoint, y los resultados que *empiezan* con el término aparecen primero.
- **Imágenes sin requests extra.** La URL del artwork oficial se deriva del id, así el listado no hace una llamada por Pokémon.
- **Caché en memoria con TTL** ([`ttl-cache.ts`](src/util/ttl-cache.ts)): guarda *promesas*, de modo que requests concurrentes por el mismo recurso comparten una sola llamada a PokéAPI. Los errores no se cachean, y hay un límite de entradas. Implementarla tomaba ~40 líneas, así que no agregué dependencias.
- **Degradación parcial:** si falla `pokemon-species` (descripción y categoría), el detalle se devuelve igual con esos campos en `null`.
- **Validación en el borde** con `class-validator` y un pipe para el parámetro de ruta, de modo que una entrada malformada nunca llega a PokéAPI.
- **Swagger autogenerado** con el plugin de CLI de `@nestjs/swagger` (configurado en [`nest-cli.json`](nest-cli.json)). Los esquemas se infieren en el build a partir de los tipos TypeScript, los decoradores de `class-validator` y los comentarios JSDoc. Por eso los contratos de respuesta ([`pokemon-response.dto.ts`](src/dto/pokemon-response.dto.ts)) son clases y no interfaces. Los decoradores manuales se limitan a lo que no se puede inferir: tags, respuestas de error y el parámetro de ruta.
- `fetch` nativo de Node con `AbortSignal.timeout` en lugar de `@nestjs/axios`: es una dependencia menos para un cliente HTTP muy simple.
- **Docker:** build multi-stage, imagen final solo con dependencias de producción, usuario no root y `HEALTHCHECK`.

## Limitaciones y fuera de alcance

- La caché es **en memoria y por instancia**. Con varias réplicas, lo natural sería Redis (la interfaz de `TtlCache` permite reemplazarla sin tocar el servicio).
- El índice incluye las **formas alternativas** que PokéAPI lista como Pokémon (megaevoluciones, formas regionales, ids > 10000). Algunas no tienen artwork oficial; el frontend muestra un placeholder.
- Los nombres de habilidades se muestran tal como vienen de PokéAPI (en inglés). Traducirlos requería una llamada adicional por habilidad.
- No hay rate limiting ni autenticación.
- El plugin de Swagger se aplica en el build de Nest (`nest build` / `nest start`), no en Jest. Los esquemas solo se pueden ver en la app compilada; el test e2e verifica que existan las rutas en el spec.

## Herramientas utilizadas

NestJS 11, TypeScript, @nestjs/swagger, class-validator / class-transformer, Jest + Supertest, ESLint + Prettier, Docker / Docker Compose. Usé Claude Code como asistente de desarrollo.
