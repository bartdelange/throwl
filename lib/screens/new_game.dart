import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/user.dart' as userModel;
import 'package:dartapp/screens/play_game.dart';
import 'package:flutter/material.dart';

class NewGameScreen extends StatefulWidget {
  const NewGameScreen({Key? key}) : super(key: key);

  @override
  State<NewGameScreen> createState() => NewGameState();
}

class NewGameState extends State<NewGameScreen> {
  final Stream<QuerySnapshot> _usersStream =
      FirebaseFirestore.instance.collection('users').snapshots();
  CollectionReference _gamesCollection =
      FirebaseFirestore.instance.collection('games');

  List<userModel.User> shuffle(List<userModel.User> items, Random random) {
    for (var i = items.length - 1; i > 0; i--) {
      var n = random.nextInt(i + 1);

      var temp = items[i];
      items[i] = items[n];
      items[n] = temp;
    }

    return items;
  }

  List<userModel.User> _selectedUsers = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.all(10),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Container(
                    width: double.infinity,
                    child: StreamBuilder<QuerySnapshot>(
                      stream: _usersStream,
                      builder: (BuildContext context,
                          AsyncSnapshot<QuerySnapshot> snapshot) {
                        if (snapshot.hasError) {
                          return Text('Something went wrong');
                        }

                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return Text("Loading");
                        }

                        if (snapshot.data == null) {
                          return Text('No data');
                        }

                        return ListView(
                          children: snapshot.data!.docs
                              .map((DocumentSnapshot document) {
                            Map<String, dynamic> data =
                                document.data()! as Map<String, dynamic>;
                            return CheckboxListTile(
                          title: Text(data['name']),
                              value: _selectedUsers
                                  .any((user) => user.userId == document.id),
                              onChanged: (bool? value) {
                                setState(() {
                                  if (value!) {
                                    _selectedUsers.add(userModel.User(
                                        document.id, data['name']));
                                  } else {
                                    _selectedUsers.removeWhere(
                                        (user) => user.userId == document.id);
                                  }
                                });
                              },
                              // subtitle: Text(document.id.toString()),
                            );
                          }).toList(),
                        );
                      },
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(20),
                  child: ElevatedButton(
                    child: Text('Start Game'),
                    style: ElevatedButton.styleFrom(
                        padding:
                            EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                        textStyle: TextStyle(
                            fontSize: 24, fontWeight: FontWeight.bold)),
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
                          gameDocument.id, shuffle(_selectedUsers, Random()));

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
