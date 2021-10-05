import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import '/models/turn.dart';
import '/models/user.dart';
import '/models/dart_throw.dart';

import '../models/game.dart';
import 'service_locator.dart';
import 'user_service.dart';

class GameService {
  final CollectionReference _games =
      FirebaseFirestore.instance.collection('games');
  final _userService = locator<UserService>();

  StreamSubscription<QuerySnapshot<Object?>> get userChangeSubscription =>
      _games.snapshots().listen((event) {});

  Future<Game> parseGame(DocumentSnapshot<Object?> gameDoc) async {
    var id = gameDoc.id;
    Map<String, dynamic> data =
    gameDoc.data()! as Map<String, dynamic>;
    List<User> players = await Future.wait(
        data['players'].map<Future<User>>((reference) async {
          var user = await reference.get();
          return User(reference.id, user['name'], user['email']);
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

  DocumentReference getReference(String uid) {
    return _games.doc(uid);
  }

  Future<Game> getById(String uid) async {
    var gameDoc = await _games.doc(uid).get();
    return parseGame(gameDoc);
  }

  Future<Game> createGame(players) async {
    var gameDoc = await _games.add({
      "players": players
          .map((user) => _userService.getReference(user.userId))
          .toList(),
      "started": DateTime.now(),
      "turns": [],
    });

    return await getById(gameDoc.id);
  }

  Future<Game> updateGame(String uid, Map<String, Object?> set) async {
    await _games
        .doc(uid)
        .update(set);
    return await getById(uid);
  }

  Future<void> deleteGame(uid) async {
    await getReference(uid).delete();
  }
}
