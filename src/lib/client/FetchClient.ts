import { Logger } from 'simple-logging-system';
import {
  HttpRequest,
  HttpClient,
  HttpMethod
} from 'simple-http-request-builder';
import {
  genericError,
  HttpResponse,
  toErrorResponsePromise,
  networkError,
  timeoutError,
} from './HttpResponse';
import { HttpPromise, unwrapHttpPromise } from '../promise/HttpPromise';

const logger = new Logger('FetchClient');

/**
 * A {@link HttpClient} that executes an {@link HttpRequest}
 * using a timeout specified with {@link HttpRequest#optionValues}.
 *
 * Returns the result of the {@link fetch} execution, i.e. a `Promise<Response>`.
 *
 * @param httpRequest The request to execute
 */
export const fetchClientExecutor: HttpClient<Promise<Response>> = (httpRequest: HttpRequest<unknown>)
: Promise<Response> => {
  const timeoutHandle = setTimeout(
    () => httpRequest.optionValues.timeoutAbortController.abort(),
    httpRequest.optionValues.timeoutInMillis,
  );
  return fetch(
    httpRequest.buildUrl(),
    {
      headers: httpRequest.headersValue,
      method: httpRequest.method,
      body: httpRequest.bodyValue,
      credentials: 'same-origin',
      signal: httpRequest.optionValues.timeoutAbortController.signal,
    },
  )
    .finally(() => clearTimeout(timeoutHandle));
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
  logger.error('Cannot connect to HTTP server due to a network error', error);
  return {
    error: networkError,
  };
};

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
 * A {@link HttpClient} that uses:
 * - {@link fetchClientExecutor} to execute an {@link HttpRequest}
 * - {@link FetchResponseHandler handlers} to validate and transform the response
 *
 * There are two outcomes for the execution of the {@link HttpRequest}:
 * - If the execution is successful (an HTTP response has been received),
 * handlers will be executed and the result of the first handler to return will be returned.
 * If no handler return a result, the HTTP response parsed body JSON object will be returned.
 * - Else it means that there is a network issue,
 * or that the request has been cancelled using the {@link HttpOptions#timeoutAbortController}
 * (see {@link HttpRequest#optionValues} for details),
 * or else it means there is a bug in the library...
 * in any case {@link networkErrorCatcher} will be executed to map the error to an {@link HttpError}
 *
 * If an {@link FetchResponseHandler handler} raises an error, a {@link genericError} will be returned
 *
 * @param httpRequest The {@link HttpRequest} to execute
 * @param handlers The {@link FetchResponseHandler}s to execute on an OK response (status code = 2xx)
 */
export const fetchClient = <T = Response>(httpRequest: HttpRequest<unknown>, ...handlers: FetchResponseHandler[])
  : Promise<HttpResponse<T>> => <Promise<HttpResponse<T>>> fetchClientExecutor(httpRequest)
    .then((response) => {
      for (const handler of handlers) {
        try {
          const handlerResult = handler(response);
          if (handlerResult !== undefined) {
            return handlerResult;
          }
        } catch (error) {
          logger.error('Error executing handler', handler, error);
          return toErrorResponsePromise(genericError);
        }
      }
      return { response };
    })
    .catch(networkErrorCatcher);

/**
 * A {@link HttpClient} that returns a `Promise<HttpResponse<T>>`.
 *
 * This is used by {@link createHttpFetchRequest} to make fetch requests.
 *
 * Common clients are:
 * - {@link defaultJsonFetchClient} for REST JSON API
 * - raw {@link fetchClient} for non-JSON API (so often just for binary content)
 */
export type HttpFetchClient = <T>(httpRequest: HttpRequest<unknown>) => Promise<HttpResponse<T>>;

export const createHttpFetchRequest = <T>(baseUrl: string, method: HttpMethod, path: string, httpClient: HttpFetchClient)
  : HttpRequest<HttpPromise<T>> => new HttpRequest<HttpPromise<T>>(
  (httpRequest) => new HttpPromise<T>(
    unwrapHttpPromise(httpClient(httpRequest)),
    httpRequest,
  ),
  baseUrl,
  method,
  path,
);
