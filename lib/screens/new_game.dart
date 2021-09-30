import 'dart:math' as math;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/user.dart' as user_models;
import 'package:dartapp/screens/play_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

class NewGameScreen extends StatefulWidget {
  const NewGameScreen({Key? key}) : super(key: key);

  @override
  State<NewGameScreen> createState() => NewGameState();
}

class NewGameState extends State<NewGameScreen> {
  final CollectionReference _gamesCollection =
      FirebaseFirestore.instance.collection('games');
  final _authService = locator<AuthService>();
  final _userService = locator<UserService>();
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
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ValueListenableBuilder(
          valueListenable: _authService.currentUserNotifier,
          builder:
              (BuildContext context, user_models.User? user, Widget? child) {
            if (user == null) return Container();
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
                          padding: EdgeInsets.only(bottom: 25.h, top: 125.h),
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
                          child: ListView(
                            children: _authService.currentUser!.friends.isEmpty
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
                                : [
                                    _authService.currentUser!,
                                    ..._authService.currentUser!.friends
                                        .where((friend) => friend.confirmed)
                                        .map<user_models.User>(
                                            (friend) => friend.user)
                                        .toList()
                                  ].map((user_models.User friend) {
                                    return Padding(
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
                                                  borderRadius:
                                                      BorderRadius.circular(3),
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
                                                  activeColor: Theme.of(context)
                                                      .primaryColor,
                                                  value: _selectedUsers.any(
                                                    (selectedUser) =>
                                                        selectedUser.userId ==
                                                        friend.userId,
                                                  ),
                                                  onChanged: (bool? value) {
                                                    setState(() {
                                                      if (value!) {
                                                        _selectedUsers
                                                            .add(friend);
                                                      } else {
                                                        _selectedUsers
                                                            .removeWhere(
                                                          (selectedUser) =>
                                                              selectedUser
                                                                  .userId ==
                                                              friend.userId,
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
                                    );
                                  }).toList(),
                          ),
                        ),
                        _authService.currentUser!.friends.isEmpty
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
                                    var gameDocument =
                                        await _gamesCollection.add({
                                      'players': _selectedUsers
                                          .map((user) => _userService
                                              .getReference(user.userId))
                                          .toList(),
                                      'started': DateTime.now(),
                                      'turns': []
                                    });
                                    var game = Game(
                                      gameDocument.id,
                                      shuffle(_selectedUsers, math.Random()),
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
          }),
    );
  }
}
