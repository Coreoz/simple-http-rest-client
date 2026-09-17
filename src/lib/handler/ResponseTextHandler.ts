import { Logger } from 'simple-logging-system';
import { genericError, HttpResponse } from '../client/HttpResponse';
import {
  defaultJsonErrorMapper,
  JsonErrorMapper,
  toJsonResponse,
} from './ResponseJsonHandler';

const logger = new Logger('ResponseTextHandler');

/**
 * A mapper that will handle non-successful HTTP responses that have a text body.
 *
 * This mapper generally returns an {@link HttpResponse#error} containing the matching `errorCode`.
 * But if necessary it can return an {@link HttpResponse#response}.
 *
 * See the default implementation: {@link defaultTextErrorMapper}.
 *
 * @param response The non-successful HTTP {@link Response}
 * @param text The response body as text
 */
export type TextErrorMapper = (response: Response, text: string) => HttpResponse<unknown>;

/**
 * The default {@link TextErrorMapper} implementation that returns an {@link HttpResponse#error}
 * containing a {@link genericError}.
 */
export const defaultTextErrorMapper: TextErrorMapper = (response: Response, text: string) => {
  logger.warn('Unrecognized text error', { response, text });
  return { error: genericError };
};

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

/**
 * A {@link FetchResponseHandler} that tries to convert the {@link Response} text body
 * to an {@link HttpResponse}, using a {@link TextErrorMapper} to handle non-successful responses:
 * - If the {@link Response} body is not a valid text object,
 * {@link HttpResponse#error} will contain a {@link genericError}
 * - If the HTTP response is successful (status code is 2xx),
 * {@link HttpResponse#response} will contain the text
 * - If the HTTP response is not successful (status code is not 2xx),
 * the body is read as text and the {@link TextErrorMapper} is executed.
 *
 * This is useful for APIs that return a non-JSON error body (for example a plain text error message).
 *
 * @param response The {@link Response} to parse
 * @param textErrorMapper The {@link TextErrorMapper} that will handle the response body as text in case
 * the HTTP response is not successful (status code is not 2xx)
 */
export const toErrorTextResponse = (
  response: Response,
  textErrorMapper: TextErrorMapper = defaultTextErrorMapper,
): Promise<HttpResponse<unknown>> => {
  if (response.ok) {
    return response.text()
      .then((text: string) => ({ response: text }))
      .catch((error: Error) => {
        logger.error('Cannot read text response', { error });
        return { error: genericError };
      });
  }
  return response.text()
    .then((text: string) => textErrorMapper(response, text))
    .catch((error: Error) => {
      logger.error('Cannot read error text response', { error });
      return { error: genericError };
    });
};

