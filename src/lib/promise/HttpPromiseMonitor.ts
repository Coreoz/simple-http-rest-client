import { HttpRequest } from 'simple-http-request-builder';
import { PromiseMonitor } from './PromiseMonitor';
import { HttpFetchClient } from '../client/FetchClient';

/**
 * Simplify the use of PromiseMonitor within an {@link HttpFetchClient}.
 *
 * See {@link PromiseMonitor}
 */
// eslint-disable-next-line import/prefer-default-export
export class HttpPromiseMonitor<T> extends PromiseMonitor {
  makeMonitor(httpClient: HttpFetchClient<T>, promiseInfo?: object): HttpFetchClient<T> {
    return (httpRequest: HttpRequest<unknown>) => this.monitor(
      httpClient(httpRequest),
      promiseInfo,
    );
  }
}
