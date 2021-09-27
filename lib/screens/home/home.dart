import 'package:badges/badges.dart';
import 'package:dartapp/models/user.dart' as models;
import 'package:dartapp/screens/games.dart';
import 'package:dartapp/screens/home/friendrequests_dialog.dart';
import 'package:dartapp/screens/home/friends_dialog.dart';
import 'package:dartapp/screens/login.dart';
import 'package:dartapp/screens/new_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

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
        });
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
              builder:
                  (BuildContext context, models.User? user, Widget? child) {
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
        child: SingleChildScrollView(
          child: DefaultTextStyle(
            style: const TextStyle(color: Colors.white),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(25, 25, 25, 75),
                  child: ValueListenableBuilder(
                      valueListenable: _authService.currentUserNotifier,
                      builder: (BuildContext context, models.User? user,
                          Widget? child) {
                        if (user == null) return Container();
                        return Text(
                          'Hi ${user.name}',
                          style: const TextStyle(
                            fontSize: 72,
                            fontWeight: FontWeight.w200,
                          ),
                        );
                      }),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: TextButton.icon(
                        icon: const Padding(
                          padding: EdgeInsets.only(right: 20),
                          child: Icon(
                            Icons.add,
                            color: Colors.white,
                            size: 48,
                          ),
                        ),
                        label: const Text(
                          "NEW GAME",
                          style: TextStyle(
                            fontSize: 48,
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
                      padding: const EdgeInsets.all(20),
                      child: TextButton.icon(
                        icon: const Padding(
                          padding: EdgeInsets.only(right: 20),
                          child: Icon(
                            Icons.history,
                            color: Colors.white,
                            size: 48,
                          ),
                        ),
                        label: const Text(
                          "PLAYED GAMES",
                          style: TextStyle(
                            fontSize: 48,
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
                Padding(
                  padding: const EdgeInsets.only(top: 125),
                  child: Hero(
                    tag: 'logo',
                    child: SvgPicture.asset(
                      dartboardIcon,
                      height: 350,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
