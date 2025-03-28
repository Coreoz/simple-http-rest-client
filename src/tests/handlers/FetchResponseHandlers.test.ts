import { genericError, HttpResponse, toErrorResponsePromise } from '../../lib/client/HttpResponse';
import { FetchResponseHandler, processHandlers } from '../../lib/handler/FetchResponseHandlers';

jest.mock('../../lib/client/HttpResponse', () => ({
  toErrorResponsePromise: jest.fn(),
}));

describe('handleFetchResponse', () => {
  const mockResponse = new Response(null, { status: 200 });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns response when no handlers are provided', async () => {
    const result = await processHandlers(mockResponse, []);
    expect(result).toEqual({ response: mockResponse });
  });

  test('returns first handler\'s response when a handler provides a valid response', async () => {
    const expectedResponse: HttpResponse<string> = { response: 'Success' };
    const mockHandler: FetchResponseHandler = jest.fn().mockResolvedValue(expectedResponse);

    const result = await processHandlers(mockResponse, [mockHandler]);

    expect(mockHandler).toHaveBeenCalledWith(mockResponse);
    expect(result).toEqual(expectedResponse);
  });

  test('skips handlers that return undefined', async () => {
    const expectedResponse: HttpResponse<string> = { response: 'Success' };

    const mockHandler1: FetchResponseHandler = jest.fn().mockReturnValue(undefined);
    const mockHandler2: FetchResponseHandler = jest.fn().mockResolvedValue(expectedResponse);

    const result = await processHandlers(mockResponse, [mockHandler1, mockHandler2]);

    expect(mockHandler1).toHaveBeenCalledWith(mockResponse);
    expect(mockHandler2).toHaveBeenCalledWith(mockResponse);
    expect(result).toEqual(expectedResponse);
  });

  test('returns an error response if a handler throws an error', async () => {
    const error = new Error('Handler failed');
    const mockHandler: FetchResponseHandler = jest.fn().mockImplementation(() => {
      throw error;
    });

    (toErrorResponsePromise as jest.Mock).mockReturnValue(Promise.resolve({ error: genericError }));

    const result = await processHandlers(mockResponse, [mockHandler]);

    expect(mockHandler).toHaveBeenCalledWith(mockResponse);
    expect(result).toEqual({ error: genericError });
  });

  test('does not call subsequent handlers if a valid response is found', async () => {
    const expectedResponse: HttpResponse<string> = { response: 'Success' };

    const mockHandler1: FetchResponseHandler = jest.fn().mockResolvedValue(expectedResponse);
    const mockHandler2: FetchResponseHandler = jest.fn();

    const result = await processHandlers(mockResponse, [mockHandler1, mockHandler2]);

    expect(mockHandler1).toHaveBeenCalledWith(mockResponse);
    expect(mockHandler2).not.toHaveBeenCalled();
    expect(result).toEqual(expectedResponse);
  });
});
