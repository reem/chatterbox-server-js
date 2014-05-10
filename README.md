# Chatterbox Server

To get this working:

* `npm install` in the main directory
* `npm install -g bower` to make sure you have the latest version of bower
* `bower install` in the client directory
* `nodemon server/server.js` in the main directory

This is a small example of a server built using nodejs.

The current implementation on master uses express for its extreme brevity,
but the earlier versions used a vanilla nodejs router of our own design.

It goes without saying that the express version is much simpler.

This was originally a project from [Hack Reactor's](http://hackreactor.com) curriculum.
