import 'dart:math';

import 'package:dartapp/helpers/dartboard/dartboard_painter.dart';
import 'package:dartapp/helpers/turn_helper.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/painting.dart';

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
    Map<DartboardScoreTuple, num> throwCountMap = {};
    for (var thrw in throws) {
      var tuple = DartboardScoreTuple(thrw.type, thrw.score);
      if (throwCountMap.containsKey(tuple)) {
        throwCountMap[tuple] = throwCountMap[tuple]! + 1;
      } else {
        throwCountMap[tuple] = 1;
      }
    }

    var throwCount = throwCountMap.entries.toList();
    throwCount.sort((a, b) => a.value.compareTo(b.value));
    var min = throwCount.first.value;
    var max = throwCount.last.value;

    Map<DartboardScoreTuple, double> heatMap = {};
    for (var element in throwCount) {
      heatMap[element.key] = (element.value - min) / (max - min);
    }

    return Scaffold(
      body: Column(
        children: [
          _getDartboard(context, heatMap),
          Expanded(
            child: SafeArea(
              top: false,
              child: ListView(
                padding: EdgeInsets.zero,
                children: <Widget>[
                  ExpansionPanelList(
                    expansionCallback: (int index, bool value) {
                      setState(() {
                        _selectedUserId = widget.game.players[index].userId;
                      });
                    },
                    children: [
                      ...widget.game.players
                          .map(
                            (user) => _scoreDetailDropdown(
                              user.name,
                              user.userId,
                              widget.game.turns
                                  .where((element) =>
                                      element.userId == user.userId)
                                  .toList(),
                              throwCount,
                            ),
                          )
                          .toList(),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Container _getDartboard(
      BuildContext context, Map<DartboardScoreTuple, double>? heatMap) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color.fromARGB(25, 0, 0, 0),
        border: Border(
          bottom: BorderSide(color: Theme.of(context).hintColor, width: 3),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: SizedBox(
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

  ExpansionPanel _scoreDetailDropdown(String title, String userId,
      List<Turn> turns, List<MapEntry<DartboardScoreTuple, num>> throwCount) {
    var score = 501;
    var spendUnder170 = 0;
    var spendUnder100 = 0;
    var throwAbove30 = 0;
    var throwAbove50 = 0;
    var throwAbove100 = 0;
    for (var turn in turns) {
      var turnScore = _calculateScore([turn]);
      score -= turnScore;
      if (score < 170) {
        spendUnder170++;
      }

      if (score < 100) {
        spendUnder100++;
      }

      if (turnScore > 30) {
        throwAbove30 += 1;
      }

      if (turnScore > 50) {
        throwAbove50 += 1;
      }

      if (turnScore > 100) {
        throwAbove100 += 1;
      }
    }

    var throws = turns.expand((element) => element.throws);
    // Calculate highest count of throws
    var doubleCount = throws.fold<double>(
        0,
        (previousValue, element) =>
            previousValue +
            ((element.type == DartboardScoreType.double) ? 1 : 0));
    var tripleCount = throws.fold<double>(
        0,
        (previousValue, element) =>
            previousValue +
            ((element.type == DartboardScoreType.triple) ? 1 : 0));
    var outCount = throws.fold<double>(
        0,
        (previousValue, element) =>
            previousValue + ((element.type == DartboardScoreType.out) ? 1 : 0));

    var headerStyle = const TextStyle(fontSize: 22, fontWeight: FontWeight.bold);
    var rowStyle = const TextStyle(fontSize: 18);

    return ExpansionPanel(
      isExpanded: userId == _selectedUserId,
      canTapOnHeader: true,
      headerBuilder: (BuildContext context, bool isExpanded) => ListTile(
        title: Text(
          title,
          style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w300),
        ),
        trailing: Text(
          score > 0 ? "Remaining score $score" : "Winner",
          style: const TextStyle(fontSize: 16),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(25),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 2,
              child: Table(
                columnWidths: const {
                  0: FlexColumnWidth(1),
                  1: FixedColumnWidth(180.0)
                },
                defaultColumnWidth: const FixedColumnWidth(120.0),
                children: [
                  TableRow(children: [
                    Text(
                      'Turn stats',
                      textAlign: TextAlign.start,
                      style: headerStyle,
                    ),
                    const Text(""),
                  ]), // Header
                  TableRow(children: [
                    Text(
                      'Total turns taken',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      turns.length.toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Turns spend under 170',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      spendUnder170.toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Turns spend under 100',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      spendUnder100.toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Turns thrown higher than 30',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      throwAbove30.toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Turns thrown higher than 50',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      throwAbove50.toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Turns thrown higher than 100',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      throwAbove100.toString(),
                      style: rowStyle,
                    ),
                  ]),

                  const TableRow(children: [Text(""), Text("")]), // Spacer

                  TableRow(children: [
                    Text(
                      'Throw stats',
                      textAlign: TextAlign.start,
                      style: headerStyle,
                    ),
                    const Text(""),
                  ]), // Header
                  TableRow(children: [
                    Text(
                      'Amount of triples',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      tripleCount.toInt().toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Amount of doubles',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      doubleCount.toInt().toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Amount thrown out',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      outCount.toInt().toString(),
                      style: rowStyle,
                    ),
                  ]),
                  TableRow(children: [
                    Text(
                      'Most thrown',
                      textAlign: TextAlign.start,
                      style: rowStyle,
                    ),
                    Text(
                      "${throwCount.last.key.type.toShortString()} ${throwCount.last.value.toString()} (${throwCount.last.value}x)",
                      style: rowStyle,
                    ),
                  ]),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: SizedBox(
                width: 400,
                height: 400,
                child: _getThrowGraph(turns),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _getThrowGraph(List<Turn> turns) {
    double walkingAverage = 0;
    List<FlSpot> averageData = [];
    List<FlSpot> scoreData = [];
    var turnCount = 1;
    for (var turn in turns) {
      var turnScore = _calculateScore([turn]).toDouble();
      walkingAverage =
          ((walkingAverage * (turnCount - 1)) + turnScore) / turnCount;
      averageData.add(FlSpot(turnCount.toDouble(), walkingAverage));
      scoreData.add(FlSpot(turnCount.toDouble(), turnScore));
      turnCount++;
    }

    var minAverage =
        averageData.fold<double>(double.infinity, (a, b) => min(a, b.y));
    var minScore =
        scoreData.fold<double>(double.infinity, (a, b) => min(a, b.y));
    var maxAverage = averageData.fold<double>(0, (a, b) => max(a, b.y));
    var maxScore = scoreData.fold<double>(0, (a, b) => max(a, b.y));

    var minY = min(minAverage, minScore);
    var maxY = max(maxAverage, maxScore);

    var grayTextStyle = const TextStyle(
      color: Colors.blueGrey,
      fontWeight: FontWeight.bold,
      fontSize: 18,
    );

    return LineChart(
      LineChartData(
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
              fitInsideHorizontally: true,
              fitInsideVertically: true,
              maxContentWidth: 100,
              tooltipBgColor: Colors.white70,
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((LineBarSpot touchedSpot) {
                  final textStyle = TextStyle(
                    color: touchedSpot.bar.colors[0],
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  );
                  return LineTooltipItem(
                      '${touchedSpot.x}, ${touchedSpot.y.toStringAsFixed(2)}',
                      textStyle);
                }).toList();
              }),
          handleBuiltInTouches: true,
          getTouchLineStart: (data, index) => 0,
        ),
        axisTitleData: FlAxisTitleData(
          leftTitle: AxisTitle(
              showTitle: true,
              titleText: 'Score',
              margin: 0,
              textStyle: grayTextStyle),
          bottomTitle: AxisTitle(
              showTitle: true,
              titleText: 'Turn',
              margin: 24,
              textStyle: grayTextStyle),
        ),
        lineBarsData: [
          LineChartBarData(
            colors: [
              Colors.lightGreen,
            ],
            spots: averageData,
            isCurved: true,
            isStrokeCapRound: true,
            barWidth: 3,
            belowBarData: BarAreaData(
              show: false,
            ),
            dotData: FlDotData(show: false),
          ),
          LineChartBarData(
            colors: [
              Colors.lightBlue,
            ],
            spots: scoreData,
            isCurved: true,
            isStrokeCapRound: true,
            barWidth: 3,
            belowBarData: BarAreaData(
              show: false,
            ),
            dotData: FlDotData(show: false),
          ),
        ],
        minY: minY,
        maxY: maxY,
        titlesData: FlTitlesData(
          leftTitles: SideTitles(
              showTitles: true,
              getTextStyles: (context, value) => grayTextStyle,
              margin: 16,
              reservedSize: 40),
          rightTitles: SideTitles(showTitles: false),
          bottomTitles: SideTitles(
              showTitles: true,
              getTextStyles: (context, value) => grayTextStyle,
              margin: 16,
              reservedSize: 6),
          topTitles: SideTitles(showTitles: false),
        ),
        gridData: FlGridData(
          show: true,
          drawHorizontalLine: true,
          drawVerticalLine: true,
          horizontalInterval: 1,
          verticalInterval: maxY / minY,
          checkToShowHorizontalLine: (value) {
            return value == 1 || value % 10 == 0;
          },
        ),
        borderData: FlBorderData(
          show: false,
        ),
      ),
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
}
