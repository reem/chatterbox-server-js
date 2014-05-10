/* globals require, __dirname */
var express = require("express");
var fs = require("fs");
var url = require("url");
var path = require("path");
var _  = require("underscore");

// Create the main express app.
var app = express();

var server = app.listen(3000, function() {
  console.log("Listening on port %d", server.address().port);
});

// Our global messages array.
var messages = [];

// Our global rooms array.
var rooms = [];

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
// this lets us just use _.partial(sendData, res) as our
// callback to many asynchronous functions and make
// the logic of our code much simpler.
//
// Such is the power of closures.
var sendData = function (res, data, statusCode) {
  res.writeHead(statusCode || 200, exports.headers);
  res.end(data);
};

// These are two really cool functions. By just creating these
// general getFrom/postTo functions it makes adding messages or rooms
// extremely easy.
// 
// Unfortunately, you'll probably have to refactor this to work with
// a more complex database where rooms aren't represented in the same
// way as messages. It's clean for now though.
var getFromCollection = function (collection, query, callback) {
  callback(JSON.stringify({results: messages}), 200);
};

var postToCollection = function (collection, query, callback, fields) {
  query = JSON.parse(query);

  var obj = {};
  _.each(fields, function (field) {
    obj[field] = query[field];
  });
  // We take the O(n) hit here, once per message,
  // rather than reversing the list on the client
  // every time we make a GET request.
  collection.unshift(field);
  // Dole out the right response code.
  callback("Messages Received.", 201);
};

var setupCollection = function (app, collectionName, collection) {
  var collectionURL = "/classes/" + collectionName; // Fewer allocated strings.
  app.get(collectionURL, function (req, res) {
    getFromCollection(collection, url.parse(req.url).query, _.partial(sendData, res));
  });

  app.post(collectionURL, function (req, res) {
    // Such is the power of currying.
    // _ = missing middle argument = the data from the post request 
    fromPostRequest(req, _.partial(postToCollection, collection, _, _.partial(sendData, res)));
  });
};

var fromPostRequest = function (req, callback) {
  var body = "";
  req.on("data", function (data) {
    body += data;
    // We do this seemingly tedious thing to protect
    // against DOS attacks, so one huge message can't
    // crash our server.
    if (body.length > 1e3) {
      req.connection.destroy();
    }
  });
  req.on("end", function () {
    callback(body);
  }); 
};

// Just redirect root to index.html
app.get("/", function(req, res){
  res.sendfile("./client/index.html");
});

setupCollection(app, "messages", messages, [username, text, roomname]);
setupCollection(app, "rooms", rooms, [name]);

app.configure(function () {
  // Some catch-all express magic to serve all of our client
  // css and js easily. This is much dirtier in vanilla node.
  app.use(express.static(path.join(__dirname, "../client")));
});
