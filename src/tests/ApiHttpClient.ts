import { HttpMethod, HttpRequest } from 'simple-http-request-builder';
import { createHttpFetchRequest, fetchClient } from '../lib/client/FetchClient';
import { defaultJsonFetchClient } from '../lib/client/JsonFetchClient';
import { HttpPromise } from '../lib/promise/HttpPromise';

const baseUrl = 'https://hostname/api';

export default class ApiHttpClient {
  rawRequest(method: HttpMethod, path: string): HttpRequest<HttpPromise<Response>> {
    return createHttpFetchRequest(baseUrl, method, path, fetchClient);
  }

  restRequest<T>(method: HttpMethod, path: string): HttpRequest<HttpPromise<T>> {
    return createHttpFetchRequest(baseUrl, method, path, defaultJsonFetchClient<T>);
  }
}
