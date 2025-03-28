import { HttpRequest } from 'simple-http-request-builder';
import { FetchResponseHandler } from '../handler/FetchResponseHandlers';
import { toJsonResponse } from '../handler/ResponseJsonHandler';
import { validateContentType } from '../handler/ValidateContentTypeHandler';
import { fetchClient } from './FetchClient';
import { validateBasicStatusCodes } from '../handler/ValidateBasicStatusCodeHandler';
import { HttpResponse } from './HttpResponse';

/**
 * A {@link FetchResponseHandler} that verify that the content type of a {@link Response} is JSON
 * using the `content-type` response HTTP header.
 *
 * See {@link validateContentType} for the content type validation.
 *
 * @param response The {@link Response} to validate
 */
export const jsonContentTypeValidator: FetchResponseHandler = (
  response: Response,
) => validateContentType(response, 'json');

/**
 * A {@link HttpClient} that executes an {@link HttpRequest} that returns JSON responses.
 * It uses {@link fetchClient} to executes the {@link HttpRequest}, and then it uses the following handlers:
 * 1. {@link validateBasicStatusCodes}
 * 2. {@link jsonContentTypeValidator}
 * 3. {@link toJsonResponse}
 */
export const defaultJsonFetchClient = <T>(httpRequest: HttpRequest<unknown>)
  : Promise<HttpResponse<T>> => fetchClient(
    httpRequest, validateBasicStatusCodes, jsonContentTypeValidator, toJsonResponse,
  );
