import { PromiseMonitor } from '../../lib/promise/PromiseMonitor';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('PromiseMonitor', () => {
  test('returns the same promise from monitor', () => {
    const monitor = new PromiseMonitor();
    const promise = Promise.resolve('done');
    expect(monitor.monitor(promise)).toBe(promise);
  });

  test('registers a monitored promise with its info', () => {
    const monitor = new PromiseMonitor();
    const promise = Promise.resolve('done');
    const info = { url: '/users' };
    monitor.monitor(promise, info);
    expect(monitor.getRunningPromisesCount()).toBe(1);
    expect(monitor.getRunningPromises()).toEqual([promise]);
    const entries = monitor.getRunningPromisesWithInfo();
    expect(entries).toHaveLength(1);
    const [key, value] = entries[0];
    expect(key).toBe(promise);
    expect(value.promiseInfo).toBe(info);
    expect(value.promise).toBe(promise);
  });

  test('removes the promise once it resolves', async () => {
    const monitor = new PromiseMonitor();
    const promise = Promise.resolve('done');
    monitor.monitor(promise);
    expect(monitor.getRunningPromisesCount()).toBe(1);
    await promise;
    await flushPromises();
    expect(monitor.getRunningPromisesCount()).toBe(0);
  });

  test('returns zero when no promise is monitored', () => {
    const monitor = new PromiseMonitor();
    expect(monitor.getRunningPromisesCount()).toBe(0);
    expect(monitor.getRunningPromises()).toEqual([]);
  });
});
