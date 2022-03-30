type MonitoredObject = {
  promise: Promise<unknown>,
  promiseInfo?: object,
};

/**
 * This class enables to check what are the status of promises that are being executed.
 *
 * A use case is Server-Side-Rendering:
 * - After a first render
 * - It is interesting to watch the promises that are being executed
 * - And when all promises have revolved,
 * it is guessable that all the data are ready for the application to rerender again
 */
export default class PromiseMonitor {
  private readonly runningPromises: Map<Promise<unknown>, MonitoredObject>;

  constructor() {
    this.runningPromises = new Map();
  }

  monitor<T>(promise: Promise<T>, promiseInfo?: object): Promise<T> {
    this.runningPromises.set(promise, {
      promise,
      promiseInfo,
    });
    promise.finally(() => this.runningPromises.delete(promise));
    return promise;
  }

  getRunningPromises(): Promise<unknown>[] {
    return Array.from(this.runningPromises.keys());
  }

  getRunningPromisesWithInfo(): [Promise<unknown>, MonitoredObject][] {
    return Array.from(this.runningPromises.entries());
  }

  getRunningPromisesCount() {
    return this.runningPromises.size;
  }
}
