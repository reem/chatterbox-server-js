/* globals module, require */

/* You should implement your request handler function in this file.
 * And hey! This is already getting passed to http.createServer()
 * in basic-server.js. But it won't work as is.
 * You'll have to figure out a way to export this function from
 * this file and include it in basic-server.js so that it actually works.
 * *Hint* Check out the node module documentation at http://nodejs.org/api/modules.html. */

var fs = require("fs");
var url = require("url");

var messages = [];

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

var getMessages = function (query, callback) {
  callback(JSON.stringify(messages));
};

var postMessages = function (query) {
  query = JSON.parse(query);
  var obj = {
    username: query.username,
    roomname: query.roomname,
    text: query.text
  };
  messages.unshift(obj);
  console.log(messages);
};

module.exports.handleRequest = function(request, response) {
  /* the 'request' argument comes from nodes http module. It includes info about the
  request - such as what URL the browser is requesting. */

  /* Documentation for both request and response can be found at
   * http://nodemanual.org/0.8.14/nodejs_ref_guide/http.html */

  console.log("Serving request type " + request.method + " for url " + request.url);

  var wrapUpRequest = handleResponse(response);

  var urlParts = url.parse(request.url, true);

  if(urlParts.pathname === "/") {
    getFile("./client/index.html", wrapUpRequest);
  } else if (urlParts.pathname === "/1/classes/chatterbox") {
    if (request.method === "GET") {
      getMessages(urlParts.query, wrapUpRequest);
    } else if (request.method === "POST") {
      var body = "";
      request.on("data", function(data){
        body += data;
        if(body.length>1e6){
          request.connection.destroy();
        }
        postMessages(body);
      });
    }
  } else {
    getFile("./client" + urlParts.pathname, wrapUpRequest);
  }
};
