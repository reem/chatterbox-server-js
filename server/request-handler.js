/* globals module, require */

/* You should implement your request handler function in this file.
 * And hey! This is already getting passed to http.createServer()
 * in basic-server.js. But it won't work as is.
 * You'll have to figure out a way to export this function from
 * this file and include it in basic-server.js so that it actually works.
 * *Hint* Check out the node module documentation at http://nodejs.org/api/modules.html. */

var fs = require("fs");

/* These headers will allow Cross-Origin Resource Sharing (CORS).
 * This CRUCIAL code allows this server to talk to websites that
 * are on different domains. (Your chat client is running from a url
 * like file://your/chat/client/index.html, which is considered a
 * different domain.) */

var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

var handleResponse = function (response) {
  return function (end, statusCode) {
    var statusCode = statusCode || 200;

    /* Without this line, this server wouldn't work. See the note
     * below about CORS. */
    var headers = defaultCorsHeaders;

    response.writeHead(statusCode, headers);

    response.end(end);
  };
};

var getFile = function (filename, callback) {
  fs.readFile(filename, function (err, data) {
    if (err) {
      throw err;
    }
    callback(data);
  });
};

var takeWhile = function (array, predicate) {
  var result = [];
  var i = 0;
  while (predicate(array[i])) {
    result.push(array[i++]);
  }
  return result;
};

module.exports.handleRequest = function(request, response) {
  /* the 'request' argument comes from nodes http module. It includes info about the
  request - such as what URL the browser is requesting. */

  /* Documentation for both request and response can be found at
   * http://nodemanual.org/0.8.14/nodejs_ref_guide/http.html */

  console.log("Serving request type " + request.method + " for url " + request.url);

  var wrapUpRequest = handleResponse(response);

  if(request.url.indexOf("?") !== -1) {
    request.url = takeWhile(request.url, function (chr) {
      return chr !== "?";
    }).join("");
  }

  if(request.url === "/") {
    getFile("./client/index.html", wrapUpRequest);
  } else if (request.url === "/oldparseurl") {
    // Handle ajax call
    wrapUpRequest("hello darkness my old friend");
    if (request.method === "GET") {
      // return a collection of messages
    } else if (request.method === "POST") {
      // add new object to data.js file
    }
  } else {
    getFile("./client" + request.url, wrapUpRequest);
  }
};
