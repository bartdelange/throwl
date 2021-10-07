import 'dart:async';
import 'dart:math' as math;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_slidable/flutter_slidable.dart';
import 'package:intl/intl.dart';

import '/components/scrollable_list_view.dart';
import '/services/auth_service.dart';
import '/services/game_service.dart';
import '/services/service_locator.dart';
import '/services/user_service.dart';
import 'game_detail.dart';
import 'play_game.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({Key? key}) : super(key: key);

  @override
  State<GamesScreen> createState() => GamesState();
}

class GamesState extends State<GamesScreen>
    with SingleTickerProviderStateMixin {
  final _authService = locator<AuthService>();
  final _userService = locator<UserService>();
  final _gameService = locator<GameService>();
  var _gamesCollectionSnapshots = FirebaseFirestore.instance
      .collection('games')
      .where('players',
          arrayContains: locator<UserService>()
              .getReference(locator<AuthService>().currentUser!.userId))
      .orderBy('started', descending: true)
      .snapshots();

  void refresh() async {
    _gamesCollectionSnapshots = FirebaseFirestore.instance
        .collection('games')
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
        child: Stack(
          children: [
            Center(
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

                            if (snapshot.data == null ||
                                snapshot.data!.docs.isEmpty) {
                              return Text(
                                'No played games',
                                style: TextStyle(
                                  fontSize: 24.sp,
                                  color: Colors.white,
                                ),
                              );
                            }

                            return RefreshIndicator(
                              child: ScrollableListView(
                                children: snapshot.data!.docs.map((document) {
                                  Map<String, dynamic> data =
                                      document.data()! as Map<String, dynamic>;

                                  return Slidable(
                                    actionPane:
                                        const SlidableBehindActionPane(),
                                    actionExtentRatio: 0.25,
                                    key: Key(document.id),
                                    secondaryActions: <Widget>[
                                      IconSlideAction(
                                        caption: "DELETE",
                                        icon: Icons.delete,
                                        color: const Color(0xfff20500),
                                        onTap: () async => await _gameService
                                            .deleteGame(document.id),
                                      ),
                                    ],
                                    dismissal: SlidableDismissal(
                                      child: const SlidableDrawerDismissal(),
                                      onDismissed: (actionType) async {
                                        await _gameService
                                            .deleteGame(document.id);
                                      },
                                    ),
                                    child: InkWell(
                                      onTap: () async {
                                        var game = await _gameService
                                            .parseGame(document);
                                        if (game.finished == null) {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                                builder: (context) {
                                              return PlayGameScreen(
                                                game: game,
                                                currentUserId:
                                                    game.turns.isNotEmpty
                                                        ? game.turns.last.userId
                                                        : null,
                                              );
                                            }),
                                          );
                                        } else {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                                builder: (context) {
                                              return GameDetailScreen(
                                                  game: game);
                                            }),
                                          );
                                        }
                                      },
                                      child: Container(
                                        decoration: BoxDecoration(
                                            color:
                                                Theme.of(context).primaryColor),
                                        child: Padding(
                                          padding: EdgeInsets.symmetric(
                                            vertical: 20.h,
                                          ),
                                          child: ListTile(
                                            leading: Padding(
                                              padding:
                                                  EdgeInsets.only(right: 50.w),
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
                                    ),
                                  );
                                }).toList(),
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
            Padding(
              padding: EdgeInsets.only(left: 15.h),
              child: const BackButton(color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
