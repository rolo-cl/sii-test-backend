import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  requestId: string;
}

/**
 * Contexto por request, disponible en cualquier capa sin pasarlo como parámetro.
 * Permite que los logs del service y del DAO incluyan el id del request que los originó.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/** Antepone `[requestId]` al mensaje cuando se ejecuta dentro de un request. */
export function withRequestId(message: string): string {
  const requestId = requestContext.getStore()?.requestId;
  return requestId ? `[${requestId}] ${message}` : message;
}
