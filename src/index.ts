// content type validator
export { contentTypeValidator } from './lib/client/ContentTypeValidator';
// fetch client
export { fetchClientExecutor, networkErrorCatcher, fetchClient } from './lib/client/FetchClient';
export type {
  FetchResponseHandler,
} from './lib/client/FetchClient';
// fetch status validators
export { validateBasicStatusCodes } from './lib/client/FetchStatusValidators';
// http response
export type {
  HttpError,
  HttpResponseSuccess,
  HttpResponseError,
  HttpResponse,
} from './lib/client/HttpResponse';
export {
  toErrorResponsePromise,
  genericError,
  networkError,
  timeoutError,
  forbiddenError,
} from './lib/client/HttpResponse';
// json fetch client
export {
  jsonContentTypeValidator,
  defaultJsonErrorMapper,
  toJsonResponse,
  defaultJsonFetchClient
} from './lib/client/JsonFetchClient';
export type {
  JsonErrorMapper,
} from './lib/client/JsonFetchClient';
// TODO finish exporting Promise
