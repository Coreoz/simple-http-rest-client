import { PromiseMonitor } from './PromiseMonitor';
import { HttpFetchClient } from '../client/FetchClient';

/**
 * Simplify the use of PromiseMonitor within an {@link HttpFetchClient}.
 *
 * See {@link PromiseMonitor}
 */
// eslint-disable-next-line import/prefer-default-export
export class HttpPromiseMonitor extends PromiseMonitor {
  makeMonitor(httpClient: HttpFetchClient, promiseInfo?: object): HttpFetchClient {
    return (httpRequest) => this.monitor(
      httpClient(httpRequest),
      promiseInfo,
    );
  }
}
