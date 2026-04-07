import { MultipartHttpRequest } from 'simple-http-request-builder';
import { HttpResponse } from '../client/HttpResponse';
import { toJsonResponse } from '../handler/ResponseJsonHandler';
import { validateBasicStatusCodes } from '../handler/ValidateBasicStatusCodeHandler';
import { jsonContentTypeValidator } from '../handler/ValidateContentTypeHandler';
import { multipartHttpFetchClient } from './MultipartHttpClient';

// eslint-disable-next-line import/prefer-default-export
export function defaultJsonMultipartFetchClient<T>(
  httpRequest: MultipartHttpRequest<unknown>,
): Promise<HttpResponse<T>> {
  return multipartHttpFetchClient(
    httpRequest,
    validateBasicStatusCodes,
    jsonContentTypeValidator,
    toJsonResponse,
  );
}
