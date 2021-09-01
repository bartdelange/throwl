import 'package:dartapp/models/turn.dart';
import 'package:dartapp/models/user.dart';

class Game {
  final String gameId;
  DateTime? started;
  DateTime? finished;
  final List<User> players;
  List<Turn> turns = [];

  Game(this.gameId, this.players);
  Game.initAll(this.gameId, this.players, this.turns, this.started, this.finished);
  void AddTurn(Turn turn) {
    turns.add(turn);
  }
}