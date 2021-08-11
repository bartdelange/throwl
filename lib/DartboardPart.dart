import 'dart:ui';

enum DartboardScoreType {
  bull,
  triple,
  double,
  single,
}

class DartboardPart {
  int score; // Right vs left
  String path;
  DartboardScoreType type;
  Color color;

  DartboardPart(this.type, this.score, this.path, this.color);
}
