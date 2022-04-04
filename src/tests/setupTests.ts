const nodeFetch = require('node-fetch');
const { Headers, Request, Response } = require('node-fetch');

global.fetch = nodeFetch;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;

export {};
