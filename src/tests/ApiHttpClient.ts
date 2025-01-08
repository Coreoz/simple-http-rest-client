import { HttpRequest, HttpMethod } from 'simple-http-request-builder';
import { HttpPromise } from '../lib/promise/HttpPromise';
import { defaultJsonFetchClient } from '../lib/client/JsonFetchClient';
import {
  createHttpFetchRequest,
  fetchClient,
} from '../lib/client/FetchClient';

const baseUrl = 'https://hostname/api';

export default class ApiHttpClient {
  // eslint-disable-next-line class-methods-use-this
  rawRequest(method: HttpMethod, path: string): HttpRequest<HttpPromise<Response>> {
    return createHttpFetchRequest(baseUrl, method, path, fetchClient);
  }

  // eslint-disable-next-line class-methods-use-this
  restRequest<T>(method: HttpMethod, path: string): HttpRequest<HttpPromise<T>> {
    return createHttpFetchRequest(baseUrl, method, path, defaultJsonFetchClient<T>);
  }
}
