import { HttpError, toErrorResponsePromise } from '../client/HttpResponse';
import { FetchResponseHandler } from './FetchResponseHandlers';

/**
 * A mapping of HTTP status codes to the {@link HttpError} to return when the response
 * has this status code.
 *
 * This enables to handle status codes that are not covered by {@link validateBasicStatusCodes}
 * (403 and 204) without relying on the response body parsing.
 */
export type StatusErrorMap = {
  [status: number]: HttpError,
};

/**
 * A {@link FetchResponseHandler} maker that returns a {@link HttpError} for the configured status codes.
 *
 * For example, to handle 401 and 404 status codes:
 * ```typescript
 * const unauthorizedError = { errorCode: 'UNAUTHORIZED' };
 * const notFoundError = { errorCode: 'NOT_FOUND' };
 * const httpClient = (httpRequest) => fetchClient(
 *   httpRequest,
 *   validateBasicStatusCodes,
 *   validateStatusCodes({ 401: unauthorizedError, 404: notFoundError }),
 *   jsonContentTypeValidator,
 *   toJsonResponse,
 * );
 * ```
 *
 * If the response status is not in the map, `undefined` is returned so that the next handler is executed.
 *
 * @param statusErrors The mapping of status codes to errors
 */
export const validateStatusCodes = (statusErrors: StatusErrorMap): FetchResponseHandler => (
  (response: Response) => {
    const httpError: HttpError | undefined = statusErrors[response.status];
    if (httpError !== undefined) {
      return toErrorResponsePromise(httpError);
    }
    return undefined;
  }
);

