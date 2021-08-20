import 'dart:developer' as developer;
import 'dart:math';

import 'package:dartapp/models/game.dart';
import 'package:flutter/material.dart';
import 'package:dartapp/models/user.dart' as userModel;
import 'package:dartapp/screens/game.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => HomeState();
}

class HomeState extends State<HomeScreen> {
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
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 500,
                height: 500,
                child: StreamBuilder<QuerySnapshot>(
                  stream: _usersStream,
                  builder: (BuildContext context,
                      AsyncSnapshot<QuerySnapshot> snapshot) {
                    if (snapshot.hasError) {
                      return Text('Something went wrong');
                    }

                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return Text("Loading");
                    }

                    if (snapshot.data == null) {
                      return Text('Something went wrong');
                    }

                    return ListView(
                      children:
                          snapshot.data!.docs.map((DocumentSnapshot document) {
                        Map<String, dynamic> data =
                            document.data()! as Map<String, dynamic>;
                        return CheckboxListTile(
                          title: Text(data['name']),
                          value: _selectedUsers
                              .any((user) => user.userId == document.id),
                          onChanged: (bool? value) {
                            setState(() {
                              if (value!) {
                                _selectedUsers.add(
                                    userModel.User(document.id, data['name']));
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
              ElevatedButton(
                child: Text('Start Game'),
                style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                    textStyle:
                        TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                onPressed: () async {
                  var gameDocument = await _gamesCollection.add({
                    'players': _selectedUsers.map((user) => FirebaseFirestore.instance.collection('users').doc(user.userId)).toList(),
                    'started': DateTime.now(),
                    'turns': []
                  });
                  var game = Game(gameDocument.id, shuffle(_selectedUsers, Random()));

                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) {
                      return GameScreen(game: game);
                    }),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
