import { HttpMethod, HttpRequest } from 'simple-http-request-builder';
import { fileFetchClient, octetStreamTypeValidator } from '../lib/client/FileFetchClient';

describe('octetStreamTypeValidator', () => {
  test('returns undefined when the content-type is octet-stream', () => {
    const response = new Response(null, {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    });
    expect(octetStreamTypeValidator(response)).toBeUndefined();
  });

  test('returns an error when the content-type is not octet-stream', async () => {
    const response = new Response(null, {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
    const result = await octetStreamTypeValidator(response);
    expect(result).toEqual({ error: { errorCode: 'INTERNAL_ERROR' } });
  });
});

describe('fileFetchClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns the array buffer for a successful file response', async () => {
    const buffer = new TextEncoder().encode('file-content').buffer as ArrayBuffer;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(buffer, {
        status: 200,
        headers: { 'content-type': 'application/octet-stream' },
      }),
    ) as unknown as typeof fetch;
    const request = new HttpRequest(fileFetchClient, 'http://localhost', HttpMethod.GET, '/file');
    const result = await request.execute();
    expect((result as { response: ArrayBuffer }).response).toEqual(buffer);
  });

  test('returns the parsed error for a non-successful response', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errorCode: 'BACKEND' }), {
        status: 500,
        headers: { 'content-type': 'application/octet-stream' },
      }),
    ) as unknown as typeof fetch;
    const request = new HttpRequest(fileFetchClient, 'http://localhost', HttpMethod.GET, '/file');
    const result = await request.execute();
    expect(result).toEqual({ error: { errorCode: 'BACKEND' } });
  });
});
