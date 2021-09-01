import 'dart:io';
import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:confetti/confetti.dart';
import 'package:dartapp/helpers/dartboard/dartboard_painter.dart';
import 'package:dartapp/helpers/turn_helper.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:measured_size/measured_size.dart';
import 'package:touchable/touchable.dart';

class PlayGameScreen extends StatefulWidget {
  const PlayGameScreen({Key? key, required this.game}) : super(key: key);
  final Game game;

  @override
  State<PlayGameScreen> createState() => PlayGameState();
}

class PlayGameState extends State<PlayGameScreen> {
  final CollectionReference games =
      FirebaseFirestore.instance.collection('games');
  final CollectionReference users =
      FirebaseFirestore.instance.collection('users');
  final FlutterTts _flutterTts = FlutterTts();

  final ScrollController _scrollController = ScrollController();
  final GlobalKey _scoreListKey = GlobalKey();
  late double _scoreItemHeight;

  late ConfettiController _controllerCenter;
  String _currentUserId = "";
  late Turn _currentTurn;
  bool _locked = false;

  Offset _touchOffset = Offset(0, 0);

  @override
  void initState() {
    _currentUserId = widget.game.players.first.userId;
    _currentTurn = Turn(widget.game.players
        .firstWhere((user) => user.userId == _currentUserId)
        .userId);
    _controllerCenter =
        ConfettiController(duration: const Duration(seconds: 10));
    _flutterTts.setLanguage('en');
    _flutterTts.setSpeechRate(0.45);
    if (Platform.isAndroid) {
      _flutterTts.setQueueMode(1);
    }
    super.initState();
  }

  @override
  void dispose() {
    _controllerCenter.dispose();
    super.dispose();
  }

  void speak(String text) async {
    _flutterTts.speak(text);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      Scaffold(
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _GetDartboard(),
              _GetCurrentTurnScore(),
              _GetScoreTable()
            ],
          ),
        ),
      ),
      _GetConfettiWidget(),
    ]);
  }

  int _calculateScore(List<Turn> turns) {
    return turns.fold<int>(0, (previousValue, currentTurn) {
      int turnScore = 0;
      if (!currentTurn.isValid) return previousValue;
      currentTurn.throws.forEach((currentThrow) {
        turnScore += ScoreHelper.calculateScore(currentThrow);
      });

      return previousValue + turnScore;
    });
  }

  double _calculateAverage(String userId, [bool skipInvalid = false]) {
    int score = 0;
    int turns = 1;
    if (widget.game.turns.any((turn) => turn.userId == userId)) {
      var turnsList = widget.game.turns.where((turn) =>
          turn.userId == userId && (skipInvalid ? turn.isValid : true));
      score = _calculateScore(turnsList.toList());
      turns = turnsList.length;
    }
    return score / turns;
  }

  void onClickHandler(DartboardScoreType type, int score, Offset position) async {
    if (_locked) return;
    DartThrow currentThrow = DartThrow(type, score);
    _touchOffset = position;

    setState(() {
      _currentTurn.addThrow(currentThrow);
    });

    int turnScore = 0;
    _currentTurn.throws.forEach((element) {
      turnScore += ScoreHelper.calculateScore(element);
    });
    int currentUserScore = _calculateScore(widget.game.turns
        .where((user) => user.userId == _currentUserId)
        .toList());

    setState(() {
      _currentTurn.isValid = ScoreHelper.isValidThrow(
          501 - currentUserScore - turnScore, currentThrow);
    });

    if (!_currentTurn.isValid) {
      return _finishTurn();
    }

    if (501 - currentUserScore - turnScore == 0) {
      return _finishGame();
    }

    if (_currentTurn.throws.length == 3) {
      return _finishTurn();
    }
  }

  _finishGame() async {
    _controllerCenter.play();
    widget.game.turns.add(_currentTurn);
    _currentTurn = Turn(_currentUserId);
    _persist(finish: true);
    speak(
        "${widget.game.players.firstWhere((user) => user.userId == _currentUserId).name} has won!");

    switch (await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return SimpleDialog(
          title: Text(
              "${widget.game.players.firstWhere((user) => user.userId == _currentUserId).name} has won"),
          children: <Widget>[
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, true),
              child: Text("Finish game"),
            ),
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, false),
              child: Text("Look at the score"),
            ),
          ],
        );
      },
    )) {
      case true:
        return Navigator.pop(context);
      case false:
        _locked = true;
        break;
    }
  }

  _finishTurn() {
    int turnScore = 0;
    _currentTurn.throws.forEach((element) {
      turnScore += ScoreHelper.calculateScore(element);
    });
    if (turnScore == 69) {
      speak("sheeeeesh");
    } else if (!_currentTurn.isValid) {
      speak("No score");
    } else {
      speak("${turnScore}");
    }
    setState(() {
      // Save state
      widget.game.turns.add(_currentTurn);
      _persist();

      // prepare next moves
      int currentUserIndex = 1 +
          widget.game.players.indexWhere(
            (user) => user.userId == _currentUserId,
          );
      if (currentUserIndex == widget.game.players.length) {
        currentUserIndex = 0;
      }
      _currentUserId = widget.game.players[currentUserIndex].userId;
      _currentTurn = Turn(widget.game.players
          .firstWhere((user) => user.userId == _currentUserId)
          .userId);

      _scrollScore();

      int scoreLeft = 501 -
          _calculateScore(widget.game.turns
              .where((user) => user.userId == _currentUserId)
              .toList());
      if (scoreLeft <= 170) {
        speak("You need ${scoreLeft}");
      }
    });
  }

  _scrollScore() {
    var scrollIndex = widget.game.players.indexWhere(
          (element) => element.userId == _currentUserId,
        ) +
        1;
    var scrollableItems = widget.game.players.length;

    var listKeyContext = _scoreListKey.currentContext;
    if (listKeyContext != null) {
      var listBox = listKeyContext.findRenderObject() as RenderBox;
      final bottomPadding = MediaQuery.of(context).padding.bottom;
      double scrollPos = max(
          0,
          ((scrollIndex - 1) * _scoreItemHeight) +
              (_scoreItemHeight / 2) -
              (listBox.size.height / 2));
      double maxScrollPos = (_scoreItemHeight * scrollableItems) -
          listBox.size.height +
          bottomPadding;
      if (scrollPos > maxScrollPos) {
        scrollPos = maxScrollPos;
      }
      _scrollController.animateTo(scrollPos,
          duration: Duration(seconds: 2), curve: Curves.fastOutSlowIn);
    }
  }

  _persist({bool finish = false}) {
    games.doc(widget.game.gameId).update({
      'finished': finish ? DateTime.now() : null,
      'turns': widget.game.turns
          .map<Map<String, dynamic>>((turn) => {
                'throws': turn.throws
                    .map<Map<String, dynamic>>((currentThrow) => {
                          'type': currentThrow.type.toShortString(),
                          'score': currentThrow.score,
                        })
            .toList(),
        'isValid': turn.isValid,
        'userId': users.doc(turn.userId)
      })
          .toList()
    });
  }

  Path _drawStar(Size size) {
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

  _GetDartboard() {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Theme.of(context).hintColor, width: 3),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: AspectRatio(
          aspectRatio: 1,
          child: Container(
            width: double.infinity,
            child: Stack(children: [
              CanvasTouchDetector(
                builder: (context) => CustomPaint(
                  painter: DartboardPainter(context, onClickHandler),
                  child: Container(),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  _GetCurrentTurnScore() {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.only(top: 5),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Text(
                        '1st: ${_currentTurn.throws.length > 0 ? "${_currentTurn.throws[0].type.toShortString()} ${_currentTurn.throws[0].score} (${ScoreHelper.calculateScore(_currentTurn.throws[0])})" : 0}',
                        style: TextStyle(
                            decoration: _currentTurn.throws.length == 0
                                ? TextDecoration.underline
                                : TextDecoration.none,
                            fontWeight: _currentTurn.throws.length == 0
                                ? FontWeight.bold
                                : FontWeight.normal,
                            fontSize: 32)),
                    Text(
                        '2nd: ${_currentTurn.throws.length > 1 ? "${_currentTurn.throws[1].type.toShortString()} ${_currentTurn.throws[1].score} (${ScoreHelper.calculateScore(_currentTurn.throws[1])})" : 0}',
                        style: TextStyle(
                            decoration: _currentTurn.throws.length == 1
                                ? TextDecoration.underline
                                : TextDecoration.none,
                            fontWeight: _currentTurn.throws.length == 1
                                ? FontWeight.bold
                                : FontWeight.normal,
                            fontSize: 32)),
                    Text(
                        '3rd: ${_currentTurn.throws.length > 2 ? "${_currentTurn.throws[2].type.toShortString()} ${_currentTurn.throws[2].score} (${ScoreHelper.calculateScore(_currentTurn.throws[2])})" : 0}',
                        style: TextStyle(
                            decoration: _currentTurn.throws.length == 2
                                ? TextDecoration.underline
                                : TextDecoration.none,
                            fontWeight: _currentTurn.throws.length == 2
                                ? FontWeight.bold
                                : FontWeight.normal,
                            fontSize: 32)),
                  ],
                ),
              ),
              _GetButtonBar(),
            ],
          ),
        ),
        Divider(
          thickness: 3,
          color: Colors.black54,
        ),
      ],
    );
  }

  _GetScoreTable() {
    return Expanded(
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.only(left: 16, right: 16),
            child: Row(
              children: [
                Expanded(
                  flex: 5,
                  child: Padding(
                    padding: EdgeInsets.all(5),
                    child: Text(
                      "Name",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 24,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(5),
                      child: Text(
                        "Last",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(5),
                      child: Text(
                        "Avg",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(5),
                      child: Text(
                        "Valid Avg",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  flex: 1,
                  child: Center(
                    child: Padding(
                      padding: EdgeInsets.all(5),
                      child: Text(
                        "Score",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Divider(
            thickness: 3,
            color: Colors.black54,
          ),
          Expanded(
            key: _scoreListKey,
            child: SingleChildScrollView(
              controller: _scrollController,
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: EdgeInsets.only(left: 16, right: 16),
                  child: Column(
                    children: [
                      ...widget.game.players.map(
                        (user) => MeasuredSize(
                          onChange: (Size size) {
                            setState(() {
                              _scoreItemHeight = size.height;
                            });
                          },
                          child: Row(
                            children: [
                              Expanded(
                                flex: 5,
                                child: Padding(
                                  padding: EdgeInsets.all(5),
                                  child: Text(
                                    user.name,
                                    style: TextStyle(
                                      fontWeight: user.userId == _currentUserId
                                          ? FontWeight.bold
                                          : FontWeight.normal,
                                      fontSize: 24,
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 1,
                                child: Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(2),
                                    child: Text(
                                      _calculateScore(widget.game.turns.any(
                                                  (turn) =>
                                                      turn.userId ==
                                                      user.userId)
                                              ? [
                                                  widget.game.turns.lastWhere(
                                                      (turn) =>
                                                          turn.userId ==
                                                          user.userId)
                                                ]
                                              : [])
                                          .toString(),
                                      style: TextStyle(
                                        fontWeight:
                                            user.userId == _currentUserId
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                        fontSize: 24,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 1,
                                child: Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(2),
                                    child: Text(
                                      ((_calculateAverage(user.userId) * 100)
                                                  .round() /
                                              100)
                                          .toString(),
                                      style: TextStyle(
                                        fontWeight:
                                            user.userId == _currentUserId
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                        fontSize: 24,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 2,
                                child: Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(2),
                                    child: Text(
                                      ((_calculateAverage(user.userId, true) *
                                                      100)
                                                  .round() /
                                              100)
                                          .toString(),
                                      style: TextStyle(
                                        fontWeight:
                                            user.userId == _currentUserId
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                        fontSize: 24,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 1,
                                child: Center(
                                  child: Padding(
                                    padding: EdgeInsets.all(2),
                                    child: Text(
                                      (501 -
                                              _calculateScore(widget.game.turns
                                                      .any((turn) =>
                                                          turn.userId ==
                                                          user.userId)
                                                  ? widget.game.turns
                                                      .where((turn) =>
                                                          turn.userId ==
                                                          user.userId)
                                                      .toList()
                                                  : []) -
                                              (user.userId == _currentUserId
                                                  ? _calculateScore(
                                                      [_currentTurn])
                                                  : 0))
                                          .toString(),
                                      style: TextStyle(
                                        fontWeight:
                                            user.userId == _currentUserId
                                                ? FontWeight.bold
                                                : FontWeight.normal,
                                        fontSize: 24,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  _GetButtonBar() {
    return ButtonBar(
      children: [
        ElevatedButton(
          child: Text("Undo"),
          style: ElevatedButton.styleFrom(
              padding: EdgeInsets.symmetric(horizontal: 25, vertical: 15),
              textStyle: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          onPressed: () => {
            setState(() {
              if (_currentTurn.throws.length == 0) {
                if (widget.game.turns.length != 0) {
                  Turn lastTurn = widget.game.turns.removeLast();
                  _currentUserId = lastTurn.userId;
                  _currentTurn = lastTurn;
                }
              }
              if (_currentTurn.throws.length > 0) {
                _currentTurn.throws.removeLast();
              }
              // Save state
              _persist();
              _scrollScore();

              // Stop animation if undo
              _controllerCenter.stop();
            })
          },
        ),
      ],
    );
  }

  _GetConfettiWidget() {
    return Positioned(
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
        createParticlePath: _drawStar, // define a custom shape/path.
      ),
    );
  }
}
