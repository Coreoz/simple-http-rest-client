import { parseHeadersFromRawString } from '../../lib/multipart/RawHeaderParser';

const rawHeaders = 'date: Fri, 08 Dec 2017 21:04:30 GMT\r\n'
   + 'content-encoding: gzip\r\n'
   + 'content-type: text/html; charset=utf-8\r\n'
   + 'content-length: 6502\r\n';

const rawHeadersWithNoSpaces = 'date:Fri, 08 Dec 2017 21:04:30 GMT\r\n'
  + 'content-encoding:gzip\r\n'
  + 'content-type:text/html; charset=utf-8\r\n'
  + 'content-length:6502\r\n';

describe('Tests raw header parser', () => {
  test('Check headers parsed are ok', async () => {
    const headers: Headers = parseHeadersFromRawString(rawHeaders);

    expect(headers.get('date')).toBe('Fri, 08 Dec 2017 21:04:30 GMT');
    expect(headers.get('content-encoding')).toBe('gzip');
    expect(headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(headers.get('content-length')).toBe('6502');
  });
  test('Check headers parsed from string with no spaces are ok', async () => {
    const headers: Headers = parseHeadersFromRawString(rawHeadersWithNoSpaces);

    expect(headers.get('date')).toBe('Fri, 08 Dec 2017 21:04:30 GMT');
    expect(headers.get('content-encoding')).toBe('gzip');
    expect(headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(headers.get('content-length')).toBe('6502');
  });

  test('Check empty string does not fail', async () => {
    const headers: Headers = parseHeadersFromRawString('');

    expect(headers.has('date')).toBe(false);
  });
});
