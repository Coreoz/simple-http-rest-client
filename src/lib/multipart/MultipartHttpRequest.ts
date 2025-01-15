import { HttpMethod } from 'simple-http-request-builder';

export type MultipartHttpOptions = {
  timeoutInMillis: number,
  onProgressCallback: (event: ProgressEvent) => void,
  withCredentials: boolean,
};

export type MultipartHttpClient<T> = (request: MultipartHttpRequest<unknown>) => T;

export class MultipartHttpRequest<T> {
  private static readonly DEFAULT_TIMEOUT_IN_MILLIS: number = 60_000; // 1 minute

  readonly multipartHttpClient: MultipartHttpClient<T>;

  readonly baseUrl: URL;

  readonly method: HttpMethod;

  readonly path: string;

  readonly headersValue: HeadersInit;

  readonly formData: FormData;

  readonly optionValues: MultipartHttpOptions;

  constructor(
    multipartHttpClient: MultipartHttpClient<T>,
    baseUrl: string,
    method: HttpMethod,
    path: string,
    options?: Partial<MultipartHttpOptions>,
  ) {
    this.multipartHttpClient = multipartHttpClient;
    this.baseUrl = new URL(baseUrl);
    this.method = method;
    this.path = path;
    this.headersValue = {};
    this.formData = new FormData();
    this.optionValues = {
      timeoutInMillis: options?.timeoutInMillis ?? MultipartHttpRequest.DEFAULT_TIMEOUT_IN_MILLIS,
      onProgressCallback: options?.onProgressCallback ?? (() => {}),
      withCredentials: options?.withCredentials ?? false,
    };
  }

  headers(headers: Record<string, string>) {
    Object.assign(this.headersValue, headers);
    return this;
  }

  data(multipartHttpData: [string, string | Blob | undefined][]) {
    for (const multipartHttpDataEntry of multipartHttpData) {
      if (multipartHttpDataEntry[1]) {
        this.formData.append(multipartHttpDataEntry[0], multipartHttpDataEntry[1]);
      }
    }
    return this;
  }

  file(file: File) {
    this.data([['file', file]]);
    return this;
  }

  files(files: File[]) {
    for (const file of files) {
      this.file(file);
    }
    return this;
  }

  buildUrl() {
    return encodeURI(this.baseUrl.toString() + this.path);
  }

  /**
   * Execute the request using the {@link multipartHttpClient}.
   */
  execute(): T {
    return this.multipartHttpClient(this);
  }
}
