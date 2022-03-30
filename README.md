Simple HTTP REST Client
=======================
This library provides a framework for creating a REST HTTP client in TypeScript and JavaScript.
In other words, this library can be used to consume every type of API that uses the request/response pattern.
But this library **should not be used** to consume websockets.

This library implements [Simple HTTP Request Builder](https://github.com/Coreoz/simple-http-request-builder) with [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).

Though this library works seamlessly with [Jersey module of Plume Framework](https://github.com/Coreoz/Plume/tree/master/plume-web-jersey), it can be easily adapted to work with any backend API.

Installation
------------
Using NPM:
```
npm install simple-http-request-builder
```

Using Yarn:
```
yarn add simple-http-request-builder
```

General usage
-------------
This library is used by default in the project templates provided by
[Create Plume React Project](https://github.com/Coreoz/create-plume-react-project).
Basic usage of the library can be found in:
- The API client declaration: <https://github.com/Coreoz/create-plume-react-project/blob/master/templates/admin/src/api/ApiHttpClient.ts>
- An API client usage (here authentication): <https://github.com/Coreoz/create-plume-react-project/blob/master/templates/admin/src/api/session/SessionApi.ts>

Main components example
-----------------------
To consume an API, there is 3 steps:
1. Configure the API client: this will build a request and with the attached HTTP client. The API client will generally be the same for all endpoints of the same host. More API clients may be needed to differentiate public and authenticated parts of the whole host API catalog.
2. Configure each API endpoint
3. Consume the API endpoint

Here are sample for these 3 steps:
### Configure the API client
This function be called for each API endpoint identified by a Method and a Path.
A request builder will be returned, when executed, this request will return a [HttpPromise<T>](#httppromise).

```typescript
restRequest<T>(method: HttpMethod, path: string): HttpRequest<HttpPromise<T>> {
  return new HttpRequest<HttpPromise<T>>(
    // the base API client
    (httpRequest) => new HttpPromise<T>(
      // unwrapHttpPromise enables to transforme a Promise<HttpResponse<T>> result to a HttpPromise<T> result
      // while defaultJsonFetchClient will connect take care of HTTP exchange and try to parse the result to a JSON T object (the generic parameter that represents the type we are waiting for)
      unwrapHttpPromise(defaultJsonFetchClient(httpRequest)),
      httpRequest,
    ),
    // the base URL, e.g. https://google.fr/api
    baseUrl,
    // the method, e.g. HttpMethod.GET
    method,
    // the path, e.g. /users/123/addresses
    path,
  );
}
```

### Configure each API endpoint
Here the goal is to configure the specific API call to an endpoint. So the previous [API client](#configure-the-api-client) created will be used.

In the following example:
- The endpoint is `/admin/session` to authenticate a user by verifying its credentials
- This endpoint takes a JSON object as a body argument that complies to the TS type `SessionCredentials`
- This endpoint returns a JSON object that complies to the TS type `SessionToken`

```typescript
authenticate(credentials: SessionCredentials): HttpPromise<SessionToken>  {
  return httpClient
    .restRequest<SessionToken>(HttpMethod.POST, '/admin/session')
    .jsonBody(credentials)
    // this line will execute the request on the httpClient and return the result promise
    .execute();
}
```

### Consume the API endpoint
Here the previous configured [API endpoint call](#configure-each-api-endpoint) will be used to actually make the call inside the project logic.

```typescript
authenticate(credentials: SessionCredentials) {
  sessionApi
    .authenticate(credentials)
    .then((sessionToken: SessionToken) => {
      console.log(`Session created ${sessionToken.webSessionToken}, should grant access to the user`);
    })
    .catch((httpError: HttpError) => {
      // see below to have a look of the error codes handled by the library and how to configure you owns errors
      console.log(`Authentication failed, error code: ${httpError.errorCode}`);
    });
}
```

Main concepts
-------------
Basic types are:
- [HttpRequest](#httprequest): request configuration
- [FetchResponseHandler](#fetchresponsehandler): raw `fetch` `Response` validation/transformation
- [HttpResponse](#httpresponse): the response created from a [FetchResponseHandler](#fetchresponsehandler)

On top of that, the [HttpPromise](#httppromise) is often used on a [HttpResponse](#httpresponse) object to:
- Ease the usage of the Promise
- Make sure to have logs in case an error occurred even though a `catch` statement is not set

### HttpRequest
It represents a request that will be executed by an HttpClient.
This is the main object defined in [Simple HTTP Request Builder](https://github.com/Coreoz/simple-http-request-builder).
See directly the type source for documentation: <https://github.com/Coreoz/simple-http-request-builder/tree/master/src/HttpRequest.ts>

### HttpResponse
This object represents the successful or failed HTTP response.
It is returned by an HttpClient and by a [FetchResponseHandler](#fetchresponsehandler).
HTTP failures are represented by an [error](#httperror).
See directly the type source for documentation: <https://github.com/Coreoz/simple-http-fetch-client/tree/master/src/client/HttpResponse.ts>

### FetchResponseHandler
Handlers are executed after a successful HTTP response is available: this means an HTTP response has been received (whichever the response statut, 200, 400 or 500...).
These handlers will:
- Validate some preconditions and if necessary return an error result
- Return a result

So a handler can:
- Either return a result (which can be a successful result or an error), in that case following handlers **will not be executed**
- Either return `undefined`, in that case following handlers **will be executed**

Expected results should be of type `Promise` of [HttpResponse](#httpresponse).

Here are two sample usage:
- A handler that validate the HTTP status code: <https://github.com/Coreoz/simple-http-fetch-client/tree/master/src/client/FetchStatusValidators.ts>
- A handler that return a JSON results (the function is named `toJsonResponse`): <https://github.com/Coreoz/simple-http-fetch-client/tree/master/src/client/JsonFetchClient.ts>

### HttpPromise
A mutable safe `Promise` that ensures:
- Either a then function is provided or either an info log statement will be issued
- Either a catch function is provided or either a warning log statement will be issued
- Then and Catch functions are wrapped to ensure that if an error occurs during the execution,
  an error statement is issued

See directly the type source for documentation: <https://github.com/Coreoz/simple-http-fetch-client/tree/master/src/promise/HttpPromise.ts>

### HttpError
Http errors can be:
- Raised by the library, in that case the work will only be to if necessary display the correct error message
- Raised by the project that configured the library to a specific API that raises its own errors

See directly the type source for documentation: <https://github.com/Coreoz/simple-http-fetch-client/tree/master/src/client/HttpResponse.ts>

#### Errors raised by the library
The errors handled by the library are:
- **NETWORK_ERROR**: It means the remote API could not be contacted, it is likely due to poor network connection on the client side
- **TIMEOUT_ERROR**: It means the remote API could be contact but no result has been returned after the timeout delay. It might also be due to poor network connection, but it can also be due to an API issue. The default timeout is 20 seconds, but that can be configured
- **FORBIDDEN_ERROR**: It means the API returned a 403 response. This error is raised by the [validator](#TODO) `validateBasicStatusCodes`
- **INTERNAL_ERROR**: It means a parsing error occurred: a `then` function provided to a `HttpPromise.then()` function raised an error, the parsing of the JSON object raised an error, the server returned a non JSON response, etc. Since this error is related to a developer error or a backend error, we generally want to display the same generic error to an end user. If this error is not suitable for a project, it is possible to get rid of this by having customized [validator](#TODO) and wrapping `then` and `catch` functions provided to [HttpPromise](#httppromise) to make sure these functions never fails or raised custom [HttpError](#httperror)

Step by step custom usage
-------------------------
Here are the steps to use any custom API:

### Create a basic API client
Start by creating a proxy to the `fetchClient` method:
```typescript
const apiFetchClient = <T>(httpRequest: HttpRequest<unknown>): Promise<HttpResponse<T>> => fetchClient(httpRequest);
```

Note that the function `fetchClient` takes rest parameters/varargs of type [FetchResponseHandler](#fetchresponsehandler).
These parameters enable to customize the client. This is covered in the next following sections:
- [Validators](#add-validators)
- [Response mapper](#add-a-response-mapper)

### Add validators
The goal here is to verify that the result is excepted and correct.

By default, these validators are provided:
- **validateBasicStatusCodes**: It raises an error if the status code is 403, and it returns an empty response if the status code is 200
- **jsonContentTypeValidator**: It verifies the response content-type is JSON
- **contentTypeValidator**: It is used to create response content-type validator like `jsonContentTypeValidator`

Once validators are added, our API client should look like this:
```typescript
const apiFetchClient = <T>(httpRequest: HttpRequest<unknown>): Promise<HttpResponse<T>> => fetchClient(
  httpRequest,
  // here are the response validators for our custom API
  validateBasicStatusCodes, jsonContentTypeValidator,
);
```

### Add a response mapper
The goal here is to parse the response's body and return the correct object. For example to parse a JSON content:
1. The JSON body should be parsed (using `response.json()`)
2. Depending on the status code:
  1. If the status code is 2xx, the response object should be appended to the field `HttpResponse.response`
  2. Else the response is an error, the error might be categorized, it should then be appended to the field `HttpResponse.error`
3. If the JSON parsing failed, an error should be to the field `HttpResponse.error`

All these actions are implemented in the function `toJsonResponse(response: Response, jsonErrorMapper: JsonErrorMapper = defaultJsonErrorMapper): Promise<HttpResponse<unknown>>`:
- Parameter `response` is the `fetch` `Response` to parse
- Parameter `jsonErrorMapper` is the `JsonErrorMapper` that will handle the parsed JSON object in case
  the HTTP response is not successful: i.e. status code is not 2xx

So to configuring the JSON response mapper for a dedicated API should look like this:
```typescript
// First the error mapper should be configured
// Here what is important is to create errors that will be handled later:
//  either for processing or for displaying to the user
// So if an API should be consumed and the errors are more or less ignored,
//  the implementation should contain a simple logger statement with a genericError
const apiJsonErrorMapper: JsonErrorMapper = (response: Response, json: any) => {
  // The mapping can be done using the response object
  if (response.status === 401) {
    // a custom error that could be created for the need of the project
    return insufficientPermissionsError;
  }
  // The mapping can be done using the JSON response body object
  if (typeof json.errorCode !== 'undefined') {
    return { error: json };
  }
  // If the error is not recognized a generic error should be issued
  logger.error('Unrecognized JSON error', response);
  return { error: genericError };
};
```

Once this error mapper is configured, the response mapper function can be configured:
```typescript
// The response mapper is creating by configuring toJsonResponse with our custom apiJsonErrorMapper
const toApiJsonResponse
: FetchResponseHandler = (response) => toJsonResponse(response, apiJsonErrorMapper);
```

Finally, the API client can be configured with the response mapper:
```typescript
const apiFetchClient = <T>(httpRequest: HttpRequest<unknown>): Promise<HttpResponse<T>> => fetchClient(
  httpRequest,
  // here are the response validators for our custom API
  validateBasicStatusCodes, jsonContentTypeValidator,
  // the response mapper
  toApiJsonResponse,
);
```

This can then be used following the [main components example](#main-components-example) described above
by replacing `defaultJsonFetchClient` by `apiFetchClient`.

Note that if an API is using XML or any other language, the method `toJsonResponse` should be rewritten to accept this specific language.

Advanced usages
---------------
Some components that can be used for specific use cases are described here.

### SynchronizedHttpPromise
The use case addressed here is: *How to avoid calling multiple times the same API whereas the first call has not yet been resolved*.
So for example:
- Multiple components need to get a configuration value that is available through an API
- The result of the API is put in cache
- But by default, when loading the application, the API will be called multiple times because the first call did not yet resolve

The [SynchronizedHttpPromise](https://github.com/Coreoz/simple-http-fetch-client/tree/master/src/promise/SynchronizedHttpPromise.ts)
will ensure there is only one [HttpPromise](#httppromise) running at a time.

### PromiseMonitor
This class enables to check what are the status of promises that are being executed.

A use case is Server-Side-Rendering:
- After a first render
- It is interesting to watch the promises that are being executed
- And when all promises have revolved, it is guessable that all the data are ready for the application to rerender again

For more information, see the corresponding source code: <https://github.com/Coreoz/simple-http-fetch-client/tree/master/src/promise/PromiseMonitor.ts>
