// eslint-disable-next-line max-classes-per-file
import { MultipartHttpRequest } from 'simple-http-request-builder';
import { createResponseFromXhr, multipartHttpFetchClientExecutor } from '../../lib/multipart/MultipartHttpClient';

jest.mock('../../lib/client/HttpResponse', () => ({
  networkError: { errorCode: 'NETWORK_ERROR' },
  timeoutError: { errorCode: 'TIMEOUT_ERROR' },
}));

describe('createResponseFromXhr', () => {
  test('creates a Response object from an XMLHttpRequest', () => {
    const mockXhr = {
      getAllResponseHeaders: jest.fn().mockReturnValue('Content-Type: application/json'),
      response: '{\'message\':\'success\'}',
      status: 200,
      statusText: 'OK',
    } as unknown as XMLHttpRequest;

    const response = createResponseFromXhr(mockXhr);

    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});

describe('multipartHttpFetchClientExecutor', () => {
  let mockXhr: jest.Mocked<XMLHttpRequest>;
  let mockRequest: MultipartHttpRequest<unknown>;

  beforeEach(() => {
    jest.useFakeTimers();

    global.FormData = class {
      append = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any; // Mock FormData to avoid ReferenceError

    global.ProgressEvent = class {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      constructor(type: string, eventInitDict?: ProgressEventInit) {
        Object.assign(this, eventInitDict);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    mockXhr = {
      open: jest.fn(),
      setRequestHeader: jest.fn(),
      send: jest.fn(),
      abort: jest.fn(),
      withCredentials: false,
      onload: null,
      onerror: null,
      ontimeout: null,
      upload: {
        onprogress(this: XMLHttpRequestUpload) {
          // Placeholder function to prevent `this` binding issues
        },
        onerror(this: XMLHttpRequestUpload) {
          // Placeholder function to prevent `this` binding issues
        },
      } as unknown as XMLHttpRequestUpload,
      getAllResponseHeaders: jest.fn().mockReturnValue('Content-Type: application/json'),
      response: '{\'message\':\'success\'}',
      status: 200,
      statusText: 'OK',
    } as unknown as jest.Mocked<XMLHttpRequest>;

    global.XMLHttpRequest = jest.fn(() => mockXhr) as unknown as jest.MockedClass<typeof XMLHttpRequest>;

    mockRequest = {
      method: 'POST',
      buildUrl: jest.fn().mockReturnValue('https://api.example.com/upload'),
      optionValues: {
        timeoutInMillis: 5000,
        withCredentials: true,
        onProgressCallback: jest.fn(),
      },
      headersValue: { 'Content-Type': 'multipart/form-data' },
      formData: new FormData(),
    } as unknown as MultipartHttpRequest<unknown>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('sends an XMLHttpRequest and resolves with a Response', async () => {
    const promise = multipartHttpFetchClientExecutor(mockRequest);
    mockXhr.onload?.({} as ProgressEvent);

    jest.runAllTimers(); // Simulate timeout clearing

    const response = await promise;
    expect(response.status).toBe(200);
    expect(mockXhr.open).toHaveBeenCalledWith('POST', 'https://api.example.com/upload', true);
    expect(mockXhr.withCredentials).toBe(true);
    expect(mockXhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'multipart/form-data');
    expect(mockXhr.send).toHaveBeenCalledWith(mockRequest.formData);
  });

  test('rejects on network error', async () => {
    const promise = multipartHttpFetchClientExecutor(mockRequest);
    mockXhr.onerror?.({} as ProgressEvent);

    await expect(promise).rejects.toThrow('NETWORK_ERROR');
  });

  test('rejects on timeout', async () => {
    const promise = multipartHttpFetchClientExecutor(mockRequest);
    mockXhr.ontimeout?.({} as ProgressEvent);

    await expect(promise).rejects.toThrow('TIMEOUT_ERROR');
  });

  test('calls onProgressCallback during upload', async () => {
    const mockProgressEvent = new ProgressEvent('progress', { loaded: 50, total: 100 });

    multipartHttpFetchClientExecutor(mockRequest);
    (mockXhr.upload as XMLHttpRequest).onprogress?.(mockProgressEvent);

    expect(mockRequest.optionValues.onProgressCallback).toHaveBeenCalledWith(mockProgressEvent);
  });

  test('rejects on upload error', async () => {
    const promise = multipartHttpFetchClientExecutor(mockRequest);
    (mockXhr.upload as XMLHttpRequest).onerror?.({} as ProgressEvent);

    await expect(promise).rejects.toThrow('NETWORK_ERROR');
  });

  test('clears timeout when request completes', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const promise = multipartHttpFetchClientExecutor(mockRequest);
    mockXhr.onload?.({} as ProgressEvent);

    await promise;
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
