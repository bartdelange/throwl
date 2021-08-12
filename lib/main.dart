import 'dart:developer' as developer;
import 'dart:math';

import 'package:confetti/confetti.dart';
import 'package:dartapp/dartboard/models/turn.dart';
import 'package:dartapp/helpers/turn_helper.dart';
import 'package:touchable/touchable.dart';
import 'package:flutter/material.dart';

import 'dartboard/dartboard_painter.dart';
import 'dartboard/dartboard_part.dart';
import 'dartboard/models/dart_throw.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key, required this.title}) : super(key: key);

  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  late ConfettiController _controllerCenter;
  int _score = 501;
  Turn _currentTurn = Turn();
  List<Turn> _turns = [];
  bool _isTurn = false;
  Offset _touchOffset = Offset(0, 0);

  @override
  void initState() {
    _controllerCenter =
        ConfettiController(duration: const Duration(seconds: 10));
    super.initState();
  }

  @override
  void dispose() {
    _controllerCenter.dispose();
    super.dispose();
  }

  void onClickHandler(
      DartboardScoreType type, int score, TapDownDetails details) {
    if (!_isTurn) return;
    DartThrow currentThrow = DartThrow(type, score);
    _touchOffset = details.globalPosition;

    setState(() {
      _currentTurn.addThrow(currentThrow);
    });

    int turnScore = 0;
    _currentTurn.throws.forEach((element) {
      turnScore += ScoreHelper.calculateScore(element);
    });
    if (!ScoreHelper.isValidThrow(_score - turnScore, currentThrow)) {
      _finishTurn(false);
      return;
    }

    if (_score - turnScore == 0) {
      _controllerCenter.play();
      _finishTurn(true);
    }
    if (_currentTurn.throws.length == 3) {
      _finishTurn(true);
    }
  }

  _finishTurn(bool updateScore) {
    setState(() {
      _isTurn = false;
      _turns.add(_currentTurn);
      if (updateScore) {
        _currentTurn.throws.forEach(
            (dartThrow) => {_score -= ScoreHelper.calculateScore(dartThrow)});
      }
      _currentTurn = Turn();
    });
  }

  Path drawStar(Size size) {
    // Method to convert degree to radians
    double degToRad(double deg) => deg * (pi / 180.0);

    const numberOfPoints = 5;
    final halfWidth = size.width / 2;
    final externalRadius = halfWidth;
    final internalRadius = halfWidth / 2.5;
    final degreesPerStep = degToRad(360 / numberOfPoints);
    final halfDegreesPerStep = degreesPerStep / 2;
    final path = Path();
    final fullAngle = degToRad(360);
    path.moveTo(size.width, halfWidth);

    for (double step = 0; step < fullAngle; step += degreesPerStep) {
      path.lineTo(halfWidth + externalRadius * cos(step),
          halfWidth + externalRadius * sin(step));
      path.lineTo(halfWidth + internalRadius * cos(step + halfDegreesPerStep),
          halfWidth + internalRadius * sin(step + halfDegreesPerStep));
    }
    path.close();
    return path;
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Scaffold(
        appBar: AppBar(
          title: Text(widget.title),
        ),
        body: Column(children: [
          AspectRatio(
            aspectRatio: 1,
            child: Container(
              width: double.infinity,
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CanvasTouchDetector(
                  builder: (context) => CustomPaint(
                    painter: DartboardPainter(context, onClickHandler),
                    child: Container(),
                  ),
                ),
              ),
            ),
          ),
          Text("Current score: ${_score}"),
          Text((_isTurn
              ? "Your turn, Darts left: ${3 - _currentTurn.throws.length}, Turn score: ${_currentTurn.throws.fold<int>(0, (previousValue, element) => previousValue + ScoreHelper.calculateScore(element))}"
              : "Not your turn")),
          Text((_isTurn
              ? "Turn score: ${_currentTurn.throws.fold<int>(0, (previousValue, element) => previousValue + ScoreHelper.calculateScore(element))}"
              : "")),
          Text((_isTurn
              ? "New score: ${_score - _currentTurn.throws.fold<int>(0, (previousValue, element) => previousValue + ScoreHelper.calculateScore(element))}"
              : "")),
          Text("Turns: ${_turns.length}"),
          Center(
              child: ButtonBar(children: [
            ElevatedButton(
                child: Text("Reset"),
                onPressed: () => {
                      setState(() {
                        _isTurn = true;
                        _score = 501;
                        _turns = [];
                        _currentTurn = Turn();
                        _controllerCenter.stop();
                      })
                    }),
            ElevatedButton(
                child: Text("My turn"),
                onPressed: () => {
                      setState(() {
                        _isTurn = !_isTurn;
                      })
                    })
          ])),
        ]),
        // Positioned(
        //   right: 0.0,
        //   top: -100.0,
        //   child: ConfettiWidget(
        //     numberOfParticles: 1,
        //     emissionFrequency: 1,
        //     blastDirection: pi,
        //     confettiController: _controllerCenter,
        //     blastDirectionality: BlastDirectionality.directional,
        //     // don't specify a direction, blast randomly
        //     shouldLoop: true,
        //     // start again as soon as the animation is finished
        //     colors: const [
        //       Colors.green,
        //       Colors.blue,
        //       Colors.pink,
        //       Colors.orange,
        //       Colors.purple
        //     ],
        //     // manually specify the colors to be used
        //     createParticlePath: drawStar, // define a custom shape/path.
        //   ),
        // )
      ),
      Positioned(
        top: _touchOffset.dy - 15,
        left: _touchOffset.dx - 15,
        child: ConfettiWidget(
          numberOfParticles: 50,
          blastDirection: pi * 2,
          confettiController: _controllerCenter,
          blastDirectionality: BlastDirectionality.explosive,
          shouldLoop: true,
          colors: const [
            Colors.green,
            Colors.blue,
            Colors.pink,
            Colors.orange,
            Colors.purple
          ],
          // manually specify the colors to be used
          createParticlePath: drawStar, // define a custom shape/path.
        ),
      )
    ]);
  }
}
