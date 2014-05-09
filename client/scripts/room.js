/* globals message, $, _ */

var room = (function () {

  var Room = function (name, selector) {
    this.name = name;
    this.messages = [];
    this.selector = selector || function (datum) {
          return datum.room === that.name;
    };

    this.getMessages();
    setInterval(this.getMessages.bind(this), 500);
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
    $.ajax({
      url: '/classes/messages',
      type: 'GET',
      contentType: 'application/json',
      success: function (data) {
        console.log('Chatterbox: Messages Received!');
        data = JSON.parse(data);
        data = _.map(data.results, function (datum) {
          return new message.Message(datum.username, datum.text, datum.roomname);
        });
        this.messages = _.filter(data, this.selector.bind(this));
      }.bind(this),
      error: function () {
        console.log('Chatterbox: Failed to get messages.');
      }
    });
  };

  Room.prototype.send = function () {
    $.ajax({
      url: '/classes/rooms',
      type: 'POST',
      data: this.serialize(),
      contentType: 'application/json',
      success: function () {
        console.log('Chatterbox: Room Sent!');
      },
      error: function () {
        console.log('Chatterbox: Failed to send room.');
      }
    });  
  };

  Room.prototype.serialize = function () {
    return JSON.stringify({
      name: this.name
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
