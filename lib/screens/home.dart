
import 'package:dartapp/screens/games.dart';
import 'package:dartapp/screens/new_game.dart';
import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => HomeState();
}

class HomeState extends State<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Padding(
                padding: EdgeInsets.all(20),
                child: ElevatedButton(
                  child: Text('New Game'),
                  style: ElevatedButton.styleFrom(
                      padding:
                          EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                      textStyle:
                          TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) {
                        return NewGameScreen();
                      }),
                    );
                  },
                ),
              ),
              Padding(
                padding: EdgeInsets.all(20),
                child: ElevatedButton(
                  child: Text('Played games'),
                  style: ElevatedButton.styleFrom(
                      padding:
                          EdgeInsets.symmetric(horizontal: 25, vertical: 15),
                      textStyle:
                          TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) {
                        return GamesScreen();
                      }),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
