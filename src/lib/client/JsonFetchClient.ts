import { HttpRequest } from 'simple-http-request-builder';
import { toJsonResponse } from '../handler/ResponseJsonHandler';
import { validateBasicStatusCodes } from '../handler/ValidateBasicStatusCodeHandler';
import { jsonContentTypeValidator } from '../handler/ValidateContentTypeHandler';
import { fetchClient } from './FetchClient';
import { HttpResponse } from './HttpResponse';

/**
 * A {@link HttpClient} that executes an {@link HttpRequest} that returns JSON responses.
 * It uses {@link fetchClient} to executes the {@link HttpRequest}, and then it uses the following handlers:
 * 1. {@link validateBasicStatusCodes}
 * 2. {@link jsonContentTypeValidator}
 * 3. {@link toJsonResponse}
 */
// eslint-disable-next-line import/prefer-default-export
export const defaultJsonFetchClient = <T>(httpRequest: HttpRequest<unknown>)
  : Promise<HttpResponse<T>> => fetchClient(
    httpRequest, validateBasicStatusCodes, jsonContentTypeValidator, toJsonResponse,
  );
