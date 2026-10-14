import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp, setupSwagger } from '../src/app.setup';
import {
  listFixture,
  pikachuFixture,
  pikachuSpeciesFixture,
} from './fixtures/pokeapi.fixtures';

/** Simula el fetch global para probar el BFF de punta a punta sin llamar a PokéAPI. */
function mockPokeApi(): jest.SpyInstance {
  return jest.spyOn(global, 'fetch').mockImplementation((input) => {
    const url =
      input instanceof Request
        ? input.url
        : input instanceof URL
          ? input.href
          : input;
    const json = (body: unknown, status = 200) =>
      Promise.resolve(new Response(JSON.stringify(body), { status }));

    if (url.includes('/pokemon?limit=')) return json(listFixture);
    if (url.endsWith('/pokemon/pikachu')) return json(pikachuFixture);
    if (url.includes('/pokemon-species/25')) return json(pikachuSpeciesFixture);
    return json({}, 404);
  });
}

describe('BFF (e2e)', () => {
  let app: INestApplication<App>;
  let fetchSpy: jest.SpyInstance;

  beforeAll(async () => {
    fetchSpy = mockPokeApi();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    fetchSpy.mockRestore();
  });

  it('GET /api/health', () =>
    request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' }));

  it('GET /api/pokemon applies defaults', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/pokemon')
      .expect(200);
    expect(res.body).toMatchObject({
      count: 5,
      page: 1,
      pageSize: 24,
      totalPages: 1,
    });
  });

  it('GET /api/pokemon?search=rai filters by name', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/pokemon?search=rai&pageSize=5')
      .expect(200);
    expect(res.body).toMatchObject({
      count: 1,
      results: [{ id: 26, name: 'raichu' }],
    });
  });

  it('GET /api/pokemon rejects invalid query params', () =>
    request(app.getHttpServer()).get('/api/pokemon?pageSize=500').expect(400));

  it('GET /api/pokemon/:name returns the mapped detail', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/pokemon/Pikachu')
      .expect(200);
    expect(res.body).toMatchObject({ id: 25, name: 'pikachu', weight: 6 });
  });

  it('GET /api/pokemon/:name returns 404 for unknown pokemon', () =>
    request(app.getHttpServer()).get('/api/pokemon/missingno').expect(404));

  it('GET /api/pokemon/:name rejects malformed names', () =>
    request(app.getHttpServer()).get('/api/pokemon/pika%3Bchu').expect(400));

  it('GET /api/docs-json exposes the OpenAPI spec', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    const body = res.body as { paths: Record<string, unknown> };
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining([
        '/api/pokemon',
        '/api/pokemon/{idOrName}',
        '/api/health',
      ]),
    );
  });

  describe('X-Request-Id', () => {
    it('genera un id cuando el request no trae uno', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('reutiliza el id enviado por el cliente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/pokemon/pikachu')
        .set('X-Request-Id', 'front-abc123')
        .expect(200);
      expect(res.headers['x-request-id']).toBe('front-abc123');
    });

    it('descarta ids con formato inseguro', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .set('X-Request-Id', 'evil id; <script>')
        .expect(200);
      expect(res.headers['x-request-id']).not.toContain('evil');
    });
  });
});
