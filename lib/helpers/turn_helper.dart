import 'package:dartapp/dartboard/dartboard_part.dart';
import 'package:dartapp/dartboard/models/dart_throw.dart';

class ScoreHelper {
  static int calculateScore(DartThrow currentThrow) {
    switch (currentThrow.type) {
      case DartboardScoreType.bull:
        return currentThrow.score;
      case DartboardScoreType.triple:
        return currentThrow.score * 3;
      case DartboardScoreType.double:
        return currentThrow.score * 2;
      case DartboardScoreType.single:
        return currentThrow.score;
      case DartboardScoreType.out:
        return 0;
    }
  }

  static bool isValidThrow(int newStanding, DartThrow dartThrow) {
    if (newStanding == 0) {
      // Not double or bullseye
      return (dartThrow.type == DartboardScoreType.double || (dartThrow.type == DartboardScoreType.bull && dartThrow.score == 50));
    }

    return newStanding > 1;
  }
}