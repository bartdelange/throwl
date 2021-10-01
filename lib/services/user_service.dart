import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/user.dart' as user_models;

class UserService {
  final CollectionReference _users =
      FirebaseFirestore.instance.collection('users');

  StreamSubscription<QuerySnapshot<Object?>> get userChangeSubscription =>
      _users.snapshots().listen((event) {});

  Future<user_models.User> _parseUser(DocumentSnapshot<Object?> userDoc) async {
    Map<String, dynamic> data = userDoc.data()! as Map<String, dynamic>;
    if (data["friends"] != null) {
      List<user_models.Friend> friends = await Future.wait(
          data['friends'].map<Future<user_models.Friend>>((friend) async {
            var user = await friend['user'].get();
            return user_models.Friend(
                user_models.User(user.id, user['name'], user['email']),
                friend['confirmed'],
                friend['requester']);
          }).toList());
      return user_models.User.withFriends(
          userDoc.id, data["name"], data["email"], friends);
    } else {
      return user_models.User.withFriends(
          userDoc.id, data["name"], data["email"], []);
    }
  }

  DocumentReference getReference(String uid) {
    return _users.doc(uid);
  }

  Future<user_models.User> getById(String uid) async {
    var userDoc = await _users.doc(uid).get();
    return _parseUser(userDoc);
  }

  Future<user_models.User?> getByEmail(String email) async {
    var users = await FirebaseFirestore.instance
        .collection("users")
        .where('email',
        isEqualTo:
        email.toLowerCase())
        .get();

    if (users.docs.isEmpty) {
      return null;
    }
    return _parseUser(users.docs.first);
  }

  Future<user_models.User> createUser(uid, email, fullName) async {
    await _users
        .doc(uid)
        .set({"name": fullName, "email": email, "friends": []});

    return await getById(uid);
  }

  Future<user_models.User> updateUser(uid, Map<String, Object?> set) async {
    await _users
        .doc(uid)
        .update(set);

    return await getById(uid);
  }
}
