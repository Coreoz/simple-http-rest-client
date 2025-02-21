import { Logger } from 'simple-logging-system';
import {
  genericError, HttpResponse, networkError, timeoutError, toErrorResponsePromise,
} from '../client/HttpResponse';

const logger = new Logger('FetchResponseHandlers');

/**
 * Handlers are executed by {@link fetchClient} after a successful HTTP response is available:
 * this means an HTTP response has been received (whichever the response statut, 200, 400 or 500...).
 * These handlers will:
 * - Validate some preconditions and if necessary return an error result
 * - Return a result
 *
 * So a handler can:
 * - Either return a result (which can be a successful result or an error),
 * in that case following handlers **will not be executed**
 * - Either return `undefined`, in that case following handlers **will be executed**
 *
 * Expected results should be of type {@link Promise} of {@link HttpResponse}.
 */
export interface FetchResponseHandler<T = unknown> {
  (response: Response): Promise<HttpResponse<T>> | undefined;
}

/**
 * If an {@link FetchResponseHandler handler} raises an error, a {@link genericError} will be returned
 */
// eslint-disable-next-line import/prefer-default-export
export const processHandlers = <T = unknown>(
  response: Response,
  handlers: FetchResponseHandler<T>[],
): Promise<HttpResponse<T>> | undefined => {
  for (const handler of handlers) {
    try {
      const handlerResult = handler(response);
      if (handlerResult !== undefined) {
        return handlerResult;
      }
    } catch (error) {
      logger.error('Error executing handler', { error });
      return toErrorResponsePromise(genericError);
    }
  }
  return Promise.resolve({ response } as HttpResponse<T>);
};

/**
 * Map {@link fetchClientExecutor} Promise errors to {@link HttpError}.
 * See {@link fetchClient} for reasons why these errors may occur.
 *
 * For now `AbortError` are mapped to {@link timeoutError} whereas all the other errors are mapped
 * to the generic {@link networkError}.
 *
 * @param error The raw {@link fetch} Promise {@link Error}
 */
export const networkErrorCatcher = <T>(error: Error): HttpResponse<T> => {
  if (error.name === 'AbortError') {
    return {
      error: timeoutError,
    };
  }
  logger.warn('Cannot connect to HTTP server due to a network error', { error });
  return {
    error: networkError,
  };
};
