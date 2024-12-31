import { Logger } from 'simple-logging-system';
import { forbiddenError, HttpResponse, notFoundError, toErrorResponsePromise, unauthorizedError } from './HttpResponse';
import { FetchResponseHandler } from './FetchClient';

const logger = new Logger('FetchStatusValidators');

/**
 * A {@link FetchResponseHandler} that verify if the status code:
 * - is 401: in that case returns a {@link unauthorizedError}
 * - is 403: in that case returns a {@link forbiddenError}
 * - is 404: in that case returns a {@link notFoundError}
 * - is 204: in that case returns a `null` {@link HttpResponse}
 */
// eslint-disable-next-line import/prefer-default-export
export const validateBasicStatusCodes: FetchResponseHandler = (response: Response) => {
  if (response.status === 401) {
    logger.warn('Unauthorized access', { response });
    return toErrorResponsePromise(unauthorizedError);
  }

  // if the error is a forbidden access, the body should be empty
  if (response.status === 403) {
    logger.warn('Forbidden access', { response });
    return toErrorResponsePromise(forbiddenError);
  }

  if (response.status === 404) {
    logger.warn('Not found', { response });
    return toErrorResponsePromise(notFoundError);
  }

  // if there is no content, there is no need to try to parse it
  if (response.status === 204) {
    return Promise.resolve<HttpResponse<unknown>>({ response: null as unknown });
  }

  return undefined;
};
