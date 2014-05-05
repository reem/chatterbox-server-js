var user = (function (){

  var User = function (name) {
    this.name = name;
    this.friends = {};
  };

  User.prototype.addFriend = function(friend) {
    this.friends[friend.name] = friend;
  };

  User.prototype.removeFriend = function(friend) {
    delete this.friends[friend.name];
  };

  return {
    User: User,
  };
}());
