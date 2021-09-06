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
        .toList();
    Map<DartboardScoreTuple, double> heatMap = Map();
    throws.forEach((thrw) {
      var tuple = DartboardScoreTuple(thrw.type, thrw.score);
      if (heatMap.containsKey(tuple)) {
        heatMap[tuple] = heatMap[tuple]! + 1 / throws.length;
      } else {
        heatMap[tuple] = 1 / throws.length;
      }
    });

    return Scaffold(
      body: Column(
        children: [
          _GetDartboard(context, heatMap),
          SafeArea(
            top: false,
            child: Column(
              children: [
                ...widget.game.players.map(
                  (user) => ListTile(
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
