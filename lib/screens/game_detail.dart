import 'package:dartapp/helpers/dartboard/dartboard_painter.dart';
import 'package:dartapp/models/game.dart';
import 'package:flutter/material.dart';

class GameDetailScreen extends StatefulWidget {
  const GameDetailScreen({Key? key, required this.game}) : super(key: key);
  final Game game;

  @override
  State<GameDetailScreen> createState() => GameDetailState();
}

class GameDetailState extends State<GameDetailScreen> {
  String _selectedUserId = '';

  @override
  void initState() {
    // TODO: implement initState
    // 'PdwKGEVUiUW9pz2sSDiC'
    _selectedUserId = widget.game.players[0].userId;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    var throws = widget.game.turns
        .where((turn) => turn.userId == _selectedUserId)
        .expand((element) => element.throws)
        .where((element) => element.score != 0)
        .toList();
    Map<DartboardScoreTuple, num> throwCountMap = Map();
    throws.forEach((thrw) {
      var tuple = DartboardScoreTuple(thrw.type, thrw.score);
      if (throwCountMap.containsKey(tuple)) {
        throwCountMap[tuple] = throwCountMap[tuple]! + 1;
      } else {
        throwCountMap[tuple] = 1;
      }
    });

    var throwCount = throwCountMap.entries.toList();
    throwCount.sort((a, b) => a.value.compareTo(b.value));
    var min = throwCount.first.value;
    var max = throwCount.last.value;

    Map<DartboardScoreTuple, double> heatMap = Map();
    throwCount.forEach((element) {
      heatMap[element.key] = (element.value - min) / (max - min);
    });

    return Scaffold(
      body: Column(
        children: [
          _GetDartboard(context, heatMap),
          Expanded(
            child: SingleChildScrollView(
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    ...widget.game.players.map(
                      (user) => ListTile(
                        selected: _selectedUserId == user.userId,
                        onTap: () {
                          setState(() {
                            _selectedUserId = user.userId;
                          });
                        },
                        title: Text(user.name),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  _GetDartboard(
      BuildContext context, Map<DartboardScoreTuple, double>? heatMap) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Color.fromARGB(25, 0, 0, 0),
        border: Border(
          bottom: BorderSide(color: Theme.of(context).hintColor, width: 3),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: Container(
            height: 500,
            child: AspectRatio(
              aspectRatio: 1,
              child: CustomPaint(
                painter: DartboardPainter(context, null, heatMap, false),
                child: Container(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
