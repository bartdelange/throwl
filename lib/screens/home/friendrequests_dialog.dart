import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/user.dart' as models;
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class FriendsRequestDialog extends StatefulWidget {
  const FriendsRequestDialog({Key? key}) : super(key: key);

  @override
  State<FriendsRequestDialog> createState() => FriendsRequestDialogState();
}

class FriendsRequestDialogState extends State<FriendsRequestDialog> {
  final _authService = locator<AuthService>();
  final _userService = locator<UserService>();

  @override
  void initState() {
    super.initState();
  }

  Future deleteRequest(String selfId, String friendId) async {
    await _userService.updateUser(selfId, {
      'friends': FieldValue.arrayRemove([
        {
          "user": _userService.getReference(friendId),
          "requester": friendId,
          "confirmed": false,
        }
      ]),
    });
    await _userService.updateUser(friendId, {
      'friends': FieldValue.arrayRemove([
        {
          "user": _userService.getReference(selfId),
          "requester": friendId,
          "confirmed": false,
        }
      ]),
    });
  }

  Future confirmRequest(String selfId, String friendId) async {
    await _userService.updateUser(selfId, {
      'friends': FieldValue.arrayUnion([
        {
          "user": _userService.getReference(friendId),
          "confirmed": true,
        }
      ]),
    });

    // Friend
    await _userService.updateUser(friendId, {
      'friends': FieldValue.arrayUnion([
        {
          "user": _userService.getReference(selfId),
          "confirmed": true,
        }
      ]),
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      contentPadding: const EdgeInsets.only(top: 25),
      title: const Text('Friend requests'),
      content: ClipRect(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 25),
          child: SizedBox(
            width: 300,
            child: ValueListenableBuilder(
              valueListenable: _authService.currentUserNotifier,
              builder:
                  (BuildContext context, models.User? user, Widget? child) {
                if (user == null) {
                  return const Padding(
                    padding: EdgeInsets.only(bottom: 20),
                    child: Text("No pending friend requests"),
                  );
                }

                var requests = user.friends
                    .where((friend) =>
                        !friend.confirmed && friend.requester != user.userId)
                    .toList();
                return requests.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.only(bottom: 20),
                        child: Text("No pending friend requests"),
                      )
                    : ListView.separated(
                        separatorBuilder: (context, index) {
                          return const Divider(
                            height: 2,
                            thickness: 2,
                            color: Colors.black12,
                          );
                        },
                        shrinkWrap: true,
                        itemCount: requests.length,
                        itemBuilder: (context, index) {
                          var friend = requests[index];
                          return ListTile(
                            contentPadding: const EdgeInsets.only(left: 12),
                            title: Text(friend.user.name),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.check_rounded),
                                  onPressed: () async {
                                    await confirmRequest(
                                        user.userId, friend.user.userId);
                                    await deleteRequest(
                                        user.userId, friend.user.userId);
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close_rounded),
                                  onPressed: () async {
                                    await deleteRequest(
                                        user.userId, friend.user.userId);
                                  },
                                ),
                              ],
                            ),
                          );
                        },
                      );
              },
            ),
          ),
        ),
      ),
    );
  }
}
