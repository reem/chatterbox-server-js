/* globals message, $, _ */

var room = (function () {

  var Room = function (name, selector) {
    this.name = name;
    this.messages = [];
    this.currentUsers = []; // Perhaps
    this.selector = selector;

    this.getMessages();
    setInterval(_.bind(this.getMessages, this), 500);
  };

  Room.prototype.postMessage = function (message) {
    this.messages.push(message);
  };

  Room.prototype.addUser = function(user) {
    this.currentUsers.push(user);
  };

  Room.prototype.removeUser = function(user) {
    var indexOfUser = this.currentUsers.indexOf(user);
    if (indexOfUser !== -1) {
      this.currentUsers.splice(indexOfUser, 1);
    }
  };

  Room.prototype.getMessages = function () {
    var that = this;
    var selector = this.selector || function (datum) {
          return datum.room === that.name;
        };
    $.ajax({
      url: '/1/classes/chatterbox',
      type: 'GET',
      contentType: 'application/json',
      success: function (data) {
        console.log('Chatterbox: Messages Received!');
        data = JSON.parse(data);
        data = _.map(data, function (datum) {
          return new message.Message(datum.username, datum.text, datum.roomname);
        });
        that.messages = _.filter(data, selector);
      },
      error: function () {
        console.log('Chatterbox: Failed to get messages.');
      }
    });
  };

  var PrivateRoom = function (name, selector, allowedUsers) {
    Room.call(this, name, selector);
    this._allowedUsers = allowedUsers;
  };

  PrivateRoom.prototype = Object.create(Room.prototype);
  PrivateRoom.prototype.constructor = PrivateRoom;

  PrivateRoom.prototype.addUser = function (user) {
    var indexOfUser = this._allowedUsers.indexOf(user);
    if (indexOfUser !== -1) {
      Room.prototype.addUser.call(this, user);
    } else {
      throw new Error("Private Room: " + user.name + " is not allowed in this room");
    }
  };

  var PublicRoom = function (name, selector) {
    Room.call(this, name, selector);
    PublicRoom.all[this.name] = this;
  };

  PublicRoom.all = {}; // Name of Room -> Room

  PublicRoom.prototype = Object.create(Room.prototype);
  PublicRoom.prototype.constructor = PublicRoom;

  PublicRoom.prototype.delete = function () {
    delete PublicRoom.all[this.name];
  };

  var UserRoom = function (username) {
    Room.call(this, username);
  };

  UserRoom.prototype = Object.create(Room.prototype);
  UserRoom.prototype.constructor = UserRoom;

  UserRoom.prototype.getMessages = function () {
    var that = this;
    Room.prototype.getMessages.call(this, function (message) {
      return message.user === that.name;
    });
  };

  return {
    PrivateRoom: PrivateRoom,
    PublicRoom: PublicRoom,
    UserRoom: UserRoom
  };
}());
