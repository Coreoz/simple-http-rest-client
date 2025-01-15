import { HttpMethod } from 'simple-http-request-builder';
import { HttpPromise, unwrapHttpPromise } from '../promise/HttpPromise';
import { networkErrorCatcher } from '../client/FetchClient';
import {
  genericError, HttpResponse, networkError, timeoutError,
} from '../client/HttpResponse';
import {
  MultipartHttpClient,
  MultipartHttpOptions,
  MultipartHttpRequest,
} from './MultipartHttpRequest';

/**
 * Handle multipart request using {@link XMLHttpRequest}
 * @param multipartHttpRequest the request to be executed
 */
export const multipartHttpFetchClientExecutor: MultipartHttpClient<Promise<unknown>> = (
  multipartHttpRequest: MultipartHttpRequest<unknown>,
): Promise<unknown> => {
  const xhr: XMLHttpRequest = new XMLHttpRequest();

  // Abort request after configured timeout time
  const timeoutHandle: ReturnType<typeof setTimeout> = setTimeout(
    () => xhr.abort(),
    multipartHttpRequest.optionValues.timeoutInMillis,
  );

  // Return a promise that resolves when the request is complete
  return new Promise<unknown>((resolve: (value: unknown) => void) => {
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
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        return resolve({ response: JSON.parse(xhr.response) });
      }
      return resolve({ error: JSON.parse(xhr.response) ?? genericError });
    };

    // Handle network errors
    xhr.onerror = () => resolve({ error: networkError });

    // Handle request timeout
    xhr.ontimeout = () => resolve({ error: timeoutError });

    // Handle progress
    xhr.upload.onprogress = (event: ProgressEvent) => {
      multipartHttpRequest.optionValues.onProgressCallback(event);
    };

    xhr.upload.onerror = () => resolve({ error: genericError });

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
): Promise<HttpResponse<T>> => <Promise<HttpResponse<T>>>multipartHttpFetchClientExecutor(httpRequest)
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
