import { HttpRequest } from 'simple-http-request-builder';
import { HttpFetchClient } from '../../lib/client/FetchClient';
import { HttpResponse } from '../../lib/client/HttpResponse';
import { HttpPromiseMonitor } from '../../lib/promise/HttpPromiseMonitor';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const makeHttpClient = (result: HttpResponse<string> = { response: 'ok' }): HttpFetchClient<string> => (
  vi.fn().mockResolvedValue(result) as unknown as HttpFetchClient<string>
);

describe('HttpPromiseMonitor', () => {
  test('wraps the http client and delegates the request', () => {
    const monitor = new HttpPromiseMonitor<string>();
    const httpClient = makeHttpClient();
    const monitored = monitor.makeMonitor(httpClient);
    const request = {} as unknown as HttpRequest<unknown>;
    monitored(request);
    expect(httpClient).toHaveBeenCalledWith(request);
  });

  test('monitors the promise returned by the http client', async () => {
    const monitor = new HttpPromiseMonitor<string>();
    const httpClient = makeHttpClient();
    const monitored = monitor.makeMonitor(httpClient);
    const promise = monitored({} as unknown as HttpRequest<unknown>);
    expect(monitor.getRunningPromisesCount()).toBe(1);
    await promise;
    await flushPromises();
    expect(monitor.getRunningPromisesCount()).toBe(0);
  });

  test('passes the promise info to the monitor', () => {
    const monitor = new HttpPromiseMonitor<string>();
    const info = { method: 'GET' };
    const monitored = monitor.makeMonitor(makeHttpClient(), info);
    monitored({} as unknown as HttpRequest<unknown>);
    const entries = monitor.getRunningPromisesWithInfo();
    expect(entries).toHaveLength(1);
    expect(entries[0][1].promiseInfo).toBe(info);
  });
});
