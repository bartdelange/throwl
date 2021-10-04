import 'dart_throw.dart';

class Turn {
  List<DartThrow> throws = [];
  bool isValid = true;
  String userId;

  Turn(this.userId);
  Turn.initAll(this.userId, this.throws, this.isValid);
  addThrow(DartThrow dartThrow) {
    throws.add(dartThrow);
  }
}