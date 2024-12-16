import { Game } from '~/models/game';
import { GuestUser, User } from '~/models/user';

export const SPLASH_SCREEN = 'SPLASH';
export const HOME_SCREEN = 'HOME';
export const PROFILE_SCREEN = 'PROFILE';
export const FRIENDS_SCREEN = 'FRIENDS';
export const NEW_GAME_SCREEN = 'NEW_GAME';
export const PLAY_GAME_SCREEN = 'PLAY_GAME';
export const PLAYED_GAMES_SCREEN = 'PLAYED_GAMES';
export const GAME_DETAIL_SCREEN = 'GAME_DETAIL';
export const UNAUTHENTICATED_SCREEN = 'UNAUTHENTICATED';

export type RootStackParamList = {
    [SPLASH_SCREEN]: undefined;
    [HOME_SCREEN]: undefined;
    [PROFILE_SCREEN]: undefined;
    [FRIENDS_SCREEN]: undefined;
    [NEW_GAME_SCREEN]: {
        selectedUsers?: string[];
        guestUsers?: string[];
    };
    [PLAY_GAME_SCREEN]: {
        players: (Omit<User, 'friends'> | GuestUser)[];
        startingScore: number;
        activeGame?: Game;
    };
    [GAME_DETAIL_SCREEN]: {
        game: Game;
    };
    [PLAYED_GAMES_SCREEN]: undefined;
    [UNAUTHENTICATED_SCREEN]: undefined;
};
