import 'dart:ui';

import 'package:dartapp/models/dart_throw.dart';

class DartboardPart {
  int score; // Right vs left
  String path;
  DartboardScoreType type;
  Color color;
  bool selected = false;

  DartboardPart(this.type, this.score, this.path, this.color);
}
