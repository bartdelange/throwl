import 'package:dartapp/models/dart_throw.dart';

class Turn {
  List<DartThrow> throws = [];
  bool isValid = true;
  String userId;

  Turn(this.userId);
  addThrow(DartThrow dartThrow) {
    throws.add(dartThrow);
  }
}