import 'dart:async';
import 'dart:math' as math;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:dartapp/models/user.dart' as user_model;
import 'package:dartapp/screens/game_detail.dart';
import 'package:dartapp/screens/play_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
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
          arrayContains: locator<UserService>()
              .getReference(locator<AuthService>().currentUser!.userId))
      .orderBy('started', descending: true)
      .snapshots();

  void refresh() async {
    _gamesCollectionSnapshots = _gamesCollection
        .where('players',
            arrayContains:
                _userService.getReference(_authService.currentUser!.userId))
        .orderBy('started', descending: true)
        .snapshots();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SizedBox(
            width: .75.sw,
            height: .8.sh,
            child: DefaultTextStyle(
              style: const TextStyle(color: Colors.white),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Padding(
                    padding: EdgeInsets.only(bottom: 30.h),
                    child: Text(
                      "PLAYED GAMES",
                      style: TextStyle(
                        fontSize: 48.sp,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.only(bottom: 30.h),
                    child: Divider(
                      height: 3.h,
                      thickness: 2.h,
                      color: Colors.white,
                    ),
                  ),
                  Expanded(
                    child: StreamBuilder(
                      stream: _gamesCollectionSnapshots,
                      builder:
                          (context, AsyncSnapshot<QuerySnapshot> snapshot) {
                        if (snapshot.hasError) {
                          return Text(
                            'Something went wrong',
                            style: TextStyle(
                              fontSize: 24.sp,
                              color: Colors.white,
                            ),
                          );
                        }
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Loading",
                                style: TextStyle(
                                  fontSize: 24.sp,
                                  color: Colors.white,
                                ),
                              ),
                              Padding(
                                padding: EdgeInsets.all(20.r),
                                child: const CircularProgressIndicator(),
                              ),
                            ],
                          );
                        }

                        if (snapshot.data == null) {
                          return Text(
                            'No data',
                            style: TextStyle(
                              fontSize: 24.sp,
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
                                  padding: EdgeInsets.only(right: 20.w),
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
                                    padding: EdgeInsets.symmetric(
                                      vertical: 40.h,
                                    ),
                                    child: ListTile(
                                      leading: Padding(
                                        padding: EdgeInsets.only(right: 50.w),
                                        child: data['finished'] == null
                                            ? Icon(
                                                Icons.pause,
                                                size: math.max(50.r, 25),
                                                color: Colors.white,
                                              )
                                            : Icon(
                                                Icons.done,
                                                size: math.max(50.r, 25),
                                                color: Colors.white,
                                              ),
                                      ),
                                      title: Text(
                                        data['finished'] == null
                                            ? 'Unfinished game'
                                            : 'Finished game',
                                        style: TextStyle(
                                          fontSize: math.max(32.sp, 24),
                                          color: Colors.white,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                      subtitle: Text(
                                        'Started at ${DateFormat('dd-MM-yyyy – HH:mm').format((data['started'] as Timestamp).toDate())}',
                                        style: TextStyle(
                                          fontSize: math.max(18.sp, 14),
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

  Future<Game> _getGame(
    Map<String, dynamic> data,
    DocumentSnapshot<Object?> document,
  ) async {
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
