import {
  DartboardScoreType,
  Game,
  Throw,
  gamePlayerId,
} from '@throwl/shared-domain-models';
import { DoublesGameHelper } from './doubles_game_helper';
import { GameHelper } from './game_helper';
import { resolveParticipants } from './scoring-participants';
import { X01GameHelper } from './x01_game_helper';

function isBoardThrow({ type, score }: Throw): boolean {
  switch (type) {
    case DartboardScoreType.Out:
      return score === 0;
    case DartboardScoreType.Bull:
      return score === 25 || score === 50;
    case DartboardScoreType.Single:
    case DartboardScoreType.Double:
    case DartboardScoreType.Triple:
      return Number.isInteger(score) && score >= 1 && score <= 20;
  }
}

export function getGameWinner(game: Game) {
  if (!game.finished) return undefined;
  const lineup = resolveParticipants(
    game.players.map((player) => ({
      id: gamePlayerId(player),
      name: player.name,
    })),
    game.teams,
  );
  const { options } = game;
  const progress = new Map<string, number>();
  const targets =
    options.mode === 'doubles' ? DoublesGameHelper.buildTargets(options) : [];

  for (const [visitIndex, visit] of game.turns.entries()) {
    const side = lineup.participantFor(visit.userId);
    if (!side || visit.throws.length > 3 || !visit.throws.every(isBoardThrow))
      return undefined;
    if (
      game.teams &&
      lineup.order[visitIndex % lineup.order.length] !== visit.userId
    )
      return undefined;
    const previous = progress.get(side.id) ?? 0;
    let current = previous;
    let ended = false;
    let won = false;

    for (const dart of visit.throws) {
      if (ended || won) return undefined;
      if (options.mode === 'x01') {
        current += GameHelper.calculateTurnScore({ ...visit, throws: [dart] });
        ended = !X01GameHelper.checkThrowValidity(
          { ...visit, throws: [dart] },
          current,
          options.startingScore,
        );
        won = !ended && current === options.startingScore;
        if (ended) current = previous;
      } else {
        const target = targets[current];
        ended = !DoublesGameHelper.evaluateThrow(dart, target, options)
          .isThrowValid;
        if (dart.isValid !== undefined && dart.isValid === ended)
          return undefined;
        if (!ended && DoublesGameHelper.sameTarget(dart, target)) current++;
        won = current === targets.length;
      }
    }

    if (visit.isValid !== undefined && visit.isValid === ended)
      return undefined;
    if (won) {
      if (visitIndex !== game.turns.length - 1) return undefined;
      return { participant: side, visit };
    }
    if (game.teams && !ended && visit.throws.length !== 3) return undefined;
    progress.set(side.id, current);
  }
  return undefined;
}
