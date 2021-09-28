import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/user.dart' as user_models;
import 'package:dartapp/screens/play_game.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:flutter/material.dart';
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

  List<user_models.User> shuffle(List<user_models.User> items, Random random) {
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
      body: ValueListenableBuilder(
          valueListenable: _authService.currentUserNotifier,
          builder: (BuildContext context, user_models.User? user, Widget? child) {
            if (user == null) return Container();
            return Center(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: SizedBox(
                    width: MediaQuery.of(context).size.width * .8,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(bottom: 25, top: 125),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              "THE PLAYERS",
                              style: TextStyle(
                            color: Colors.white,
                            fontSize: 55,
                            fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                  const Padding(
                          padding: EdgeInsets.only(bottom: 75),
                          child: Divider(
                            thickness: 3,
                            color: Colors.white,
                          ),
                        ),
                        Expanded(
                          child: ListView(
                            children: _authService.currentUser!.friends.isEmpty
                                ? [
                                    const ListTile(
                                      title: Text(
                                        "You don't have any friends yet",
                                        style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 32,
                                            fontWeight: FontWeight.w900),
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
                                      padding: const EdgeInsets.symmetric(
                                          vertical: 25),
                                      child: Row(
                                        children: <Widget>[
                                          Expanded(
                                              child: Text(friend.name,
                                                  style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 32,
                                                      fontWeight:
                                                          FontWeight.w900))),
                                          Transform.scale(
                                            scale: 1.25,
                                            child: Padding(
                                              padding: const EdgeInsets.only(
                                                  right: 5),
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
                                                      color: Colors.white),
                                                  tristate: false,
                                                  // checkColor:
                                                  //     Theme.of(context).primaryColor,
                                                  activeColor: Theme.of(context)
                                                      .primaryColor,
                                                  value: _selectedUsers.any(
                                                      (selectedUser) =>
                                                          selectedUser.userId ==
                                                          friend.userId),
                                                  onChanged: (bool? value) {
                                                    setState(() {
                                                      if (value!) {
                                                        _selectedUsers
                                                            .add(friend);
                                                      } else {
                                                        _selectedUsers.removeWhere(
                                                            (selectedUser) =>
                                                                selectedUser
                                                                    .userId ==
                                                                friend.userId);
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
                                padding: const EdgeInsets.only(
                                    top: 20, right: 20, bottom: 100, left: 20),
                                child: GestureDetector(
                                  child: Hero(
                                    tag: 'logo',
                                    child: SizedBox(
                                      width: 150,
                                      height: 150,
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
                                          .map((user) => _userService.getReference(user.userId))
                                          .toList(),
                                      'started': DateTime.now(),
                                      'turns': []
                                    });
                                    var game = Game(
                                      gameDocument.id,
                                      shuffle(_selectedUsers, Random()),
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
