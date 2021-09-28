import 'dart:io';
import 'dart:math' as math;
import 'dart:ui';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:confetti/confetti.dart';
import 'package:dartapp/helpers/dartboard/dartboard_painter.dart';
import 'package:dartapp/helpers/turn_helper.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:dartapp/screens/game_detail.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/painting.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:measured_size/measured_size.dart';
import 'package:touchable/touchable.dart';
import 'package:wakelock/wakelock.dart';

class PlayGameScreen extends StatefulWidget {
  const PlayGameScreen({Key? key, required this.game}) : super(key: key);
  final Game game;

  @override
  State<PlayGameScreen> createState() => PlayGameState();
}

class PlayGameState extends State<PlayGameScreen> {
  final CollectionReference games =
      FirebaseFirestore.instance.collection('games');
  final FlutterTts _flutterTts = FlutterTts();
  final crownIcon = "assets/crown.svg";
  final _userService = locator<UserService>();

  final ScrollController _scrollController = ScrollController();
  final GlobalKey _scoreListKey = GlobalKey();
  late double _scoreItemHeight;

  late ConfettiController _controllerCenter;
  String _currentUserId = "";
  late Turn _currentTurn;
  bool _locked = false;

  Offset _touchOffset = const Offset(0, 0);

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
    Wakelock.enable();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: []);
    super.initState();
  }

  @override
  void dispose() {
    _controllerCenter.dispose();
    Wakelock.disable();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual,
        overlays: SystemUiOverlay.values);
    super.dispose();
  }

  void speak(String text) async {
    _flutterTts.speak(text);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          appBar: MediaQuery.of(context).orientation == Orientation.landscape
              ? null
              : AppBar(
                  toolbarHeight: 10,
                  elevation: 0,
                  backgroundColor: const Color.fromARGB(255, 225, 225, 225),
                  systemOverlayStyle: SystemUiOverlayStyle.dark, // 1
                ),
          body: DefaultTextStyle(
            style: const TextStyle(color: Colors.white),
            child: _layoutHelper(),
          ),
        ),
        _getConfettiWidget(),
      ],
    );
  }

  int _calculateScore(List<Turn> turns) {
    return turns.fold<int>(0, (previousValue, currentTurn) {
      int turnScore = 0;
      if (!currentTurn.isValid) return previousValue;
      for (var currentThrow in currentTurn.throws) {
        turnScore += ScoreHelper.calculateScore(currentThrow);
      }

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
    for (var element in _currentTurn.throws) {
      turnScore += ScoreHelper.calculateScore(element);
    }
    int currentUserScore = _calculateScore(widget.game.turns
        .where((user) => user.userId == _currentUserId)
        .toList());

    setState(() {
      _currentTurn.isValid = ScoreHelper.isValidThrow(
          501 - currentUserScore - turnScore, currentThrow);
    });

    if (!_currentTurn.isValid) {
      _finishTurn();
    } else if (501 - currentUserScore - turnScore == 0) {
      _finishGame();
    } else if (_currentTurn.throws.length == 3) {
      _finishTurn();
    }
  }

  _finishTurn() {
    int turnScore = 0;
    for (var element in _currentTurn.throws) {
      turnScore += ScoreHelper.calculateScore(element);
    }
    if (turnScore == 69) {
      speak("sheeeeesh");
    } else if (!_currentTurn.isValid) {
      speak("No score");
    } else {
      speak("$turnScore");
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
        speak("${widget.game.players[currentUserIndex].name.split(' ')[0]} you need $scoreLeft");
      }
    });
  }

  _finishGame() async {
    setState(() {
      _locked = true;
      _controllerCenter.play();
      widget.game.turns.add(_currentTurn);
      _currentTurn = Turn(_currentUserId);
    });

    _persist(finish: true);
    speak(
        "${widget.game.players.firstWhere((user) => user.userId == _currentUserId).name} has won!");

    switch (await showDialog<int>(
        context: context,
        builder: (BuildContext context) {
          return Dialog(
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(
                Radius.circular(20.0),
              ),
            ),
            child: IntrinsicHeight(
              child: SizedBox(
                width: 350,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(bottom: 14, right: 16),
                                child: SvgPicture.asset(
                                  crownIcon,
                                  height: 55,
                                  width: 5,
                                  color: const Color(0xff008000),
                                ),
                              ),
                              const Text(
                                "WINNER",
                                style: TextStyle(
                                    fontSize: 55,
                                    color: Color(0xff008000),
                                    fontWeight: FontWeight.w900),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Text(
                            widget.game.players
                                .firstWhere(
                                    (user) => user.userId == _currentUserId)
                                .name,
                            style: TextStyle(
                                fontSize: 32,
                                color: Theme.of(context).primaryColor,
                                fontWeight: FontWeight.w900),
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            IconButton(
                              color: const Color(0xfff20500),
                              iconSize: 60,
                              icon: const Icon(Icons.exit_to_app_rounded),
                              onPressed: () => Navigator.pop(context, 1),
                            ),
                            IconButton(
                              color: Theme.of(context).primaryColor,
                              iconSize: 60,
                              icon: const Icon(Icons.trending_up_rounded),
                              onPressed: () => Navigator.pop(context, 2),
                            ),
                            IconButton(
                              color: Theme.of(context).primaryColor,
                              iconSize: 60,
                              icon: Transform(
                                alignment: Alignment.center,
                                transform: Matrix4.rotationZ(-math.pi / 4),
                                child: const Icon(Icons.replay_rounded),
                              ),
                              onPressed: () => Navigator.pop(context, 3),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        })) {
      case 1:
        Navigator.popUntil(
          context,
          (route) => route.isFirst,
        );
        break;
      case 2:
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) {
            return GameDetailScreen(game: widget.game);
          }),
          (route) => route.isFirst,
        );
        break;
      case 3:
        setState(() {
          _locked=false;
          if (_currentTurn.throws.isEmpty) {
            if (widget.game.turns.isNotEmpty) {
              Turn lastTurn = widget.game.turns.removeLast();
              _currentUserId = lastTurn.userId;
              _currentTurn = lastTurn;
            }
          }
          if (_currentTurn.throws.isNotEmpty) {
            _currentTurn.throws.removeLast();
          }
          // Save state
          _persist();
          _scrollScore();

          // Stop animation if undo
          _controllerCenter.stop();
        });
        break;
    }
  }

  Future<bool> _dropOut(String userId) async {
    bool returnVal = false;
    setState(() {
      if (widget.game.players.length != 2) {
        widget.game.turns.removeWhere((turn) => turn.userId == userId);
        widget.game.players.removeWhere((player) => player.userId == userId);
        _persist();
      }

      if (_currentUserId == userId) {
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

        // prepare next moves
        if (widget.game.players.length == 2) {
          _finishGame();
          returnVal = false;
          return;
        }

        int scoreLeft = 501 -
            _calculateScore(widget.game.turns
                .where((user) => user.userId == _currentUserId)
                .toList());
        if (scoreLeft <= 170) {
          speak(
              "${widget.game.players[currentUserIndex].name.split(
                  ' ')[0]} you need $scoreLeft");
        }
      }
      returnVal = true;
    });
    return returnVal;
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
      double scrollPos = math.max(
          0,
          ((scrollIndex - 1) * _scoreItemHeight) +
              (_scoreItemHeight / 2) -
              (listBox.size.height / 2));
      double maxScrollPos = (_scoreItemHeight * scrollableItems) -
          _scrollController.position.viewportDimension +
          bottomPadding;
      if (scrollPos > maxScrollPos) {
        scrollPos = maxScrollPos;
      }
      scrollPos = math.max(scrollPos, 0);
      if (_scrollController.position.pixels != scrollPos) {
        _scrollController.animateTo(scrollPos,
            duration: const Duration(seconds: 2), curve: Curves.fastOutSlowIn);
      }
    }
  }

  _persist({bool finish = false}) async {
    await games.doc(widget.game.gameId).update({
      'finished': finish ? DateTime.now() : null,
      'players': widget.game.players.map((player) => _userService.getReference(player.userId)).toList(),
      'turns': widget.game.turns
          .map<Map<String, dynamic>>((turn) =>
      {
        'throws': turn.throws
            .map<Map<String, dynamic>>((currentThrow) =>
        {
          'type': currentThrow.type.toShortString(),
          'score': currentThrow.score,
        })
            .toList(),
        'isValid': turn.isValid,
        'userId': _userService.getReference(turn.userId)
      })
          .toList()
    });
  }

  Path _drawStar(Size size) {
    double degToRad(double deg) => deg * (math.pi / 180.0);

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
      path.lineTo(halfWidth + externalRadius * math.cos(step),
          halfWidth + externalRadius * math.sin(step));
      path.lineTo(
          halfWidth + internalRadius * math.cos(step + halfDegreesPerStep),
          halfWidth + internalRadius * math.sin(step + halfDegreesPerStep));
    }
    path.close();
    return path;
  }

  Widget _layoutHelper() {
    Orientation orientation = MediaQuery.of(context).orientation;

    if (orientation == Orientation.portrait) {
      return Column(
        children: [
          _getDartboard(orientation),
          Expanded(
            child: Stack(
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Color.fromARGB(255, 225, 225, 225),
                  ),
                ),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(25),
                    ),
                  ),
                  child: Center(
                    child: SizedBox(
                      width: MediaQuery.of(context).size.width * .8,
                      child: Column(
                        children: [
                          _getCurrentTurnScore(orientation),
                          _getScoreTable()
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    } else {
      return Row(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: SizedBox(
                height: double.infinity, child: _getDartboard(orientation)),
          ),
          Expanded(
            child: Stack(
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Color.fromARGB(255, 225, 225, 225),
                  ),
                ),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(25),
                    ),
                  ),
                  child: Column(
                    children: [
                      _getCurrentTurnScore(orientation),
                      _getScoreTable(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }
  }

  Widget _getDartboard([Orientation orientation = Orientation.portrait]) {
    return Container(
      decoration: const BoxDecoration(
        color: Color.fromARGB(255, 225, 225, 225),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(
            32, orientation == Orientation.landscape ? 32 : 16, 32, 32),
        child: AspectRatio(
          aspectRatio: 1,
          child: SizedBox(
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

  Widget _renderThrowScore(
    bool active,
    String score,
    String position,
    String superscript,
  ) {
    return Padding(
      padding: const EdgeInsets.only(top: 15),
      child: Container(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              //                   <--- left side
              color: active ? Colors.white : Colors.transparent,
              width: 3.0,
            ),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(position),
            Text(
              superscript,
              style:
                  const TextStyle(fontFeatures: [FontFeature.superscripts()]),
            ),
            const Padding(padding: EdgeInsets.all(5)),
            Text(
              score,
              style: const TextStyle(
                  fontSize: 48,
                  height: 0.75,
                  fontWeight: FontWeight.w900,
                  textBaseline: TextBaseline.alphabetic),
            ),
          ],
        ),
      ),
    );
  }

  Widget _getCurrentTurnScore([
    Orientation orientation = Orientation.portrait,
  ]) {
    var children = [
      _renderThrowScore(
        _currentTurn.throws.isEmpty,
        _currentTurn.throws.isNotEmpty
            ? _currentTurn.throws[0].type == DartboardScoreType.out
                ? "Out"
                : "${_currentTurn.throws[0].type.toShortString()[0].toUpperCase()}${_currentTurn.throws[0].score}"
            : "-",
        '1',
        'st',
      ),
      _renderThrowScore(
        _currentTurn.throws.length == 1,
        _currentTurn.throws.length > 1
            ? _currentTurn.throws[1].type == DartboardScoreType.out
                ? "Out"
                : "${_currentTurn.throws[1].type.toShortString()[0].toUpperCase()}${_currentTurn.throws[1].score}"
            : "-",
        '2',
        'nd',
      ),
      _renderThrowScore(
        _currentTurn.throws.length == 2,
        _currentTurn.throws.length > 2
            ? _currentTurn.throws[1].type == DartboardScoreType.out
                ? "Out"
                : "${_currentTurn.throws[2].type.toShortString()[0].toUpperCase()}${_currentTurn.throws[2].score}"
            : "-",
        '3',
        'rd',
      ),
    ];
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.only(
              top: 5, left: orientation == Orientation.portrait ? 0 : 20),
          child: DefaultTextStyle(
            style: const TextStyle(fontSize: 24),
            child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: ((orientation == Orientation.portrait)
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: children,
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: children,
                          )),
                  ),
                  _getButtonBar()
                ]),
          ),
        ),
        const Divider(
          thickness: 1,
          height: 8,
          color: Colors.white54,
        ),
      ],
    );
  }

  Widget _getScoreTable() {
    return Expanded(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 16),
            child: Row(
              children: const [
                Expanded(
                  flex: 4,
                  child: Padding(
                    padding: EdgeInsets.all(5),
                    child: Text(
                      "Name",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
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
                          fontSize: 18,
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
                          fontSize: 18,
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
                          fontSize: 18,
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
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 10),
            child: Divider(
              height: 8,
              thickness: 1,
              color: Colors.white54,
            ),
          ),
          Expanded(
            key: _scoreListKey,
            child: SingleChildScrollView(
              controller: _scrollController,
              child: Padding(
                padding: const EdgeInsets.only(left: 16, right: 16),
                child: Column(
                  children: [
                    ...widget.game.players.map((user) {
                      return ClipRect(
                        child: MeasuredSize(
                          onChange: (Size size) {
                            setState(() {
                              _scoreItemHeight = size.height;
                            });
                          },
                          child: Dismissible(
                            key: UniqueKey(),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              padding: const EdgeInsets.only(right: 20.0),
                              color: Colors.red,
                              child: const Align(
                                alignment: Alignment.centerRight,
                                child: Text('Drop Out',
                                    textAlign: TextAlign.right,
                                    style: TextStyle(color: Colors.white)),
                              ),
                            ),
                            confirmDismiss: (direction) async {
                              switch (await showDialog<bool>(
                                context: context,
                                builder: (BuildContext context) {
                                  return SimpleDialog(
                                    title:
                                        const Text("Do you wish to drop out?"),
                                    children: <Widget>[
                                      SimpleDialogOption(
                                        onPressed: () =>
                                            Navigator.pop(context, true),
                                        child: const Text("Drop out"),
                                      ),
                                      SimpleDialogOption(
                                        onPressed: () =>
                                            Navigator.pop(context, false),
                                        child: const Text("Keep playing"),
                                      ),
                                    ],
                                  );
                                },
                              )) {
                                case true:
                                  return _dropOut(user.userId);
                                case false:
                                  return false;
                              }
                            },
                            onDismissed: (direction) {
                              _dropOut(user.userId);
                            },
                            child: Row(
                              children: [
                                Expanded(
                                  flex: 4,
                                  child: Padding(
                                    padding: const EdgeInsets.all(5),
                                    child: Text(
                                      user.name,
                                      style: TextStyle(
                                        decoration:
                                            user.userId == _currentUserId
                                                ? TextDecoration.underline
                                                : TextDecoration.none,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 18,
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 1,
                                  child: Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(2),
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
                                        style: const TextStyle(
                                          fontSize: 18,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 1,
                                  child: Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(2),
                                      child: Text(
                                        ((_calculateAverage(user.userId) * 100)
                                                    .round() /
                                                100)
                                            .toString(),
                                        style: const TextStyle(
                                          fontSize: 18,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 2,
                                  child: Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(2),
                                      child: Text(
                                        ((_calculateAverage(user.userId, true) *
                                                        100)
                                                    .round() /
                                                100)
                                            .toString(),
                                        style: const TextStyle(
                                          fontSize: 18,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 1,
                                  child: Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(2),
                                      child: Text(
                                        (501 -
                                                _calculateScore(widget
                                                        .game.turns
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
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 18,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _getButtonBar() {
    return ButtonBar(
      children: [
        IconButton(
          color: Colors.white,
          iconSize: 60,
          icon: Transform(
            alignment: Alignment.center,
            transform: Matrix4.rotationZ(-math.pi / 4),
            child: const Icon(Icons.replay_circle_filled),
          ),
          onPressed: () => {
            setState(() {
              _locked=false;

              if (_currentTurn.throws.isEmpty) {
                if (widget.game.turns.isNotEmpty) {
                  Turn lastTurn = widget.game.turns.removeLast();
                  _currentUserId = lastTurn.userId;
                  _currentTurn = lastTurn;
                }
              }
              if (_currentTurn.throws.isNotEmpty) {
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

  Widget _getConfettiWidget() {
    return Positioned(
      top: _touchOffset.dy - 15,
      left: _touchOffset.dx - 15,
      child: ConfettiWidget(
        numberOfParticles: 50,
        blastDirection: math.pi * 2,
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
