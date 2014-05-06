/* globals require, __dirname */
var express = require("express");
var fs = require("fs");
var url = require("url");
var path = require("path");

// Create the main express app.
var app = express();

var server = app.listen(3000, function() {
  console.log("Listening on port %d", server.address().port);
});

// Our global messages array.
var messages = [];

// These headers are extremely important as they allow us to
// run this file locally and get around the same origin policy.
// Without these headers our server will not work. 
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

// This function is extremely useful. It lets us
// abstract away the logic of writing response headers
// and status-codes for our get and post ajax requests
// 
// handleResponse takes a response object, and returns
// a specialized function that will apply some return
// string and statusCode to the response. Effectively,
// this lets us just use handleResponse(res) as our
// callback to many asynchronous functions and make
// the logic of our code much simpler.
//
// Such is the power of closures.
var handleResponse = function (response) {
  return function (end, statusCode) {
    // Default to 200.
    statusCode = statusCode || 200;

    // Without this line, this server wouldn't work. See the note
    // above about CORS.
    var headers = defaultCorsHeaders;

    // Write out the header to the response.
    response.writeHead(statusCode, headers);

    // Write our data to end.
    response.end(end);
  };
};

// Our get request callback, which will post our messages
// array to the client over ajax.
var getMessages = function (query, callback) {
  // Just stringify and call the callback with statusCode 200.
  callback(JSON.stringify({results: messages}), 200);
};

var postMessages = function (query, callback) {
  query = JSON.parse(query);
  // Create our custom message object.
  var obj = {
    username: query.username,
    roomname: query.roomname,
    text: query.text
  };
  // We take the O(n) hit here, once per message,
  // rather than reversing the list on the client
  // every time we make a GET request.
  messages.unshift(obj);
  // Dole out the right response code.
  callback("", 201);
};

// Just redirect root to index.html
app.get("/", function(req, res){
  res.sendfile("./client/index.html");
});

// Intercept the right GET requests.
app.get("/classes/messages", function (req, res) {
  getMessages(url.parse(req.url).query, handleResponse(res));
});

// Intercept the right POST requests.
app.post("/classes/messages", function (req, res) {
  var body = "";
  req.on("data", function(data){
    body += data;
    // We do this seemingly tedious thing to protect
    // against DOS attacks, so one huge message can't
    // crash our server.
    if (body.length > 1e3) {
      req.connection.destroy();
    }
    // Post our message.
    postMessages(body, handleResponse(res));
  });
});

app.configure(function () {
  // Some catch-all express magic to serve all of our client
  // css and js easily. This is much dirtier in vanilla node.
  app.use(express.static(path.join(__dirname, "../client")));
});
