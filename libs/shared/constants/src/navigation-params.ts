import {
  DartboardScoreType,
  Game,
  GuestUser,
  User,
} from '@throwl/shared-domain-models';

export type SerializablePlayer =
  | {
      type: 'user';
      id: string;
      email: string;
      name: string;
    }
  | {
      type: 'guest_user';
      name: string;
    };

export type SerializableTurn = {
  userId: string;
  username?: string;
  isValid?: boolean;
  throws: {
    type: DartboardScoreType;
    score: number;
    isValid?: boolean;
  }[];
};

export type SerializableX01Options = {
  mode: 'x01';
  startingScore: number;
};

export type SerializableDoublesOptions = {
  mode: 'doubles';
  quickMatch: boolean;
  skipBull: boolean;
  endOnInvalid: boolean;
};

export type SerializableGameOptions =
  | SerializableX01Options
  | SerializableDoublesOptions;

export type SerializableGame = {
  id: string;
  players: SerializablePlayer[];
  turns: SerializableTurn[];
  started: string;
  finished?: string;
  options: SerializableGameOptions;
  startingScore?: number;
};

export function serializePlayerParam(
  player: Omit<User, 'friends'> | GuestUser,
): SerializablePlayer {
  return player.type === 'user'
    ? {
        type: 'user',
        id: player.id,
        email: player.email,
        name: player.name,
      }
    : { type: 'guest_user', name: player.name };
}

export function serializeGameParam(game: Game): SerializableGame {
  return {
    id: game.id,
    players: game.players.map(serializePlayerParam),
    turns: game.turns.map((turn) => ({
      userId: turn.userId,
      throws: turn.throws.map((thrw) => ({
        type: thrw.type,
        score: thrw.score,
        ...(thrw.isValid === undefined ? {} : { isValid: thrw.isValid }),
      })),
      ...(turn.username === undefined ? {} : { username: turn.username }),
      ...(turn.isValid === undefined ? {} : { isValid: turn.isValid }),
    })),
    started: game.started.toISOString(),
    ...(game.finished ? { finished: game.finished.toISOString() } : {}),
    options: game.options,
    ...(game.startingScore === undefined
      ? {}
      : { startingScore: game.startingScore }),
  };
}

export function deserializeGameParam(game: SerializableGame): Game {
  const { started, finished, ...rest } = game;
  return {
    ...rest,
    started: new Date(started),
    ...(finished ? { finished: new Date(finished) } : {}),
  };
}
