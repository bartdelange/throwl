import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:dartapp/models/user.dart' as userModel;
import 'package:dartapp/screens/game_detail.dart';
import 'package:dartapp/screens/play_game.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({Key? key}) : super(key: key);

  @override
  State<GamesScreen> createState() => GamesState();
}

class GamesState extends State<GamesScreen> {
  final _gamesCollection = FirebaseFirestore.instance.collection('games');
  StreamController<List<DocumentSnapshot>> _streamController =
      StreamController<List<DocumentSnapshot>>();
  List<DocumentSnapshot> _games = [];

  @override
  void initState() {
    // TODO: implement initState
    _gamesCollection
        .snapshots()
        .listen((data) => onChangeData(data.docChanges));
    populate();
    super.initState();
  }

  @override
  void dispose() {
    _streamController.close();
    super.dispose();
  }

  void populate() async {
    QuerySnapshot querySnapshot =
        await FirebaseFirestore.instance.collection('games').orderBy('started', descending: true).get();

    int oldSize = _games.length;
    _games.addAll(querySnapshot.docs);
    int newSize = _games.length;
    if (oldSize != newSize) {
      _streamController.add(_games);
    }
  }

  void onChangeData(List<DocumentChange> documentChanges) {
    var isChange = false;
    documentChanges.forEach((gameChange) {
      if (gameChange.type == DocumentChangeType.removed) {
        _games.removeWhere((game) {
          return gameChange.doc.id == game.id;
        });
        isChange = true;
      } else {
        if (gameChange.type == DocumentChangeType.modified) {
          int indexWhere = _games.indexWhere((game) {
            return gameChange.doc.id == game.id;
          });

          if (indexWhere >= 0) {
            _games[indexWhere] = gameChange.doc;
          }
          isChange = true;
        }
      }
    });

    if (isChange) {
      _streamController.add(_games);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            child: Padding(
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
            decoration: new BoxDecoration(color: Colors.white),
          ),
          Divider(height: 3),
          Expanded(
            child: StreamBuilder<List<DocumentSnapshot>>(
              stream: _streamController.stream,
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Text('Something went wrong',
                      style: TextStyle(fontSize: 24));
                }

                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Loading", style: TextStyle(fontSize: 24)),
                      Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(),
                      ),
                    ],
                  );
                }

                if (snapshot.data == null) {
                  return Text('No data',
                      style: TextStyle(fontSize: 24));
                }

                return ListView.separated(
                  separatorBuilder: (context, index) =>
                      Divider(height: 2, thickness: 2, color: Colors.black12),
                  padding: EdgeInsets.zero,
                  itemCount: snapshot.data!.length,
                  itemBuilder: (context, index) {
                    var document = snapshot.data![index];
                    Map<String, dynamic> data =
                        document.data()! as Map<String, dynamic>;

                    return Dismissible(
                      key: UniqueKey(),
                      direction: DismissDirection.endToStart,
                      background: new Container(
                        padding: EdgeInsets.only(right: 20.0),
                        color: Colors.red,
                        child: new Align(
                          alignment: Alignment.centerRight,
                          child: new Text('Delete',
                              textAlign: TextAlign.right,
                              style: new TextStyle(color: Colors.white)),
                        ),
                      ),
                      onDismissed: (direction) {
                        FirebaseFirestore.instance
                            .collection("games")
                            .doc(document.id)
                            .delete()
                            .then((_) {
                          setState(() {
                            _games.removeWhere(
                                (element) => element.id == document.id);
                          });
                        });
                      },
                      child: Container(
                        child: ListTile(
                          leading: data['finished'] == null ? Icon(Icons.pause) : Icon(Icons.done),
                          onTap: () async {
                            var game = await _getGame(data, document);

                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (context) {
                                return GameDetailScreen(
                                    game: game);
                              }),
                            );
                          },
                          trailing: data['finished'] == null
                              ? ElevatedButton(
                                  child: Icon(Icons.play_arrow_rounded),
                                  onPressed: () async {
                                    if (data['finished'] != null) {
                                      return;
                                    }

                                    var game = await _getGame(data, document);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (context) {
                                        return PlayGameScreen(
                                            game: game);
                                      }),
                                    );
                                  },
                                )
                              : null,
                          title: Text(data['finished'] == null
                              ? 'Unfinished game'
                              : 'Finished game'),
                          subtitle: Text(
                              'Started on: ${DateFormat('dd-MM-yyyy – hh:mm').format((data['started'] as Timestamp).toDate())}'),
                          // subtitle: Text(document.id.toString()),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  _getGame(Map<String, dynamic> data, DocumentSnapshot<Object?> document) async {
    var id = document.id;
    List<userModel.User> players =
    await Future.wait(data['players']
        .map<Future<userModel.User>>(
            (reference) async {
          var user = await reference.get();
          return userModel.User(
              reference.id, user['name']);
        }).toList());
    var turns = data['turns']
        .map<Turn>(
          (turn) => Turn.initAll(
          turn['userId'].id,
          turn['throws']
              .map<DartThrow>(
                (dartThrow) => DartThrow(
                DartboardScoreType
                    .values
                    .firstWhere((e) =>
                e.toShortString() ==
                    dartThrow[
                    'type']),
                dartThrow['score']),
          )
              .toList(),
          turn['isValid']),
    )
        .toList();
    var started = null;
    if (data['finished'] != null)
      started =
          (data['started'] as Timestamp).toDate();
    var finished = null;
    if (data['finished'] != null)
      finished =
          (data['finished'] as Timestamp)
              .toDate();

    return Game.initAll(id, players,
        turns, started, finished);
  }
}
