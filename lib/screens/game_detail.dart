import 'dart:math' as math;

import 'package:dartapp/components/collapse_tile.dart';
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
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class GameDetailScreen extends StatefulWidget {
  const GameDetailScreen({Key? key, required this.game}) : super(key: key);
  final Game game;

  @override
  State<GameDetailScreen> createState() => GameDetailState();
}

class GameDetailState extends State<GameDetailScreen> {
  String? _selectedUserId = null;
  late Map<String, GlobalKey<CollapseTileState>> expansionTiles = {};

  @override
  void initState() {
    expansionTiles = {for (var e in widget.game.players) e.userId: GlobalKey()};
    super.initState();
  }

  @override
  void dispose() {
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
    super.dispose();
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
        heatMap[element.key] =
            max - min == 0 ? 1 : (element.value - min) / (max - min);
      }
    }

    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        backgroundColor: const Color.fromARGB(255, 225, 225, 225),
        toolbarHeight: 0,
        elevation: 0,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color.fromARGB(255, 225, 225, 225),
                ),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      16.w,
                      math.max(MediaQuery.of(context).padding.top, 16.h),
                      16.w,
                      16.h),
                  child: _getDartboard(context, heatMap),
                ),
              ),
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
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(25.r),
                          ),
                        ),
                        child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 50.h),
                          child: Center(
                            child: SizedBox(
                              width: math.min(.95.sw, 800),
                              height: double.infinity,
                              child: SingleChildScrollView(
                                child: Column(children: [
                                  ListView.separated(
                                    physics:
                                        const NeverScrollableScrollPhysics(),
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
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: EdgeInsets.only(left: 15.h),
            child: const BackButton(),
          ),
        ],
      ),
    );
  }

  Widget _getDartboard(
    BuildContext context,
    Map<DartboardScoreTuple, double>? heatMap,
  ) {
    return Center(
      child: SizedBox(
        width: 500.w,
        child: AspectRatio(
          aspectRatio: 1,
          child: CustomPaint(
            painter: DartboardPainter(context, null, heatMap, false),
            child: Container(),
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

    var headerStyle = TextStyle(
        fontSize: math.max(32.sp, 24),
        fontWeight: FontWeight.w900,
        color: Colors.white);
    var rowStyle = const TextStyle(
      fontSize: 18,
      color: Colors.white,
    );

    var table = Table(
      columnWidths: const {0: FlexColumnWidth(4), 1: FlexColumnWidth(1)},
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

        ...(MediaQuery.of(context).size.width >= 1000
            ? [
                const TableRow(children: [Text(""), Text("")]), // Spacer
                const TableRow(children: [Text(""), Text("")]), // Spacer
                const TableRow(children: [Text(""), Text("")]), // Spacer
                const TableRow(children: [Text(""), Text("")]), // Spacer
              ]
            : [
                const TableRow(children: [Text(""), Text("")])
              ]),

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
                  ? "${turns.last.throws.last.type.toShortString()[0].toUpperCase()}${turns.last.throws.last.score.toString()}"
                  : "",
              style: rowStyle,
            ),
          ),
        ]),
      ],
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
            fontSize: math.max(24.sp, 18),
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
              fontSize: math.max(24.sp, 18),
              color: Colors.white,
            ),
          ),
          Padding(
            padding: EdgeInsets.only(left: 50.w),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(100.r),
                color: Colors.white,
              ),
              child: Icon(
                userId == _selectedUserId
                    ? Icons.keyboard_arrow_up_rounded
                    : Icons.keyboard_arrow_down_rounded,
                color: Theme.of(context).primaryColor,
                size: math.max(32.sp, 20),
              ),
            ),
          ),
        ],
      ),
      children: [
        Padding(
          padding: MediaQuery.of(context).size.width < 1000
              ? EdgeInsets.all(50.r)
              : EdgeInsets.fromLTRB(20.w, 20.h, 0, 20.h),
          child: MediaQuery.of(context).size.width < 1000
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    table,
                    Padding(
                      padding: EdgeInsets.only(top: 50.w),
                      child: Container(
                        width: double.infinity,
                        height: 400.h,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(25.r),
                        ),
                        child: Padding(
                          padding:
                              EdgeInsets.fromLTRB(25.w, 25.h, 25.w, 12.5.h),
                          child: _getThrowGraph(turns),
                        ),
                      ),
                    )
                  ],
                )
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 4, child: table),
                    Expanded(
                      flex: 7,
                      child: Padding(
                        padding: EdgeInsets.only(left: 50.w),
                        child: Container(
                          width: double.infinity,
                          height: 400.h,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(25.r),
                          ),
                          child: Padding(
                            padding:
                                EdgeInsets.fromLTRB(25.w, 25.h, 25.w, 12.5.w),
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
        averageData.fold<double>(double.infinity, (a, b) => math.min(a, b.y));
    var minScore =
        scoreData.fold<double>(double.infinity, (a, b) => math.min(a, b.y));
    var maxAverage = averageData.fold<double>(0, (a, b) => math.max(a, b.y));
    var maxScore = scoreData.fold<double>(0, (a, b) => math.max(a, b.y));

    var minY = math.min(minAverage, minScore);
    var maxY = math.max(maxAverage, maxScore);

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
