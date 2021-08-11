import 'dart:math';

import 'package:confetti/confetti.dart';
import 'package:touchable/touchable.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';


import 'DartboardPainter.dart';
import 'DartboardPart.dart';

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
  bool _isTurn = false;
  int _dartsThrown = 0;

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

  void onClickHandler(DartboardScoreType type, int score) {
    if (!_isTurn) return;
    setState(() {
      int newScore = _score;
      switch (type) {
        case DartboardScoreType.bull:
          newScore -= score;
          break;
        case DartboardScoreType.triple:
          newScore -= score * 3;
          break;
        case DartboardScoreType.double:
          newScore -= score * 2;
          break;
        case DartboardScoreType.single:
          newScore -= score;
          break;
      }

      _dartsThrown++;
      if (_dartsThrown == 3) {
        _dartsThrown = 0;
        _isTurn = false;
      }

      // Check for invalid score
      // -> Can't finish below 0 and not at 1
      // -> must finish on a double or bullseye
      if ((newScore != 0 && newScore <= 1) ||
          (newScore == 0 &&
              (type != DartboardScoreType.double ||
                  (type == DartboardScoreType.bull && score == 25)))) {
        // Out
        _isTurn = false;
        _dartsThrown = 0;
        return;
        // Message
      }

      if (newScore == 0) {
        _isTurn = false;
        _dartsThrown = 0;
        _controllerCenter.play();
      }

      _score = newScore;
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
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Column(children: [
        AspectRatio(
          aspectRatio: 1,
          child: Container(
            width: double.infinity,
            child: CanvasTouchDetector(
              builder: (context) => CustomPaint(
                painter: DartboardPainter(context, onClickHandler),
              ),
            ),
          ),
        ),
        Text("Current score: ${_score}${_isTurn ? ", Darts left: ${3 - _dartsThrown}" : ""}"),
        Center(
            child: ButtonBar(children: [
          ElevatedButton(
              child: Text("Reset score"),
              onPressed: () => {
                    setState(() {
                      _score = 501;
                    })
                  }),
          ElevatedButton(
              child: Text("My turn"),
              onPressed: () => {
                    setState(() {
                      _isTurn = true;
                    })
                  })
        ])),
        Align(
          alignment: Alignment.center,
          child: ConfettiWidget(
            confettiController: _controllerCenter,
            blastDirectionality: BlastDirectionality
                .explosive, // don't specify a direction, blast randomly
            shouldLoop:
            true, // start again as soon as the animation is finished
            colors: const [
              Colors.green,
              Colors.blue,
              Colors.pink,
              Colors.orange,
              Colors.purple
            ], // manually specify the colors to be used
            createParticlePath: drawStar, // define a custom shape/path.
          ),
        ),
      ]),
    );
  }
}
