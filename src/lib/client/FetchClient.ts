import {
  HttpClient, HttpMethod, HttpOptions, HttpRequest,
} from 'simple-http-request-builder';
import { HttpPromise, unwrapHttpPromise } from '../promise/HttpPromise';
import { processHandlers, FetchResponseHandler, networkErrorCatcher } from '../handler/FetchResponseHandlers';
import { HttpResponse } from './HttpResponse';

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
      credentials: httpRequest.optionValues.credentials,
      signal: httpRequest.optionValues.timeoutAbortController.signal,
    },
  )
    .finally(() => clearTimeout(timeoutHandle));
};

/**
 * A {@link HttpClient} that uses:
 * - {@link fetchClientExecutor} to execute an {@link HttpRequest}
 * - {@link FetchResponseHandler} handlers to validate and transform the response with {@link processHandlers}
 *
 * There are two outcomes for the execution of the {@link HttpRequest}:
 * - If the execution is successful (an HTTP response has been received),
 * handlers will be executed and the result of the first handler to return will be returned.
 * If no handler return a result, the HTTP response parsed body JSON object will be returned.
 * - Else it means that there is a network issue,
 * or that the request has been cancelled using the {@link HttpOptions#timeoutAbortController}
 * (see {@link HttpRequest#optionValues} for details),
 * or else it means there is a bug in the library...
 *
 * @param httpRequest The {@link HttpRequest} to execute
 * @param handlers The {@link FetchResponseHandler}s to execute on an OK response (status code = 2xx)
 */
export const fetchClient = <T = Response>(httpRequest: HttpRequest<unknown>, ...handlers: FetchResponseHandler[])
  : Promise<HttpResponse<T>> => <Promise<HttpResponse<T>>>fetchClientExecutor(httpRequest)
    .then((response: Response) => processHandlers(response, handlers))
    .catch(networkErrorCatcher);

/**
 * A {@link HttpClient} that uses {@link HttpRequest} and returns a `Promise<HttpResponse<T>>`.
 *
 * This is used by {@link createHttpFetchRequest} to make fetch requests.
 *
 * Common clients are:
 * - {@link defaultJsonFetchClient} for REST JSON API
 * - raw {@link fetchClient} for non-JSON API (so often just for binary content)
 */
export type HttpFetchClient<T> = (httpRequest: HttpRequest<unknown>) => Promise<HttpResponse<T>>;

/**
 * Factory function to create fetch {@link HttpRequest}.
 *
 * @param baseUrl The base URL. It should not contain an ending slash. A valid base URL is: http://hostname/api
 * @param method The HTTP method used for the request, see {@link HttpMethod}
 * @param path The path of the endpoint to call, it should be composed with a leading slash
 * and will be appended to the {@link HttpRequest#baseUrl}. A valid path is: /users
 * @param httpClient The fetch client that uses {@link HttpRequest} and returns a `Promise<HttpResponse<T>>`
 * @param options Optional options to configure the request
 */
export const createHttpFetchRequest = <T>(
  baseUrl: string,
  method: HttpMethod,
  path: string,
  httpClient: HttpFetchClient<T>,
  options?: Partial<HttpOptions>,
)
  : HttpRequest<HttpPromise<T>> => new HttpRequest<HttpPromise<T>>(
    (httpRequest: HttpRequest<unknown>) => new HttpPromise<T>(
      unwrapHttpPromise(httpClient(httpRequest)),
      httpRequest,
    ),
    baseUrl,
    method,
    path,
    options,
  );
