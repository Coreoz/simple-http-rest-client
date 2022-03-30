import { Logger } from 'simple-logging-system';
import { genericError, toErrorResponsePromise } from './HttpResponse';

const logger = new Logger('ContentTypeValidator');

/**
 * A {@link FetchResponseHandler} maker that verify the content type of a {@link Response}
 * using the `content-type` response HTTP header.
 *
 * See {@link jsonContentTypeValidator} for usage.
 *
 * @param response The {@link Response} to validate
 * @param searchContentType The content type to look for in `content-type` response HTTP header.
 * Note that the `jsonContentType` can be a partial type. For example if `searchContentType = 'json'`,
 * then a response with the header `application/vnd.myapp.type.v1+json` will be valid.
 */
export const contentTypeValidator = (
  response: Response,
  searchContentType: string,
) => {
  // make sure the response is a JSON one
  const contentType = response.headers.get('content-type');
  if (contentType === null || contentType.indexOf(searchContentType) === -1) {
    logger.error(`Response type is not ${searchContentType}`, response);
    return toErrorResponsePromise(genericError);
  }

  return undefined;
};
