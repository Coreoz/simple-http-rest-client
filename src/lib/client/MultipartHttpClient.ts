import { HttpMethod } from 'simple-http-request-builder';
import {
  FetchResponseHandler,
  genericError,
  HttpPromise,
  HttpResponse,
  networkErrorCatcher,
  toErrorResponsePromise,
  unwrapHttpPromise,
} from 'simple-http-rest-client';
import { Logger } from 'simple-logging-system';
import {
  MultipartHttpClient,
  MultipartHttpOptions,
  MultipartHttpRequest,
} from './MultipartHttpRequest';

const logger: Logger = new Logger('MultipartHttpClient');

export const multipartHttpFetchClientExecutor: MultipartHttpClient<Promise<unknown>> = (
  multipartHttpRequest: MultipartHttpRequest<unknown>,
): Promise<Response> => {
  const { boundary }: MultipartHttpOptions = multipartHttpRequest.optionValues;
  const stream: ReadableStream<unknown> = new ReadableStream({
    start(controller: ReadableStreamDefaultController<unknown>) {
      const encoder: TextEncoder = new TextEncoder();
      const entries = Array.from(multipartHttpRequest.formData.entries());
      const processNextEntry = (index: number) => {
        if (index >= entries.length) {
          // Finalize the stream with the closing boundary
          controller.enqueue(encoder.encode(`--${boundary}--\r\n`));
          controller.close();
          return;
        }

        const [name, data] = entries[index];
        const enqueueBoundaryAndHeaders = () => {
          controller.enqueue(encoder.encode(`--${boundary}\r\n`));
          if (data instanceof Blob) {
            // Binary data
            const contentType = data.type || 'application/octet-stream';
            controller.enqueue(encoder.encode(
              `Content-Disposition: form-data; name="${name}"; filename="${name}"\r\n`
              + `Content-Type: ${contentType}\r\n\r\n`,
            ));
            return data.stream().getReader();
          }
          // Text data
          controller.enqueue(encoder.encode(
            `Content-Disposition: form-data; name="${name}"\r\n\r\n`,
          ));
          controller.enqueue(encoder.encode(`${data.toString()}\r\n`));
          return null;
        };

        const reader = enqueueBoundaryAndHeaders();

        // Handle text directly, or start processing binary data
        if (!reader) {
          processNextEntry(index + 1); // Process the next entry
          return;
        }

        // Process the binary data with recursion
        const pumpReader = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              // Move to the next entry
              controller.enqueue(encoder.encode('\r\n'));
              processNextEntry(index + 1);
            } else {
              // Enqueue the current chunk
              controller.enqueue(value);
              pumpReader(); // Process the next chunk
            }
          });
        };

        pumpReader();
      };

      processNextEntry(0); // Start processing the first entry
    },
    cancel: (reason: unknown) => {
      multipartHttpRequest.optionValues.timeoutAbortController.abort(reason);
    },
  });
  const timeoutHandle = setTimeout(
    () => stream.cancel('timeout'),
    multipartHttpRequest.optionValues.timeoutInMillis,
  );
  return fetch(
    multipartHttpRequest.buildUrl(),
    {
      headers: {
        ...multipartHttpRequest.headersValue,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      method: HttpMethod.POST,
      body: stream,
      signal: multipartHttpRequest.optionValues.timeoutAbortController.signal,
      duplex: 'half',
    },
  )
    .finally(() => clearTimeout(timeoutHandle));
};

export const multipartHttpFetchClient = <T = void>(
  httpRequest: MultipartHttpRequest<unknown>,
  ...handlers: FetchResponseHandler[]
): Promise<HttpResponse<T>> => <Promise<HttpResponse<T>>>multipartHttpFetchClientExecutor(httpRequest)
  .then((response) => {
    for (const handler of handlers) {
      try {
        const handlerResult = handler(response);
        if (handlerResult !== undefined) {
          return handlerResult;
        }
      } catch (error) {
        logger.error('Error executing handler', { error });
        return toErrorResponsePromise(genericError);
      }
    }
    return { response };
  })
  .catch(networkErrorCatcher);

export type MultipartHttpFetchClient = <T>(
  multipartHttpRequest: MultipartHttpRequest<unknown>,
) => Promise<HttpResponse<T>>;

export function createMultipartHttpFetchRequest<T>(
  baseUrl: string,
  path: string,
  multipartHttpClient: MultipartHttpFetchClient,
  options?: Partial<MultipartHttpOptions>,
): MultipartHttpRequest<HttpPromise<T>> {
  return new MultipartHttpRequest<HttpPromise<T>>(
    (multipartHttpRequest: MultipartHttpRequest<unknown>) => new HttpPromise<T>(
      unwrapHttpPromise<T>(multipartHttpClient(multipartHttpRequest)),
      multipartHttpRequest,
    ),
    baseUrl,
    path,
    options,
  );
}
