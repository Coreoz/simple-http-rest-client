import { genericError } from '../../lib/client/HttpResponse';
import {
  defaultTextErrorMapper,
  toErrorTextResponse,
  toTextResponse,
} from '../../lib/handler/ResponseTextHandler';

describe('toTextResponse', () => {
  test('returns the text on a successful response', async () => {
    const result = await toTextResponse(new Response('hello', { status: 200 }));
    expect(result).toEqual({ response: 'hello' });
  });

  test('uses the jsonErrorMapper on a non-successful response', async () => {
    const response = new Response(JSON.stringify({ errorCode: 'BACKEND' }), { status: 500 });
    const result = await toTextResponse(response);
    expect(result).toEqual({ error: { errorCode: 'BACKEND' } });
  });
});

describe('toErrorTextResponse', () => {
  test('returns the text on a successful response', async () => {
    const result = await toErrorTextResponse(new Response('hello', { status: 200 }));
    expect(result).toEqual({ response: 'hello' });
  });

  test('maps a non-successful response using the text error mapper', async () => {
    const mapper = vi.fn().mockReturnValue({ error: { errorCode: 'BACKEND_ERROR' } });
    const result = await toErrorTextResponse(new Response('Some error message', { status: 500 }), mapper);
    expect(mapper).toHaveBeenCalledWith(expect.any(Response), 'Some error message');
    expect(result).toEqual({ error: { errorCode: 'BACKEND_ERROR' } });
  });

  test('returns a generic error by default for a non-successful response', async () => {
    const result = await toErrorTextResponse(new Response('oops', { status: 500 }));
    expect(result).toEqual({ error: genericError });
  });
});

describe('defaultTextErrorMapper', () => {
  test('returns a generic error', () => {
    expect(defaultTextErrorMapper(new Response(), 'oops')).toEqual({ error: genericError });
  });
});
