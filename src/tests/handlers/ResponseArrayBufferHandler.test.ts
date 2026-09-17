import { toArrayBufferResponse } from '../../lib/handler/ResponseArrayBufferHandler';

describe('toArrayBufferResponse', () => {
  test('returns the array buffer on a successful response', async () => {
    const buffer = new TextEncoder().encode('hello').buffer as ArrayBuffer;
    const response = new Response(buffer, { status: 200 });
    const result = await toArrayBufferResponse(response);
    expect((result as { response: ArrayBuffer }).response).toEqual(buffer);
  });

  test('uses the jsonErrorMapper on a non-successful response', async () => {
    const response = new Response(JSON.stringify({ errorCode: 'BACKEND' }), { status: 500 });
    const result = await toArrayBufferResponse(response);
    expect(result).toEqual({ error: { errorCode: 'BACKEND' } });
  });

  test('uses a custom jsonErrorMapper on a non-successful response', async () => {
    const mapper = vi.fn().mockReturnValue({ error: { errorCode: 'CUSTOM' } });
    const response = new Response(JSON.stringify({ foo: 'bar' }), { status: 400 });
    const result = await toArrayBufferResponse(response, mapper);
    expect(mapper).toHaveBeenCalled();
    expect(result).toEqual({ error: { errorCode: 'CUSTOM' } });
  });
});
