import 'package:dartapp/models/turn.dart';
import 'package:dartapp/models/user.dart';

class Game {
  String gameId;
  DateTime? started;
  DateTime? finished;
  final List<User> players;
  List<Turn> turns = [];

  Game(this.gameId, this.players);
  void AddTurn(Turn turn) {
    turns.add(turn);
  }
}