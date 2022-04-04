// node-fetch@2 is required since jest does not support node-fetch 3
// eslint-disable-next-line max-len
// cf https://stackoverflow.com/questions/69383514/node-fetch-3-0-0-and-jest-gives-syntaxerror-cannot-use-import-statement-outside
const nodeFetch = require('node-fetch');
const { Headers, Request, Response } = require('node-fetch');

global.fetch = nodeFetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

// so TS does not raise errors because there is no import statement
export {};
