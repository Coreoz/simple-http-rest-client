import { genericError } from '../../lib/client/HttpResponse';
import { defaultJsonErrorMapper, toJsonResponse } from '../../lib/handler/ResponseJsonHandler';

describe('toJsonResponse', () => {
  test('returns the parsed JSON object on a successful response', async () => {
    const response = new Response(JSON.stringify({ id: 1 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const result = await toJsonResponse(response);
    expect(result).toEqual({ response: { id: 1 } });
  });

  test('uses the jsonErrorMapper on a non-successful response', async () => {
    const response = new Response(JSON.stringify({ errorCode: 'BACKEND' }), { status: 500 });
    const result = await toJsonResponse(response);
    expect(result).toEqual({ error: { errorCode: 'BACKEND' } });
  });

  test('returns a generic error when the body is not valid JSON', async () => {
    const response = new Response('not a json', { status: 200 });
    const result = await toJsonResponse(response);
    expect(result).toEqual({ error: genericError });
  });

  test('uses a custom jsonErrorMapper when provided', async () => {
    const mapper = vi.fn().mockReturnValue({ error: { errorCode: 'CUSTOM' } });
    const response = new Response(JSON.stringify({ foo: 'bar' }), { status: 400 });
    const result = await toJsonResponse(response, mapper);
    expect(mapper).toHaveBeenCalled();
    expect(result).toEqual({ error: { errorCode: 'CUSTOM' } });
  });
});

describe('defaultJsonErrorMapper', () => {
  test('returns the json as error when it contains an errorCode', () => {
    const result = defaultJsonErrorMapper(new Response(), { errorCode: 'X' });
    expect(result).toEqual({ error: { errorCode: 'X' } });
  });

  test('returns a generic error when the json has no errorCode', () => {
    const result = defaultJsonErrorMapper(new Response(), { foo: 'bar' });
    expect(result).toEqual({ error: genericError });
  });
});
