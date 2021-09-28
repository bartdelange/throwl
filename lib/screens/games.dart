import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:dartapp/models/user.dart' as user_model;
import 'package:dartapp/screens/game_detail.dart';
import 'package:dartapp/screens/play_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/user_service.dart';
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
  final _userService = locator<UserService>();
  var _gamesCollectionSnapshots = FirebaseFirestore.instance
      .collection('games')
      .where('players',
          arrayContains: locator<UserService>().getReference(locator<AuthService>().currentUser!.userId))
      .orderBy('started', descending: true)
      .snapshots();

  void refresh() async {
    _gamesCollectionSnapshots = _gamesCollection
        .where('players',
            arrayContains: _userService.getReference(_authService.currentUser!.userId))
        .orderBy('started', descending: true)
        .snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Container(
            width: MediaQuery.of(context).size.width * 0.75,
            height: MediaQuery.of(context).size.width * 0.95,
            // constraints: BoxConstraints(minWidth: math.min(800, MediaQuery.of(context).size.width)),
            child: DefaultTextStyle(
              style: const TextStyle(color: Colors.white),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(bottom: 30),
                    child: Text(
                      "PLAYED GAMES",
                      style:
                          TextStyle(fontSize: 48, fontWeight: FontWeight.w900),
                    ),
                  ),

                  const Padding(
                    padding: EdgeInsets.only(bottom: 30),
                    child: Divider(height: 3, thickness: 2, color: Colors.white)
                  ),
                  Expanded(
                    child: StreamBuilder(
                      stream: _gamesCollectionSnapshots,
                      builder:
                          (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                        if (snapshot.hasError) {
                          return const Text(
                            'Something went wrong',
                            style: TextStyle(fontSize: 24, color: Colors.white),
                          );
                        }
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Text("Loading",
                                  style: TextStyle(
                                      fontSize: 24, color: Colors.white)),
                              Padding(
                                padding: EdgeInsets.all(20),
                                child: CircularProgressIndicator(),
                              ),
                            ],
                          );
                        }

                        if (snapshot.data == null) {
                          return const Text(
                            'No data',
                            style: TextStyle(
                              fontSize: 24,
                              color: Colors.white,
                            ),
                          );
                        }

                        return RefreshIndicator(
                          child: ListView.builder(
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
                                child: InkWell(
                                  onTap: () async {
                                    var game = await _getGame(data, document);
                                    if (game.finished == null) {
                                      var game = await _getGame(data, document);
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (context) {
                                          return PlayGameScreen(game: game);
                                        }),
                                      );
                                    } else {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (context) {
                                          return GameDetailScreen(game: game);
                                        }),
                                      );
                                    }
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 40),
                                    child: ListTile(
                                      leading: Padding(
                                        padding:
                                            const EdgeInsets.only(right: 50),
                                        child: data['finished'] == null
                                            ? const Icon(Icons.pause,
                                                size: 50, color: Colors.white)
                                            : const Icon(Icons.done,
                                                size: 50, color: Colors.white),
                                      ),
                                      title: Text(
                                        data['finished'] == null
                                            ? 'Unfinished game'
                                            : 'Finished game',
                                        style: const TextStyle(
                                          fontSize: 32,
                                          color: Colors.white,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                      subtitle: Text(
                                        'Started at ${DateFormat('dd-MM-yyyy – HH:mm').format((data['started'] as Timestamp).toDate())}',
                                        style: const TextStyle(
                                          fontSize: 18,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                          onRefresh: () {
                            return Future.delayed(
                              const Duration(seconds: 1),
                              () {
                                refresh();
                              },
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
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
