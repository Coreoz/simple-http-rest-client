/**
 * Parse header to {@link Headers} object from raw flat string
 * Designed to handle XMLHttpRequest.getAllResponseHeaders string
 * More info at : https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders
 * @param rawHeaders the raw string with the headers
 */
// eslint-disable-next-line import/prefer-default-export
export const parseHeadersFromRawString = (rawHeaders: string): Headers => {
  const headers: Headers = new Headers();
  rawHeaders.trim().split(/[\r\n]+/).forEach((line: string) => {
    const headerSeparatorPosition = line.indexOf(':');
    if (headerSeparatorPosition > 1) { // if the header line is well formed
      const headerValueStartPosition = headerSeparatorPosition + 1;
      headers.append(
        line.substring(0, headerSeparatorPosition), // header name
        headerValueStartPosition === line.length ? '' : line.substring(headerValueStartPosition).trim(), // header value
      );
    }
  });
  return headers;
};
