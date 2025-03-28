// clients
export {
  fetchClientExecutor,
  fetchClient,
  createHttpFetchRequest,
} from './lib/client/FetchClient';
export type {
  HttpFetchClient,
} from './lib/client/FetchClient';
export {
  multipartHttpFetchClient,
  multipartHttpFetchClientExecutor,
  createMultipartHttpFetchRequest,
} from './lib/multipart/MultipartHttpClient';
export type {
  MultipartHttpFetchClient,
} from './lib/multipart/MultipartHttpClient';
// handlers
export {
  validateBasicStatusCodes,
} from './lib/handler/ValidateBasicStatusCodeHandler';
export { validateContentType } from './lib/handler/ValidateContentTypeHandler';
export {
  toJsonResponse, defaultJsonErrorMapper,
} from './lib/handler/ResponseJsonHandler';
export type {
  JsonErrorMapper,
} from './lib/handler/ResponseJsonHandler';
export { toTextResponse } from './lib/handler/ResponseTextHandler';
export { toArrayBufferResponse } from './lib/handler/ResponseArrayBufferHandler';
export {
  processHandlers,
  networkErrorCatcher,
} from './lib/handler/FetchResponseHandlers';
export type {
  FetchResponseHandler,
} from './lib/handler/FetchResponseHandlers';
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
// custom fetch clients
export {
  jsonContentTypeValidator,
  defaultJsonFetchClient,
} from './lib/client/JsonFetchClient';
export {
  octetStreamTypeValidator,
  fileFetchClient,
} from './lib/client/FileFetchClient';
// http promise
export {
  processHttpResponse,
  unwrapHttpPromise,
  isHttpError,
  HttpPromise,
} from './lib/promise/HttpPromise';
export type {
  PromiseFunction,
} from './lib/promise/HttpPromise';
// promise monitor
export { PromiseMonitor } from './lib/promise/PromiseMonitor';
export { HttpPromiseMonitor } from './lib/promise/HttpPromiseMonitor';
// synchronized http promise
export { SynchronizedHttpPromise } from './lib/promise/SynchronizedHttpPromise';

// TODO to remove in the next future major release 3.x.x
export { validateContentType as contentTypeValidator } from './lib/handler/ValidateContentTypeHandler';
