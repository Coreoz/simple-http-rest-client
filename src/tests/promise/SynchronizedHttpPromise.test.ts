import { HttpPromise } from '../../lib/promise/HttpPromise';
import { SynchronizedHttpPromise } from '../../lib/promise/SynchronizedHttpPromise';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('SynchronizedHttpPromise', () => {
  test('reuses the same underlying promise for concurrent loads', async () => {
    const loader = vi.fn().mockReturnValue(new HttpPromise<string>(Promise.resolve('data')));
    const synchronized = new SynchronizedHttpPromise<string>(loader);
    const first = synchronized.load().toPromise();
    const second = synchronized.load().toPromise();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(await first).toBe('data');
    expect(await second).toBe('data');
  });

  test('calls the loader again once the previous load has resolved', async () => {
    const loader = vi.fn().mockReturnValue(new HttpPromise<string>(Promise.resolve('data')));
    const synchronized = new SynchronizedHttpPromise<string>(loader);
    await synchronized.load().toPromise();
    await flushPromises();
    await synchronized.load().toPromise();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  test('calls the loader again once the previous load has rejected', async () => {
    const loader = vi.fn().mockReturnValue(
      new HttpPromise<string>(Promise.reject({ errorCode: 'BACKEND' })),
    );
    const synchronized = new SynchronizedHttpPromise<string>(loader);
    await synchronized.load().toPromise().catch(() => undefined);
    await flushPromises();
    await synchronized.load().toPromise().catch(() => undefined);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  test('returns the resolved data of the underlying promise', async () => {
    const loader = vi.fn().mockReturnValue(new HttpPromise<string>(Promise.resolve('data')));
    const synchronized = new SynchronizedHttpPromise<string>(loader);
    const result = await synchronized.load().toPromise();
    expect(result).toBe('data');
  });
});
