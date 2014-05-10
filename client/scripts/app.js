var $ = $;
var _ = _;
var room = room;
var message = message;
var user = user;

var render = (function () {
  // Library of functions that create DOM nodes from
  // our javascript classes.
  var renderMessage = function (messageToRender) {
    return messageToRender.user + ': ' + messageToRender.text;
  };

  var renderRoom = function (roomToRender, currentUser) {
    var $room = $('<ul></ul>');

    $.each(roomToRender.messages, function (ind, messageToRender) {
      var $li = $('<li/>').text(renderMessage(messageToRender));
      if (messageToRender.user in currentUser.friends) {
        $li.addClass('friend');
      }
      $li.appendTo($room);
    });

    return $room;
  };

  return {
    message: renderMessage,
    room: renderRoom,
  };
}());

var app = (function () {
  // Brutally stolen from: http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  var getParameterByName = function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return !results ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  var currentRoom = new room.PublicRoom('main', function () { return true; });
  var currentUser = new user.User(getParameterByName('username'));

  var run = function () {
    $('#main').find('ul').remove();
    $('#main').append(render.room(currentRoom, currentUser));
    setTimeout(run, 400);
  };

  var getPublicRooms = function() {
    var that = this;
    $.when($.ajax({
      url: '/classes/rooms',
      type: 'GET',
      contentType: 'application/json',
      success: function (data) {
        console.log('Chatterbox: Rooms Received!');
        // make a new room for each uniq room in messages
        _(JSON.parse(data).results)
          .each(function (dataRoom) { new room.PublicRoom(dataRoom.name); });
      },
      error: function () {
        console.log('Chatterbox: Failed to get rooms.');
      }
    })).then(updateSidebar);
  };

  var updateSidebar = function () {
    var $sidebar = $('#sidebar');
    var $ul = $("<ul></ul>");
    $('#sidebar').find('ul').remove();
    $.each(room.PublicRoom.all, function (name, curRoom) {
      var $link = $('<a href="#"></a>').text(name);
      $link.on('click', function (e) {
        e.preventDefault();
        currentRoom = curRoom;
      });
      $('<li/>').append($link).appendTo($ul);
    });
    $sidebar.append($ul);
  };

  var setupMessageForm = function () {
    $('#messageForm').submit(function (e) {
      e.preventDefault();
      if (this.message.value === '') { return false; }
      var newMessage = new message.Message(
        currentUser.name,
        this.message.value,
        currentRoom.name);
      this.message.value = '';
      newMessage.send();
      return false;
    });
  };

  var setupFriendForm = function () {
    $('#friendForm').submit(function (e) {
      e.preventDefault();
      currentUser.friends[this.friend.value] = true;
      this.friend.value = '';
      return false;
    });
  };

  var setupRoomForm = function () {
    $('#roomForm').submit(function (e) {
      e.preventDefault();
      new room.PublicRoom(this.room.value);
      this.room.value = '';
      updateSidebar();
      return false;
    });
  };

  var setupForms = function () {
    setupMessageForm();
    setupRoomForm();
    setupFriendForm();
  };

  var init = function () {
    setupForms();
    getPublicRooms();
    updateSidebar();
    run();
  };

  return {
    init: init
  };
}());

// Actual entrance point.
$(document).ready(function () {
  app.init();
});
