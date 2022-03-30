import { Logger } from 'simple-logging-system';
import { genericError, HttpError, HttpResponse } from '../client/HttpResponse';

const logger = new Logger('HttpPromise');

/**
 * A function that takes a parameter of type `P` and returns a result of type `R`
 */
export interface PromiseFunction<P, R> {
  (parameter: P): R;
}

/**
 * Process a {@link HttpResponse} to throw the {@link HttpResponse.error} if it exists.
 *
 * Should be called in the {@link Promise.then} of a `Promise<HttpResponse<T>>`
 * to convert it to a `Promise<T>`.
 *
 * For common usage, {@link unwrapHttpPromise} should be preferred as it deals better with TS types.
 * @param httpResponse The response to be processed.
 */
export function processHttpResponse<T>(httpResponse: HttpResponse<T>): T {
  if ('error' in httpResponse) {
    // We actually want to throw an object literal and not and `Error`
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw httpResponse.error;
  }
  if (httpResponse.response === undefined) {
    logger.error('Weird, the http result is not recognized');
    // We actually want to throw an object literal and not and `Error`
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw genericError;
  }
  return httpResponse.response;
}

/**
 * Convert a `Promise<HttpResponse<T>>` to a `Promise<T>`.
 *
 * In case an HTTP error is returned by `HttpResponse<T>`, a rejected `Promise` is issued
 * with the error object {@link HttpError}
 * @param httpPromise The `Promise` to be unwrapped
 */
export function unwrapHttpPromise<T>(httpPromise: Promise<HttpResponse<T>>): Promise<T> {
  return httpPromise.then(processHttpResponse);
}

/**
 * Verify is an object seems to be a {@link HttpError}.
 *
 * Returns `true` if the object seems to be a {@link HttpError}, else `false`.
 */
export function isHttpError(object: unknown) {
  return object && typeof object === 'object' && (object as HttpError).errorCode !== undefined;
}

export function safeThen<P, R>(thenFunction: PromiseFunction<P, R>, debugContext?: object): PromiseFunction<P, R> {
  return (parameter: P) => {
    try {
      return thenFunction(parameter);
    } catch (error) {
      if (isHttpError(error)) {
        // If the then function has thrown a HttpError object, we assume this is legitimate
        throw error;
      }
      logger.error('Error applying then function', { debugContext, parameter }, error);
      // We actually want to through an object literal and not and `Error`
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw genericError;
    }
  };
}

export function safeCatch<R>(catchFunction: PromiseFunction<HttpError, R>, debugContext?: object)
  : PromiseFunction<unknown, R> {
  return (httpError: unknown) => {
    if (isHttpError(httpError)) {
      try {
        return catchFunction(httpError as HttpError);
      } catch (error) {
        if (isHttpError(error)) {
          // If the catch function has thrown a HttpError object, we assume this is legitimate
          throw error;
        }
        logger.error('Error applying catch function', { debugContext, httpError }, error);
        // We actually want to through an object literal and not and `Error`
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw genericError;
      }
    }
    logger.error('Error thrown is not an httpError', { debugContext }, httpError);
    // We actually want to through an object literal and not and `Error`
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw genericError;
  };
}

/**
 * A mutable safe `Promise` that ensures:
 * - Either a then function is provided or either an info log statement will be issued
 * - Either a catch function is provided or either a warning log statement will be issued
 * - Then and Catch functions are wrapped to ensure that if an error occurs during the execution,
 * an error statement is issued
 *
 * It also contains a `debugContext` that is used for logging in case an error occurs.
 */
export default class HttpPromise<T> {
  private isThenAttached: boolean;

  private isCaughtAttached: boolean;

  // protected visibility for testing purpose only
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected promise: Promise<any>;

  constructor(basePromise: Promise<T>, private readonly debugContext?: object) {
    this.isThenAttached = false;
    this.isCaughtAttached = false;
    this.promise = basePromise;
    setTimeout(() => {
      if (!this.isThenAttached) {
        this.promise.then((response) => {
          logger.info('Ignored HTTP result', { debugContext, response });
        });
      }
      this.promise.catch((httpError) => {
        if (this.isCaughtAttached) {
          logger.debug('Caught HTTP error', { debugContext, httpError });
        } else {
          logger.warn('Ignored HTTP error', { debugContext, httpError });
        }
      });
    }, 0);
  }

  /**
   * Execute a function after the `Promise` has been resolved.
   *
   * The function can:
   * - Just execute some code using the result
   * - Transform the result into another object
   * - Throw an error of type {@link HttpError} that will trigger the catch function
   *
   * If the {@link thenFunction} throws an error:
   * - The error will be caught and logged
   * - A {@link genericError} will be thrown
   *
   * The then function returns the `this` instance of {@link HttpPromise} containing and updating `Promise`.
   * If {@link thenFunction} has no return statement, a `HttpPromise<void>` will be returned,
   * else a `HttpPromise` parametrized with the returned type will be returned.
   *
   * @param thenFunction The code that will be executed after the `Promise` has been resolved.
   */
  then<R = void>(thenFunction: PromiseFunction<T, R>): HttpPromise<R> {
    this.isThenAttached = true;
    this.promise = this.promise.then(safeThen(thenFunction, this.debugContext));
    return this as unknown as HttpPromise<R>;
  }

  /**
   * Execute a function after an error has happened resolving the `Promise` or executing {@link then} functions.
   *
   * This `catch` method should be called after all {@link then} functions has been called,
   * else it might not catch errors that have arisen from the {@link then} functions execution.
   *
   * This `catch` method may however be called before some {@link then} functions to provide a recovery feature.
   * It is the same as with a classic `Promise`, if something is returned from the {@link catchFunction},
   * then the promise is considered as recovered and the next {@link then} calls will be executed.
   *
   * If the {@link catchFunction} throws an error:
   * - The error will be caught and logged
   * - A {@link genericError} will be thrown
   *
   * @param catchFunction The code that will do something with the {@link HttpError}
   * and possibility recover the `Promise`.
   */
  catch<R = void>(catchFunction: PromiseFunction<HttpError, R>): HttpPromise<R | T> {
    this.isCaughtAttached = true;
    this.promise = this.promise.catch(safeCatch(catchFunction, this.debugContext));
    return this as unknown as HttpPromise<R>;
  }

  /**
   * Returns the corresponding raw `Promise`.
   *
   * Once the {@link toPromise} method is called, verifications that {@link then} and {@link catch}
   * functions are attached are not made anymore. So:
   * - Either this should be called after {@link then} and {@link catch} functions are attached
   * - Either then are catch functions should be attached to the returned `Promise`. Usage of {@link safeThen}
   * and {@link safeCatch} is recommended for that
   */
  toPromise(): Promise<T> {
    // When manipulating the raw promise, we cannot keep track of then() and catch() methods being called
    this.isThenAttached = true;
    this.isCaughtAttached = true;
    return this.promise;
  }

  /**
   * Returns the debug context if it exists.
   *
   * This should be used only to make copies to the {@link HttpPromise} or to display debugging information.
   */
  getDebugContext(): object | undefined {
    return this.debugContext;
  }
}
