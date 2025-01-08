import { HttpRequest } from 'simple-http-request-builder';
import { Logger } from 'simple-logging-system';
import { contentTypeValidator } from './ContentTypeValidator';
import { fetchClient, FetchResponseHandler } from './FetchClient';
import { validateBasicStatusCodes } from './FetchStatusValidators';
import { genericError, HttpResponse, toErrorResponsePromise } from './HttpResponse';
import { defaultJsonErrorMapper, JsonErrorMapper, toJsonResponse } from './JsonFetchClient';

const logger: Logger = new Logger('FileFetchClient');

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
export const toArrayBufferResponse = async (
  response: Response,
  jsonErrorMapper: JsonErrorMapper = defaultJsonErrorMapper,
): Promise<HttpResponse<unknown>> => {
  if (response.ok) {
    try {
      return {
        response: await response.arrayBuffer(),
      };
    } catch (error) {
      logger.warn('Response could not be read as an array buffer');
      return toErrorResponsePromise(genericError);
    }
  }

  return toJsonResponse(response, jsonErrorMapper);
};

/**
 * Validate that the content-type header of the response is 'application/octet-stream'
 * @param response The {@link Response} to validate
 */
export const octetStreamTypeValidator: FetchResponseHandler = (response: Response) => (
  contentTypeValidator(response, 'application/octet-stream')
);

/**
 * A {@link HttpClient} that executes an {@link HttpRequest} that returns an array buffer response.
 * It uses {@link fetchClient} to executes the {@link HttpRequest}, and then it uses the following handlers:
 * 1. {@link validateBasicStatusCodes}
 * 2. {@link octetStreamTypeValidator}
 * 3. {@link toArrayBufferResponse}
 */
// eslint-disable-next-line import/prefer-default-export
export const fileFetchClient = (httpRequest: HttpRequest<unknown>): Promise<HttpResponse<ArrayBuffer>> => fetchClient(
  httpRequest,
  validateBasicStatusCodes,
  octetStreamTypeValidator,
  toArrayBufferResponse,
);
