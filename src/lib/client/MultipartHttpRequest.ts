export type MultipartHttpOptions = {
  timeoutInMillis: number,
  timeoutAbortController: AbortController,
  onProgressCallback: (event: ProgressEvent) => void,
  boundary: string,
};

export interface MultipartHttpClient<T> {
  (request: MultipartHttpRequest<unknown>): T;
}

export class MultipartHttpRequest<T> {
  readonly multipartHttpClient: MultipartHttpClient<T>;

  readonly baseUrl: URL;

  readonly path: string;

  readonly headersValue: HeadersInit;

  readonly formData: FormData;

  readonly optionValues: MultipartHttpOptions;

  constructor(
    multipartHttpClient: MultipartHttpClient<T>,
    baseUrl: string,
    path: string,
    options?: Partial<MultipartHttpOptions>,
  ) {
    this.multipartHttpClient = multipartHttpClient;
    this.baseUrl = new URL(baseUrl);
    this.path = path;
    this.headersValue = {};
    this.formData = new FormData();
    this.optionValues = {
      timeoutInMillis: options?.timeoutInMillis ?? 60000,
      timeoutAbortController: options?.timeoutAbortController ?? new AbortController(),
      onProgressCallback: options?.onProgressCallback ?? (() => {
      }),
      boundary: options?.boundary ?? `boundary-${Date.now()}`,
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
