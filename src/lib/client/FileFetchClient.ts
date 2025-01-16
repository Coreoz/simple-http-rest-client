import { HttpRequest } from 'simple-http-request-builder';
import { toArrayBufferResponse } from '../handler/ResponseArrayBufferHandler';
import {
  validateBasicStatusCodes,
} from '../handler/ValidateBasicStatusCodeHandler';
import { validateContentType } from '../handler/ValidateContentTypeHandler';
import { fetchClient, FetchResponseHandler } from './FetchClient';
import { HttpResponse } from './HttpResponse';

/**
 * Validate that the content-type header of the response is 'application/octet-stream'
 * @param response The {@link Response} to validate
 */
export const octetStreamTypeValidator: FetchResponseHandler = (response: Response) => (
  validateContentType(response, 'application/octet-stream')
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
