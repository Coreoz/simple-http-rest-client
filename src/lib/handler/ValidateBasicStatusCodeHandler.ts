import { Logger } from 'simple-logging-system';
import { forbiddenError, HttpResponse, toErrorResponsePromise } from '../client/HttpResponse';
import { FetchResponseHandler } from './FetchResponseHandlers';

const logger = new Logger('ValidateBasicStatusValidator');

/**
 * A {@link FetchResponseHandler} that verify if the status code:
 * - is 403: in that case returns a {@link forbiddenError}
 * - is 204: in that case returns a `null` {@link HttpResponse}
 */
// eslint-disable-next-line import/prefer-default-export
export const validateBasicStatusCodes: FetchResponseHandler = (response: Response) => {
  // if the error is a forbidden access, the body should be empty
  if (response.status === 403) {
    logger.warn('Forbidden access', { response });
    return toErrorResponsePromise(forbiddenError);
  }

  // if there is no content, there is no need to try to parse it
  if (response.status === 204) {
    return Promise.resolve<HttpResponse<unknown>>({ response: null as unknown });
  }

  return undefined;
};
