import { HttpMethod, HttpRequest } from 'simple-http-request-builder';
import { fetchClient } from '../lib/client/FetchClient';
import {
  genericError,
  HttpError,
  HttpResponse,
  networkError,
  timeoutError,
  toErrorResponsePromise,
} from '../lib/client/HttpResponse';
import { HttpPromise, unwrapHttpPromise } from '../lib/promise/HttpPromise';
import ApiHttpClient from './ApiHttpClient';

const waitTimeout = (durationInMillis: number) => new Promise(
  // eslint-disable-next-line no-promise-executor-return
  (resolve) => setTimeout(resolve, durationInMillis),
);

let mockedFetchResponseBody: string | undefined;
const mockedFetchResponseStatus: ResponseInit = {
  status: 200,
  statusText: 'Ok',
  // headers
  headers: {
    'content-type': 'application/json',
  },
};
let mockedPromiseError: Error | undefined;

const setMockedBody = (responseObject: object) => {
  mockedFetchResponseBody = JSON.stringify(responseObject);
};

const mockedFetch = (): Promise<Response> => {
  if (mockedPromiseError) {
    return Promise.reject(mockedPromiseError);
  }
  return Promise.resolve(new Response(mockedFetchResponseBody, mockedFetchResponseStatus));
};

type MockUser = { id: number };

const executeGetUserRequest = (mockUser: MockUser): HttpPromise<MockUser> => {
  // Mock body
  setMockedBody(mockUser);
  // Add client
  const apiClient: ApiHttpClient = new ApiHttpClient();
  // Execute request in request
  return apiClient
    .restRequest<MockUser>(HttpMethod.GET, 'https://hostname/users')
    .execute();
};

describe('Tests fetch client', () => {
  const oldFetch = global.fetch;
  global.fetch = mockedFetch;

  beforeEach(() => {
    mockedPromiseError = undefined;
    mockedFetchResponseBody = undefined;
  });

  afterAll(() => {
    global.fetch = oldFetch;
  });

  test('Check simple request sample', async () => {
    setMockedBody({ test: 1 });
    const response = await new ApiHttpClient()
      .rawRequest(HttpMethod.GET, 'https://hostname/users')
      .execute()
      .toPromise();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ test: 1 });
    // to avoid HttpPromise logging after the end of the jest test
    await waitTimeout(1);
  });

  test('Check network error rejects promise with networkError', async () => {
    mockedPromiseError = new Error('Mocked error');
    const response = new ApiHttpClient()
      .rawRequest(HttpMethod.GET, 'https://hostname/users')
      .execute()
      .toPromise();
    await expect(response).rejects.toEqual(networkError);
  });

  test('Check timeout error rejects promise with timeoutError', async () => {
    mockedPromiseError = new Error();
    mockedPromiseError.name = 'AbortError';
    const response = new ApiHttpClient()
      .rawRequest(HttpMethod.GET, 'https://hostname/users')
      .execute()
      .toPromise();
    await expect(response).rejects.toEqual(timeoutError);
    // to avoid HttpPromise logging after the end of the jest test
    await waitTimeout(1);
  });

  test('Check handler execution error rejects promise with genericError', async () => {
    const httpClientWithErrorHandler = (httpRequest: HttpRequest<unknown>) => unwrapHttpPromise(fetchClient(
      httpRequest, () => {
        throw new Error();
      },
    ));
    const response = new HttpRequest(
      httpClientWithErrorHandler,
      'http://localhost',
      HttpMethod.GET,
      '/users',
    ).execute();
    await expect(response).rejects.toEqual(genericError);
  });

  test('Check return type of rest request must be User', async () => {
    const mockFirstUser: MockUser = { id: 1 };
    const result: MockUser = await executeGetUserRequest(mockFirstUser);
    expect(result.id).toEqual(1);
  });

  test('Check return type of then function must be unwrap in the next then call', async () => {
    // Mock body
    const mockFirstUser: MockUser = { id: 1 };
    const mockSecondUser: MockUser = { id: 2 };

    // Add client
    // Execute request in request
    const result: MockUser = await executeGetUserRequest(mockFirstUser)
      .then(() => executeGetUserRequest(mockSecondUser));
    expect(result.id).toEqual(2);
  });

  test('Check return type of catch function must be unwrap in the next then call', async () => {
    const httpClientWithErrorHandler = (
      httpRequest: HttpRequest<unknown>,
    ): Promise<HttpResponse<MockUser>> => fetchClient(
      httpRequest,
      () => {
        const httpError: HttpError = {
          errorCode: 'INTERNAL_ERROR',
        };
        return toErrorResponsePromise<HttpError>(httpError);
      },
    );

    const result: HttpError = await new HttpRequest<HttpPromise<MockUser>>(
      (httpRequest: HttpRequest<unknown>) => new HttpPromise<MockUser>(
        unwrapHttpPromise(httpClientWithErrorHandler(httpRequest)),
        httpRequest,
      ),
      'http://localhost',
      HttpMethod.GET,
      '/users',
    )
      .execute()
      .catch((e: HttpError) => e);

    expect(result.errorCode).toEqual('INTERNAL_ERROR');
  });

  test('Check return type of catch function must be unwrap in the next then call', async () => {
    const mockFirstUser: MockUser = { id: 1 };

    const httpClientWithErrorHandler = (
      httpRequest: HttpRequest<unknown>,
    ): Promise<HttpResponse<MockUser>> => fetchClient(
      httpRequest,
      () => {
        const httpError: HttpError = {
          errorCode: 'INTERNAL_ERROR',
        };
        return toErrorResponsePromise<HttpError>(httpError);
      },
    );

    const result: MockUser = await new HttpRequest<HttpPromise<MockUser>>(
      (httpRequest: HttpRequest<unknown>) => new HttpPromise<MockUser>(
        unwrapHttpPromise(httpClientWithErrorHandler(httpRequest)),
        httpRequest,
      ),
      'http://localhost',
      HttpMethod.GET,
      '/users',
    )
      .execute()
      .catch(() => executeGetUserRequest(mockFirstUser));

    expect(result.id).toEqual(1);
  });
});
