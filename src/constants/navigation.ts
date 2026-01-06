import { DoublesOptions, Game, GameOptions, X01Options } from '~/models/game';
import { GuestUser, User } from '~/models/user';

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
    gameOptions?: GameOptions;
  };
  [NORMAL_GAME_SCREEN]: {
    players: (Omit<User, 'friends'> | GuestUser)[];
    options: X01Options;
    activeGame?: Game;
  };
  [NORMAL_GAME_DETAIL_SCREEN]: {
    game: Game;
  };
  [DOUBLES_GAME_SCREEN]: {
    players: (Omit<User, 'friends'> | GuestUser)[];
    options: DoublesOptions;
    activeGame?: Game;
  };
  [DOUBLES_GAME_DETAIL_SCREEN]: {
    game: Game;
  };
  [PLAYED_GAMES_SCREEN]: undefined;
  [UNAUTHENTICATED_SCREEN]: undefined;
};
