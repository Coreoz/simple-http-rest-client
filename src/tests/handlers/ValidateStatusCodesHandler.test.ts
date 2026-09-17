import { validateStatusCodes } from '../../lib/handler/ValidateStatusCodesHandler';

describe('validateStatusCodes', () => {
  test('returns an error response when the response status code is mapped', async () => {
    const handler = validateStatusCodes({ 401: { errorCode: 'UNAUTHORIZED' } });
    const result = await handler(new Response(null, { status: 401 }));
    expect(result).toEqual({ error: { errorCode: 'UNAUTHORIZED' } });
  });

  test('returns undefined when the response status code is not mapped', () => {
    const handler = validateStatusCodes({ 401: { errorCode: 'UNAUTHORIZED' } });
    const result = handler(new Response(null, { status: 500 }));
    expect(result).toBeUndefined();
  });

  test('supports multiple mapped status codes', async () => {
    const handler = validateStatusCodes({
      401: { errorCode: 'UNAUTHORIZED' },
      404: { errorCode: 'NOT_FOUND' },
    });
    const notFound = await handler(new Response(null, { status: 404 }));
    expect(notFound).toEqual({ error: { errorCode: 'NOT_FOUND' } });
  });
});
