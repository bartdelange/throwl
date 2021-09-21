import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:dartapp/models/user.dart' as user_model;
import 'package:dartapp/screens/game_detail.dart';
import 'package:dartapp/screens/play_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({Key? key}) : super(key: key);

  @override
  State<GamesScreen> createState() => GamesState();
}

class GamesState extends State<GamesScreen> {
  final _gamesCollection = FirebaseFirestore.instance.collection('games');
  final _authService = locator<AuthService>();
  var _gamesCollectionSnapshots = FirebaseFirestore.instance
      .collection('games')
      .where('players',
          arrayContains: FirebaseFirestore.instance
              .collection('users')
              .doc(locator<AuthService>().currentUser!.userId))
      .orderBy('started', descending: true)
      .snapshots();

  void refresh() async {
    _gamesCollectionSnapshots = _gamesCollection
        .where('players',
            arrayContains: FirebaseFirestore.instance
                .collection('users')
                .doc(_authService.currentUser!.userId))
        .orderBy('started', descending: true)
        .snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            child: const Padding(
              padding: EdgeInsets.all(20),
              child: SafeArea(
                child: Center(
                  child: Text(
                    "Played Games",
                    style: TextStyle(fontSize: 24),
                  ),
                ),
              ),
            ),
            //you can change opacity with color here(I used black) for background.
            decoration: const BoxDecoration(color: Colors.white),
          ),
          const Divider(height: 3),
          Expanded(
            child: StreamBuilder(
              stream: _gamesCollectionSnapshots,
              builder: (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                if (snapshot.hasError) {
                  return const Text(
                    'Something went wrong',
                    style: TextStyle(fontSize: 24),
                  );
                }

                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Text("Loading", style: TextStyle(fontSize: 24)),
                      Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(),
                      ),
                    ],
                  );
                }

                if (snapshot.data == null) {
                  return const Text('No data', style: TextStyle(fontSize: 24));
                }

                return RefreshIndicator(
                  child: ListView.separated(
                    separatorBuilder: (context, index) {
                      return const Divider(
                          height: 2, thickness: 2, color: Colors.black12);
                    },
                    padding: EdgeInsets.zero,
                    itemCount: snapshot.data!.docs.length,
                    itemBuilder: (context, index) {
                      var document = snapshot.data!.docs[index];
                      Map<String, dynamic> data =
                          document.data()! as Map<String, dynamic>;

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
                        onDismissed: (direction) {
                          FirebaseFirestore.instance
                              .collection("games")
                              .doc(document.id)
                              .delete();
                        },
                        child: ListTile(
                          leading: data['finished'] == null
                              ? const Icon(Icons.pause)
                              : const Icon(Icons.done),
                          onTap: () async {
                            var game = await _getGame(data, document);
                            if (game.finished == null) return;

                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) {
                                return GameDetailScreen(game: game);
                              }),
                            );
                          },
                          trailing: data['finished'] == null
                              ? ElevatedButton(
                                  child: const Icon(Icons.play_arrow_rounded),
                                  onPressed: () async {
                                    if (data['finished'] != null) {
                                      return;
                                    }

                                    var game = await _getGame(data, document);

                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (context) {
                                        return PlayGameScreen(game: game);
                                      }),
                                    );
                                  },
                                )
                              : null,
                          title: Text(data['finished'] == null
                              ? 'Unfinished game'
                              : 'Finished game'),
                          subtitle: Text(
                              'Started on: ${DateFormat('dd-MM-yyyy – HH:mm').format((data['started'] as Timestamp).toDate())}'),
                          // subtitle: Text(document.id.toString()),
                        ),
                      );
                    },
                  ),
                  onRefresh: () {
                    return Future.delayed(const Duration(seconds: 1), () {
                      refresh();
                    });
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<Game> _getGame(Map<String, dynamic> data, DocumentSnapshot<Object?> document) async {
    var id = document.id;
    List<user_model.User> players = await Future.wait(
        data['players'].map<Future<user_model.User>>((reference) async {
      var user = await reference.get();
      return user_model.User(reference.id, user['name'], user['email']);
    }).toList());
    var turns = data['turns']
        .map<Turn>((turn) => Turn.initAll(
              turn['userId'].id,
              turn['throws']
                  .map<DartThrow>(
                    (dartThrow) => DartThrow(
                        DartboardScoreType.values.firstWhere(
                            (e) => e.toShortString() == dartThrow['type']),
                        dartThrow['score']),
                  )
                  .toList(),
              turn['isValid'],
            ))
        .toList();
    DateTime? started;
    if (data['finished'] != null) {
      started = (data['started'] as Timestamp).toDate();
    }
    DateTime? finished;
    if (data['finished'] != null) {
      finished = (data['finished'] as Timestamp).toDate();
    }

    return Game.initAll(id, players, turns, started, finished);
  }
}
