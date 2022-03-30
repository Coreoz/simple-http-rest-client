import HttpPromise from './HttpPromise';

/**
 * Use a {@link HttpPromise} loader to make sure there is only one execution at a time.
 * See {@link SynchronizedHttpPromise.load}.
 */
export default class SynchronizedHttpPromise<T> {
  private loadingPromise?: Promise<T>;

  private loadingContext?: object;

  constructor(private readonly promiseLoader: () => HttpPromise<T>) {
  }

  /**
   * Tries to find and return the currently loading {@link HttpPromise} or creates and returns a new one.
   */
  load(): HttpPromise<T> {
    if (!this.loadingPromise) {
      const httpPromise = this
        .promiseLoader()
        .then((data) => {
          this.clearLoading();
          return data;
        })
        .catch((error) => {
          this.clearLoading();
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw error;
        });
      this.loadingPromise = httpPromise.toPromise();
      this.loadingContext = httpPromise.getDebugContext();
    }
    return new HttpPromise(this.loadingPromise, this.loadingContext);
  }

  private clearLoading() {
    this.loadingPromise = undefined;
    this.loadingContext = undefined;
  }
}
