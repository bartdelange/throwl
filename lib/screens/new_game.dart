import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/user.dart' as user_model;
import 'package:dartapp/screens/play_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:flutter/material.dart';

class NewGameScreen extends StatefulWidget {
  const NewGameScreen({Key? key}) : super(key: key);

  @override
  State<NewGameScreen> createState() => NewGameState();
}

class NewGameState extends State<NewGameScreen> {
  final CollectionReference _gamesCollection =
      FirebaseFirestore.instance.collection('games');
  final _authService = locator<AuthService>();

  List<user_model.User> shuffle(List<user_model.User> items, Random random) {
    for (var i = items.length - 1; i > 0; i--) {
      var n = random.nextInt(i + 1);

      var temp = items[i];
      items[i] = items[n];
      items[n] = temp;
    }

    return items;
  }

  final List<user_model.User> _selectedUsers = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: SizedBox(
                    width: double.infinity,
                    child: ListView(
                      children: _authService.currentUser!.friends.isEmpty
                          ? [
                              const ListTile(
                                  title: Text('No friends added yet'))
                            ]
                          : [
                              _authService.currentUser!,
                              ..._authService.currentUser!.friends
                                  .where((friend) => friend.confirmed)
                                  .map<user_model.User>((friend) => friend.user)
                                  .toList()
                            ].map((user_model.User friend) {
                              return CheckboxListTile(
                                title: Text(friend.name),
                                value: _selectedUsers.any((selectedUser) =>
                                    selectedUser.userId == friend.userId),
                                onChanged: (bool? value) {
                                  setState(() {
                                    if (value!) {
                                      _selectedUsers.add(friend);
                                    } else {
                                      _selectedUsers.removeWhere(
                                          (selectedUser) =>
                                              selectedUser.userId ==
                                              friend.userId);
                                    }
                                  });
                                },
                                // subtitle: Text(document.id.toString()),
                              );
                            }).toList(),
                    ),
                  ),
                ),
                _authService.currentUser!.friends.isEmpty
                    ? Container()
                    : Padding(
                        padding: const EdgeInsets.all(20),
                        child: ElevatedButton(
                          child: const Text('Start Game'),
                          style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 25, vertical: 15),
                              textStyle: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              )),
                          onPressed: () async {
                            var gameDocument = await _gamesCollection.add({
                              'players': _selectedUsers
                                  .map((user) => FirebaseFirestore.instance
                                      .collection('users')
                                      .doc(user.userId))
                                  .toList(),
                              'started': DateTime.now(),
                              'turns': []
                            });
                            var game = Game(
                              gameDocument.id,
                              shuffle(_selectedUsers, Random()),
                            );

                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) {
                                return PlayGameScreen(game: game);
                              }),
                            );
                          },
                        ),
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
