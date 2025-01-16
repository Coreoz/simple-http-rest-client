import { Logger } from 'simple-logging-system';
import { genericError, HttpResponse } from '../client/HttpResponse';
import {
  defaultJsonErrorMapper,
  JsonErrorMapper,
  toJsonResponse,
} from './ResponseJsonHandler';

const logger: Logger = new Logger('ResponseArrayBufferHandler');

/**
 * A {@link FetchResponseHandler} that tries to retrieve the array buffer of the {@link Response} body
 * - If the {@link Response} body is not a valid array buffer,
 * {@link HttpResponse#error} will contain a {@link genericError}
 * - If the HTTP response is successful (status code is 2xx),
 * {@link HttpResponse#response} will contain the array buffer
 * - If the HTTP response is not successful (status code is not 2xx),
 * the {@link JsonErrorMapper} will be executed to return a {@link HttpResponse}
 *
 * @param response The {@link Response} to parse
 * @param jsonErrorMapper The {@link JsonErrorMapper} that will handle the parsed JSON object in case
 * the HTTP response is not successful (status code is not 2xx)
 */
// eslint-disable-next-line import/prefer-default-export
export const toArrayBufferResponse = (
  response: Response,
  jsonErrorMapper: JsonErrorMapper = defaultJsonErrorMapper,
): Promise<HttpResponse<unknown>> => {
  if (response.ok) {
    return response.arrayBuffer()
      .then((arrayB: ArrayBuffer) => ({ response: arrayB }))
      .catch((error: Error) => {
        logger.error('Response could not be read as an array buffer', { error });
        return { error: genericError };
      });
  }

  return toJsonResponse(response, jsonErrorMapper);
};
