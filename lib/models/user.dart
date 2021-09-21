class Friend {
  User user;
  bool confirmed;
  String? requester;

  Friend(this.user, this.confirmed, this.requester);
}

class User {
  String userId;
  String name;
  String email;
  List<Friend> friends = [];

  User(this.userId, this.name, this.email);
  User.withFriends(this.userId, this.name, this.email, this.friends);
}