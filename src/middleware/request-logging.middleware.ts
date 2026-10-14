import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from '../util/request-context';

export const REQUEST_ID_HEADER = 'x-request-id';

/** Solo se acepta un id entrante con formato seguro, para evitar inyección en los logs. */
const VALID_REQUEST_ID = /^[\w-]{1,64}$/;

/** Rutas muy frecuentes y sin interés (healthcheck de Docker) se registran solo en nivel verbose. */
const QUIET_PATHS = ['/api/health'];

/**
 * Registra cada request HTTP (método, ruta, status y duración) y le asigna un id de correlación.
 * El id viene del header `X-Request-Id` (lo envía el frontend) o se genera uno nuevo,
 * y se devuelve en la respuesta.
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const incomingId = req.header(REQUEST_ID_HEADER);
    const requestId =
      incomingId && VALID_REQUEST_ID.test(incomingId)
        ? incomingId
        : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const startedAt = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const message = `[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;

      if (res.statusCode >= 500) this.logger.error(message);
      else if (res.statusCode >= 400) this.logger.warn(message);
      else if (QUIET_PATHS.includes(req.originalUrl.split('?')[0]))
        this.logger.verbose(message);
      else this.logger.log(message);
    });

    requestContext.run({ requestId }, next);
  }
}
