import { Logger } from 'simple-logging-system';
import { genericError, HttpResponse } from '../client/HttpResponse';
import {
  defaultJsonErrorMapper,
  JsonErrorMapper,
  toJsonResponse,
} from './ResponseJsonHandler';

const logger = new Logger('ResponseTextHandler');

/**
 * A {@link FetchResponseHandler} that tries to convert the {@link Response} text body
 * to an {@link HttpResponse}:
 * - If the {@link Response} body is not a valid text object,
 * {@link HttpResponse#error} will contain a {@link genericError}
 * - If the HTTP response is successful (status code is 2xx),
 * {@link HttpResponse#response} will contain the text
 * - If the HTTP response is not successful (status code is not 2xx),
 * the {@link JsonErrorMapper} will be executed to return a {@link HttpResponse}
 *
 * @param response The {@link Response} to parse
 * @param jsonErrorMapper The {@link JsonErrorMapper} that will handle the parsed JSON object in case
 * the HTTP response is not successful (status code is not 2xx)
 */
// eslint-disable-next-line import/prefer-default-export
export const toTextResponse = (
  response: Response,
  jsonErrorMapper: JsonErrorMapper = defaultJsonErrorMapper,
): Promise<HttpResponse<unknown>> => {
  if (response.ok) {
    return response.text()
      .then((text: string) => ({ response: text }))
      .catch((error: Error) => {
        logger.error('Cannot parse text response', { error });
        return ({ error: genericError });
      });
  }
  return toJsonResponse(response, jsonErrorMapper);
};
