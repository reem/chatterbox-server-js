/* Import node's http module: */
/* globals require */
var express = require("express");
var fs = require("fs");
var url = require("url");

var app = express();

var server = app.listen(3000, function() {
  console.log("Listening on port %d", server.address().port);
});

var messages = [];

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
      callback("", 404);
    }
    callback(data);
  });
};

var getMessages = function (query, callback) {
  callback(JSON.stringify({results: messages}), 200);
};

var postMessages = function (query, callback) {
  query = JSON.parse(query);
  var obj = {
    username: query.username,
    roomname: query.roomname,
    text: query.text
  };
  messages.unshift(obj);
  callback("", 201);
};

app.get("/", function(req, res){
  getFile("./client/index.html", handleResponse(res));
});

app.get("/classes/messages", function (req, res) {
  getMessages(url.parse(req.url).query, handleResponse(res));
});

app.post("/classes/messages", function (req, res) {
  var body = "";
  req.on("data", function(data){
    body += data;
    if(body.length>1e6){
      req.connection.destroy();
    }
    postMessages(body, handleResponse(res));
  });
});

app.get("*", function (req, res) {
  getFile("./client" + url.parse(req.url).pathname, handleResponse(res));
});
