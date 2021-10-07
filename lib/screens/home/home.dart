import 'dart:math' as math;

import 'package:badges/badges.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '/models/user.dart' as user_models;
import '/screens/games.dart';
import '/screens/login.dart';
import '/screens/new_game.dart';
import '/services/auth_service.dart';
import '/services/service_locator.dart';
import 'friendrequests_dialog.dart';
import 'friends_dialog.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => HomeState();
}

class HomeState extends State<HomeScreen> {
  final _authService = locator<AuthService>();
  bool userAddFailed = false;
  final String dartboardIcon = 'assets/dartboard_white.svg';

  void _showMessage(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text("Error"),
          content: Text(message),
          actions: [
            TextButton(
              child: const Text("Ok"),
              onPressed: () {
                Navigator.of(context).pop();
              },
            )
          ],
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
  }

  void _showFriendsList() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return const FriendsListDialog();
      },
    );
  }

  void _showFriendRequestsList() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return const FriendsRequestDialog();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        actions: [
          ValueListenableBuilder(
              valueListenable: _authService.currentUserNotifier,
              builder: (BuildContext context, user_models.User? user,
                  Widget? child) {
                var friendRequests = 0;
                if (user != null) {
                  friendRequests = user.friends
                      .where((friend) =>
                          !friend.confirmed && friend.requester != user.userId)
                      .length;
                }
                return IconButton(
                    icon: friendRequests > 0
                        ? Badge(
                            badgeContent: Text(friendRequests.toString()),
                            child: const Icon(Icons.notifications),
                          )
                        : const Icon(Icons.notifications),
                    tooltip: 'Friend requests',
                    onPressed: () {
                      _showFriendRequestsList();
                    });
              }),
          IconButton(
            icon: const Icon(Icons.people_alt_rounded),
            tooltip: 'Friends',
            onPressed: () async {
              _showFriendsList();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Sign Out',
            onPressed: () async {
              try {
                await _authService.signOut();
                Navigator.pushAndRemoveUntil(context,
                    MaterialPageRoute(builder: (context) {
                  return const LoginScreen();
                }), (route) => false);
              } catch (e) {
                if (e is FirebaseAuthException) {
                  _showMessage(e.message!);
                }
              }
            },
          ),
        ],
      ),
      body: Center(
        heightFactor: 1,
        child: DefaultTextStyle(
          style: const TextStyle(color: Colors.white),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding: EdgeInsets.only(top: 125.r, bottom: .05.sh),
                child: Hero(
                  tag: 'logo',
                  child: SvgPicture.asset(
                    dartboardIcon,
                    height: 200.h,
                  ),
                ),
              ),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Padding(
                      padding: EdgeInsets.fromLTRB(25.w, 25.h, 25.w, 75.h),
                      child: ValueListenableBuilder(
                          valueListenable: _authService.currentUserNotifier,
                          builder: (BuildContext context,
                              user_models.User? user, Widget? child) {
                            if (user == null) return Container();
                            return Text(
                              'Hi ${user.name}',
                              style: TextStyle(
                                fontSize: 72.sp,
                                fontWeight: FontWeight.w200,
                              ),
                            );
                          }),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: EdgeInsets.all(20.r),
                          child: TextButton.icon(
                            icon: Padding(
                              padding:
                                  EdgeInsets.only(right: 20.w, bottom: 12.h),
                              child: Icon(
                                Icons.add,
                                color: Colors.white,
                                size: math.max(48.r, 24),
                              ),
                            ),
                            label: Text(
                              "NEW GAME",
                              style: TextStyle(
                                fontSize: math.max(48.sp, 24),
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            onPressed: () async {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) {
                                  return const NewGameScreen();
                                }),
                              );
                            },
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.all(20.r),
                          child: TextButton.icon(
                            icon: Padding(
                              padding:
                                  EdgeInsets.only(right: 20.w, bottom: 12.h),
                              child: Icon(
                                Icons.history,
                                color: Colors.white,
                                size: math.max(48.r, 24),
                              ),
                            ),
                            label: Text(
                              "PLAYED GAMES",
                              style: TextStyle(
                                fontSize: math.max(48.sp, 24),
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            onPressed: () async {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) {
                                  return const GamesScreen();
                                }),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
