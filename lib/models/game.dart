import 'turn.dart';
import 'user.dart';

class Game {
  final String gameId;
  DateTime? started;
  DateTime? finished;
  final List<User> players;
  List<Turn> turns = [];

  Game(this.gameId, this.players);
  Game.initAll(this.gameId, this.players, this.turns, this.started, this.finished);
  void addTurn(Turn turn) {
    turns.add(turn);
  }
}