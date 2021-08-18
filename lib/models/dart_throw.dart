enum DartboardScoreType {
  bull,
  triple,
  double,
  single,
  out,
}

extension ParseToString on DartboardScoreType {
  String toShortString() {
    return this.toString().split('.').last;
  }
}

class DartThrow {
  DartboardScoreType type;
  int score;

  DartThrow(this.type, this.score);
}