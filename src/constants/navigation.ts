export const SPLASH_SCREEN = 'SPLASH';
export const HOME_SCREEN = 'HOME';
export const NEW_GAME_SCREEN = 'NEW_GAME';
export const PLAY_GAME_SCREEN = 'PLAY_GAME';
export const UNAUTHENTICATED_SCREEN = 'UNAUTHENTICATED';

export type RootStackParamList = {
  [SPLASH_SCREEN]: undefined;
  [HOME_SCREEN]: undefined;
  [NEW_GAME_SCREEN]: {
    selectedUsers: string[];
  };
  [PLAY_GAME_SCREEN]: {
    selectedUsers: string[];
  };
  [UNAUTHENTICATED_SCREEN]: undefined;
};
