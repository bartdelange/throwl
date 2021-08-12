import 'package:dartapp/dartboard/models/dart_throw.dart';

class Turn {
  List<DartThrow> throws = [];

  Turn();
  addThrow(DartThrow dartThrow) {
    throws.add(dartThrow);
  }
}