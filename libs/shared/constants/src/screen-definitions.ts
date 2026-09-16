import {
  SerializableDoublesOptions,
  SerializableGame,
  SerializableGameOptions,
  SerializablePlayer,
  SerializableX01Options,
} from './navigation-params';

export const SPLASH_SCREEN = 'SPLASH';
export const HOME_SCREEN = 'HOME';
export const PROFILE_SCREEN = 'PROFILE';
export const FRIENDS_SCREEN = 'FRIENDS';
export const NEW_GAME_SCREEN = 'NEW_GAME';
export const NORMAL_GAME_SCREEN = 'NORMAL_GAME';
export const NORMAL_GAME_DETAIL_SCREEN = 'NORMAL_GAME_DETAIL';
export const DOUBLES_GAME_SCREEN = 'DOUBLES_GAME';
export const DOUBLES_GAME_DETAIL_SCREEN = 'DOUBLES_GAME_DETAIL';
export const PLAYED_GAMES_SCREEN = 'PLAYED_GAMES';
export const UNAUTHENTICATED_SCREEN = 'UNAUTHENTICATED';

export type RootStackParamList = {
  [SPLASH_SCREEN]: undefined;
  [HOME_SCREEN]: undefined;
  [PROFILE_SCREEN]: undefined;
  [FRIENDS_SCREEN]: undefined;
  [NEW_GAME_SCREEN]: {
    selectedUsers?: string[];
    guestUsers?: string[];
    gameOptions?: SerializableGameOptions;
  };
  [NORMAL_GAME_SCREEN]: {
    players: SerializablePlayer[];
    options: SerializableX01Options;
    activeGame?: SerializableGame;
  };
  [NORMAL_GAME_DETAIL_SCREEN]: {
    game: SerializableGame;
  };
  [DOUBLES_GAME_SCREEN]: {
    players: SerializablePlayer[];
    options: SerializableDoublesOptions;
    activeGame?: SerializableGame;
  };
  [DOUBLES_GAME_DETAIL_SCREEN]: {
    game: SerializableGame;
  };
  [PLAYED_GAMES_SCREEN]: undefined;
  [UNAUTHENTICATED_SCREEN]: undefined;
};
