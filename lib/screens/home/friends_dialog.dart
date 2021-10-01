import 'package:badges/badges.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/user.dart' as models;
import 'package:dartapp/screens/games.dart';
import 'package:dartapp/screens/login.dart';
import 'package:dartapp/screens/new_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class FriendsListDialog extends StatefulWidget {
  const FriendsListDialog({Key? key}) : super(key: key);

  @override
  State<FriendsListDialog> createState() => FriendsListDialogState();
}

class FriendsListDialogState extends State<FriendsListDialog> {
  final _authService = locator<AuthService>();
  final _userService = locator<UserService>();
  final _newFriendFieldController = TextEditingController();

  void _showMessage(String message) {
    showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text("Error"),
            content: Text(message),
            actions: [
              TextButton(
                child: const Text("Ok"),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              )
            ],
          );
        });
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      contentPadding: const EdgeInsets.only(top: 25),
      title: const Text('Friends'),
      content: SizedBox(
        width: 500,
        child: ClipRect(
          child: ValueListenableBuilder(
            valueListenable: _authService.currentUserNotifier,
            builder:
                (BuildContext context, models.User? user, Widget? child) {
              if (user == null) return Container();
              var friends = user.friends
                  .where((friend) => friend.confirmed)
                  .toList();
              return ListView.separated(
                separatorBuilder: (context, index) {
                  return const Divider(
                    height: 2,
                    thickness: 2,
                    color: Colors.black12,
                  );
                },
                shrinkWrap: true,
                padding: EdgeInsets.zero,
                itemCount: friends.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return Padding(
                      padding: const EdgeInsets.all(25),
                      child: TextField(
                        controller: _newFriendFieldController,
                        decoration: InputDecoration(
                          suffixIcon: TextButton(
                            style: TextButton.styleFrom(
                              backgroundColor:
                              Theme.of(context).primaryColor,
                              shape: const CircleBorder(),
                            ),
                            onPressed: () async {
                              var newFriend = await _userService.getByEmail(_newFriendFieldController.text.toLowerCase());
                              if (newFriend == null || newFriend.userId == user.userId) {
                                _showMessage("No user found");
                                return;
                              }
                              await _userService.updateUser(user.userId, {
                                'friends': FieldValue.arrayUnion([
                                  {
                                    "user": _userService.getReference(newFriend.userId),
                                    "requester": user.userId,
                                    "confirmed": false,
                                  }
                                ]),
                              });
                              await _userService.updateUser(newFriend.userId, {
                                'friends': FieldValue.arrayUnion([
                                  {
                                    "user": _userService.getReference(user.userId),
                                    "requester": user.userId,
                                    "confirmed": false,
                                  }
                                ]),
                              });
                              Navigator.pop(context);
                              const snackBar = SnackBar(content: Text('Friend request send'));
                              ScaffoldMessenger.of(context).showSnackBar(snackBar);
                              _newFriendFieldController.clear();
                            },
                            child: const Icon(Icons.person_search_rounded,
                                color: Colors.white),
                          ),
                          border: const OutlineInputBorder(),
                          hintText: 'john@doe.com',
                          labelText: "Add a friend",
                        ),
                      ),
                    );
                  }
                  var friend = friends[index - 1];
                  return Dismissible(
                    key: UniqueKey(),
                    direction: DismissDirection.endToStart,
                    background: Container(
                      padding: const EdgeInsets.only(right: 20.0),
                      color: Colors.red,
                      child: const Align(
                        alignment: Alignment.centerRight,
                        child: Text('Delete',
                            textAlign: TextAlign.right,
                            style: TextStyle(color: Colors.white)),
                      ),
                    ),
                    onDismissed: (direction) async {
                      await FirebaseFirestore.instance
                          .collection("users")
                          .doc(user.userId)
                          .update({
                        'friends': FieldValue.arrayRemove([
                          {
                            "user": FirebaseFirestore.instance
                                .collection("users")
                                .doc(friend.user.userId),
                            "confirmed": true,
                          }
                        ]),
                      });
                      await FirebaseFirestore.instance
                          .collection("users")
                          .doc(
                        friend.user.userId,
                      )
                          .update({
                        'friends': FieldValue.arrayRemove([
                          {
                            "user": FirebaseFirestore.instance
                                .collection("users")
                                .doc(user.userId),
                            "confirmed": true,
                          }
                        ]),
                      });
                    },
                    child: ListTile(
                      title: Text(friend.user.name),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}
