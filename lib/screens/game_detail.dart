import 'dart:math';

import 'package:dartapp/components/collapse_tile.dart';
import 'package:dartapp/extensions/capitalize.dart';
import 'package:dartapp/helpers/dartboard/dartboard_painter.dart';
import 'package:dartapp/helpers/turn_helper.dart';
import 'package:dartapp/models/dart_throw.dart';
import 'package:dartapp/models/game.dart';
import 'package:dartapp/models/turn.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/painting.dart';
import 'package:flutter/rendering.dart';

class GameDetailScreen extends StatefulWidget {
  const GameDetailScreen({Key? key, required this.game}) : super(key: key);
  final Game game;

  @override
  State<GameDetailScreen> createState() => GameDetailState();
}

class GameDetailState extends State<GameDetailScreen> {
  String? _selectedUserId = '';
  late Map<String, GlobalKey<CollapseTileState>> expansionTiles = {};

  @override
  void initState() {
    _selectedUserId = widget.game.players[0].userId;
    expansionTiles = {for (var e in widget.game.players) e.userId: GlobalKey()};
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
    num? min;
    num? max;
    if (throwCount.isNotEmpty) {
      min = throwCount.first.value;
      max = throwCount.last.value;
    }

    Map<DartboardScoreTuple, double> heatMap = {};
    if (throwCount.isNotEmpty && min != null && max != null) {
      for (var element in throwCount) {
        heatMap[element.key] = (element.value - min) / (max - min);
      }
    }

    return Scaffold(
      body: Column(
        children: [
          _getDartboard(context, heatMap),
          Expanded(
            child: SafeArea(
              top: false,
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: Color.fromARGB(255, 225, 225, 225),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(25),
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 50),
                      child: Center(
                        child: SizedBox(
                          width: MediaQuery.of(context).size.width * .8,
                          child: Column(children: [
                            ListView.separated(
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              separatorBuilder:
                                  (BuildContext context, int index) =>
                                      const Divider(color: Colors.white),
                              itemCount: widget.game.players.length,
                              itemBuilder: (context, index) {
                                var user = widget.game.players[index];
                                return _scoreDetailDropdown(
                                  user.name,
                                  user.userId,
                                  widget.game.turns
                                      .where((element) =>
                                          element.userId == user.userId)
                                      .toList(),
                                  throwCount,
                                );
                              },
                            ),
                            const Divider(color: Colors.white),
                          ]),
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
    );
  }

  Container _getDartboard(
    BuildContext context,
    Map<DartboardScoreTuple, double>? heatMap,
  ) {
    return Container(
      width: double.infinity,
      decoration:
          const BoxDecoration(color: Color.fromARGB(255, 225, 225, 225)),
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

  Widget _scoreDetailDropdown(
    String title,
    String userId,
    List<Turn> turns,
    List<MapEntry<DartboardScoreTuple, num>> throwCount,
  ) {
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
    var doubleCount = throws.fold<double>(
        0,
        (previousValue, element) =>
            previousValue +
            ((element.type == DartboardScoreType.double) ? 1 : 0));
    var tripleCount = throws.fold<double>(
      0,
      (previousValue, element) =>
          previousValue + ((element.type == DartboardScoreType.triple) ? 1 : 0),
    );
    var outCount = throws.fold<double>(
        0,
        (previousValue, element) =>
            previousValue + ((element.type == DartboardScoreType.out) ? 1 : 0));

    var headerStyle = const TextStyle(
        fontSize: 32, fontWeight: FontWeight.w900, color: Colors.white);
    var rowStyle = const TextStyle(
      fontSize: 18,
      color: Colors.white,
    );

    return CollapseTile(
      key: expansionTiles[userId],
      initiallyExpanded: userId == _selectedUserId,
      backgroundColor: Theme.of(context).primaryColor,
      onExpansionChanged: (bool value) {
        setState(() {
          if (value) {
            expansionTiles.forEach((key, val) {
              if (key != userId) {
                val.currentState!.collapse();
              } else {
                val.currentState!.expand();
              }
            });
            _selectedUserId = userId;
          } else {
            expansionTiles[_selectedUserId]!.currentState!.collapse();
            _selectedUserId = null;
          }
        });
      },
      title: Text(
        title,
        style: TextStyle(
            fontSize: userId == _selectedUserId ? 48 : 24,
            fontWeight: FontWeight.w900,
            color: Colors.white),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            score > 0 ? "Remaining score $score" : "Winner",
            style: TextStyle(
              fontSize: userId == _selectedUserId ? 32 : 24,
              color: Colors.white,
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 50),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(100),
                color: Colors.white,
              ),
              child: Icon(
                userId == _selectedUserId
                    ? Icons.keyboard_arrow_up_rounded
                    : Icons.keyboard_arrow_down_rounded,
                color: Theme.of(context).primaryColor,
                size: 32,
              ),
            ),
          ),
        ],
      ),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 0, 20),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 4,
                child: Table(
                  columnWidths: const {
                    0: FlexColumnWidth(1),
                    1: FixedColumnWidth(75.0)
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
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          turns.length.toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Turns spend under 170',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          spendUnder170.toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Turns spend under 100',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          spendUnder100.toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Turns thrown higher than 30',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          throwAbove30.toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Turns thrown higher than 50',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          throwAbove50.toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Turns thrown higher than 100',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          throwAbove100.toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),

                    const TableRow(children: [Text(""), Text("")]), // Spacer
                    const TableRow(children: [Text(""), Text("")]), // Spacer
                    const TableRow(children: [Text(""), Text("")]), // Spacer
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
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          tripleCount.toInt().toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Amount of doubles',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          doubleCount.toInt().toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Amount thrown out',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          outCount.toInt().toString(),
                          style: rowStyle,
                        ),
                      ),
                    ]),
                    TableRow(children: [
                      Text(
                        'Most thrown',
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: throwCount.isNotEmpty
                            ? Text(
                                "${throwCount.last.key.type.toShortString()[0].toUpperCase()}${throwCount.last.key.score.toString()} (${throwCount.last.value}x)",
                                style: rowStyle,
                              )
                            : const Text(""),
                      ),
                    ]),

                    TableRow(children: [
                      Text(
                        score == 0 ? 'Winning throw' : "",
                        textAlign: TextAlign.start,
                        style: rowStyle,
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          score == 0
                              ? "${turns.last.throws.last.type.toShortString().capitalize()} ${turns.last.throws.last.score.toString()}"
                              : "",
                          style: rowStyle,
                        ),
                      ),
                    ]),
                  ],
                ),
              ),
              Expanded(
                flex: 7,
                child:  Padding(
                  padding: const EdgeInsets.only(left: 50),
                  child: Container(
                  width: double.infinity,
                  height: 400,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child:Padding(
                      padding: const EdgeInsets.fromLTRB(25, 25, 25, 12.5),
                      child: _getThrowGraph(turns),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: LineChart(
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
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Padding(
                  padding: EdgeInsets.all(5),
                  child: Text("—— Average",
                      style: TextStyle(
                          color: Colors.lightGreen,
                          fontSize: 18,
                          fontWeight: FontWeight.w300))),
              Padding(
                  padding: EdgeInsets.all(5),
                  child: Text("—— Score",
                      style: TextStyle(
                          color: Colors.lightBlue,
                          fontSize: 18,
                          fontWeight: FontWeight.w300))),
            ],
          )
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
}
