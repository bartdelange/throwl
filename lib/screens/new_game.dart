import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '/components/scrollable_list_view.dart';
import '/models/user.dart' as user_models;
import '/services/auth_service.dart';
import '/services/game_service.dart';
import '/services/service_locator.dart';
import 'play_game.dart';

class NewGameScreen extends StatefulWidget {
  const NewGameScreen({Key? key}) : super(key: key);

  @override
  State<NewGameScreen> createState() => NewGameState();
}

class NewGameState extends State<NewGameScreen>
    with SingleTickerProviderStateMixin {
  final _authService = locator<AuthService>();
  final _gameService = locator<GameService>();
  final String dartboardIcon = 'assets/dartboard_white.svg';

  List<user_models.User> shuffle(
      List<user_models.User> items, math.Random random) {
    for (var i = items.length - 1; i > 0; i--) {
      var n = random.nextInt(i + 1);

      var temp = items[i];
      items[i] = items[n];
      items[n] = temp;
    }

    return items;
  }

  final List<user_models.User> _selectedUsers = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            ValueListenableBuilder(
                valueListenable: _authService.currentUserNotifier,
                builder: (BuildContext context, user_models.User? user,
                    Widget? child) {
                  if (user == null) return Container();
                  var users = [
                    user,
                    ...user.friends
                        .where((friend) => friend.confirmed)
                        .map<user_models.User>((friend) => friend.user)
                        .toList(),
                  ];
                  return Center(
                    child: SafeArea(
                      child: Padding(
                        padding: EdgeInsets.all(10.r),
                        child: SizedBox(
                          width: .8.sw,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Padding(
                                padding:
                                    EdgeInsets.only(bottom: 25.h, top: 125.h),
                                child: Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    "THE PLAYERS",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: math.max(55.sp, 24),
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ),
                              ),
                              Padding(
                                padding: EdgeInsets.only(bottom: 75.h),
                                child: Divider(
                                  thickness: 3.h,
                                  color: Colors.white,
                                ),
                              ),
                              Expanded(
                                child: ScrollableListView(
                                  children: user.friends.isEmpty
                                      ? [
                                          ListTile(
                                            title: Text(
                                              "You don't have any friends yet",
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 32.sp,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                        ]
                                      : users.map(_buildFriendItem).toList(),
                                ),
                              ),
                              user.friends.isEmpty
                                  ? Container()
                                  : Padding(
                                      padding: EdgeInsets.only(
                                        top: 20.h,
                                        right: 20.w,
                                        bottom: 100.h,
                                        left: 20.w,
                                      ),
                                      child: GestureDetector(
                                        child: Hero(
                                          tag: 'logo',
                                          child: SizedBox(
                                            width: math.max(150.w, 100),
                                            height: math.max(150.w, 100),
                                            child: SvgPicture.asset(
                                              dartboardIcon,
                                            ),
                                          ),
                                        ),
                                        onTap: () async {
                                          if (_selectedUsers.isEmpty) {
                                            return;
                                          }
                                          var game =
                                              await _gameService.createGame(
                                            shuffle(
                                              _selectedUsers,
                                              math.Random(),
                                            ),
                                          );

                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                                builder: (context) {
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
                }),
            Padding(
              padding: EdgeInsets.only(left: 15.h),
              child: const BackButton(color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFriendItem(user_models.User friend) {
    return GestureDetector(
      onTap: () {
        setState(() {
          if (!_selectedUsers.any(
            (selectedUser) => selectedUser.userId == friend.userId,
          )) {
            _selectedUsers.add(friend);
          } else {
            _selectedUsers.removeWhere(
              (selectedUser) => selectedUser.userId == friend.userId,
            );
          }
        });
      },
      child: Padding(
        padding: EdgeInsets.symmetric(
          vertical: 25.h,
        ),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Text(
                friend.name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: math.max(32.sp, 18),
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            Transform.scale(
              scale: math.max(1.25.r, .75),
              child: Padding(
                padding: EdgeInsets.only(
                  right: 5.w,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    // shape: const CircleBorder(),
                    side: const BorderSide(
                      width: 0,
                      color: Colors.white,
                    ),
                    tristate: false,
                    // checkColor:
                    //     Theme.of(context).primaryColor,
                    activeColor: Theme.of(context).primaryColor,
                    value: _selectedUsers.any(
                      (selectedUser) => selectedUser.userId == friend.userId,
                    ),
                    onChanged: (bool? value) {
                      setState(() {
                        if (value!) {
                          _selectedUsers.add(friend);
                        } else {
                          _selectedUsers.removeWhere(
                            (selectedUser) =>
                                selectedUser.userId == friend.userId,
                          );
                        }
                      });
                    },
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
