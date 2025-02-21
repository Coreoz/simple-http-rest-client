import {
  HttpMethod,
  MultipartHttpClient,
  MultipartHttpOptions,
  MultipartHttpRequest,
} from 'simple-http-request-builder';
import { HttpResponse, networkError, timeoutError } from '../client/HttpResponse';
import { HttpPromise, unwrapHttpPromise } from '../promise/HttpPromise';
import { parseHeadersFromRawString } from './RawHeaderParser';
import { FetchResponseHandler, networkErrorCatcher, processHandlers } from '../handler/FetchResponseHandlers';

export const createResponseFromXhr = (xhr: XMLHttpRequest): Response => {
  // Extract headers from XMLHttpRequest
  const headers: Headers = parseHeadersFromRawString(xhr.getAllResponseHeaders());

  // Create the Response body
  const body = xhr.response;

  // Create the Response object
  return new Response(body, {
    status: xhr.status,
    statusText: xhr.statusText,
    headers,
  });
};

/**
 * Handle multipart request using {@link XMLHttpRequest}
 * @param multipartHttpRequest the request to be executed
 */
export const multipartHttpFetchClientExecutor: MultipartHttpClient<Promise<Response>> = (
  multipartHttpRequest: MultipartHttpRequest<unknown>,
): Promise<Response> => {
  const xhr: XMLHttpRequest = new XMLHttpRequest();

  // Abort request after configured timeout time
  const timeoutHandle: ReturnType<typeof setTimeout> = setTimeout(
    () => xhr.abort(),
    multipartHttpRequest.optionValues.timeoutInMillis,
  );

  // Return a promise that resolves when the request is complete
  return new Promise<Response>((resolve: (value: Response) => void, reject: (reason: Error) => void) => {
    xhr.open(multipartHttpRequest.method, multipartHttpRequest.buildUrl(), true);

    // Set credentials
    xhr.withCredentials = multipartHttpRequest.optionValues.withCredentials;

    // Set headers
    if (multipartHttpRequest.headersValue) {
      for (const [key, value] of Object.entries(multipartHttpRequest.headersValue)) {
        xhr.setRequestHeader(key, value);
      }
    }

    // Handle response
    xhr.onload = () => resolve(createResponseFromXhr(xhr));

    // Handle network errors
    xhr.onerror = () => reject(new Error(networkError.errorCode));

    // Handle request timeout
    xhr.ontimeout = () => reject(new Error(timeoutError.errorCode));

    // Handle progress
    xhr.upload.onprogress = (event: ProgressEvent) => {
      multipartHttpRequest.optionValues.onProgressCallback(event);
    };

    xhr.upload.onerror = () => reject(new Error(networkError.errorCode));

    // Send the request
    xhr.send(multipartHttpRequest.formData);
  })
    .finally(() => clearTimeout(timeoutHandle));
};

/**
 * A {@link MultipartHttpFetchClient} that executes an {@link MultipartHttpRequest} that returns JSON responses.
 * It uses {@link multipartHttpFetchClient} to executes the {@link MultipartHttpRequest}.
 */
export const multipartHttpFetchClient = <T = void>(
  httpRequest: MultipartHttpRequest<unknown>,
  ...handlers: FetchResponseHandler[]
): Promise<HttpResponse<T>> => <Promise<HttpResponse<T>>>multipartHttpFetchClientExecutor(httpRequest)
  .then((response: Response) => processHandlers(response, handlers))
  .catch(networkErrorCatcher);

export type MultipartHttpFetchClient = <T>(
  multipartHttpRequest: MultipartHttpRequest<unknown>,
) => Promise<HttpResponse<T>>;

/**
 * Factory function to create fetch {@link MultipartHttpRequest}.
 *
 * @param baseUrl The base URL. It should not contain an ending slash. A valid base URL is: http://hostname/api
 * @param method The HTTP method used for the request, see {@link HttpMethod}
 * @param path The path of the endpoint to call, it should be composed with a leading slash
 * and will be appended to the {@link MultipartHttpRequest#baseUrl}. A valid path is: /users
 * @param multipartHttpClient The fetch client that uses {@link MultipartHttpRequest} and returns
 * a `Promise<HttpResponse<T>>`
 * @param options Optional options to configure the request
 */
export function createMultipartHttpFetchRequest<T>(
  baseUrl: string,
  method: HttpMethod,
  path: string,
  multipartHttpClient: MultipartHttpFetchClient,
  options?: Partial<MultipartHttpOptions>,
): MultipartHttpRequest<HttpPromise<T>> {
  return new MultipartHttpRequest<HttpPromise<T>>(
    (multipartHttpRequest: MultipartHttpRequest<unknown>) => new HttpPromise<T>(
      unwrapHttpPromise<T>(multipartHttpClient(multipartHttpRequest)),
      multipartHttpRequest,
    ),
    baseUrl,
    method,
    path,
    options,
  );
}
