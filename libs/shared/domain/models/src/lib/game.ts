import { Turn } from './turn';
import { GuestUser, User } from './user';

export type GameMode = 'x01' | 'doubles';

export type X01Options = {
  mode: 'x01';
  startingScore: number;
};

export type DoublesOptions = {
  mode: 'doubles';
  quickMatch: boolean;
  skipBull: boolean;
  endOnInvalid: boolean;
};

export type GameOptions = X01Options | DoublesOptions;

export interface Game {
  id: string;
  players: (Omit<User, 'friends'> | GuestUser)[];
  turns: Turn[];
  started: Date;
  finished?: Date;
  options: GameOptions;

  // LEGACY for backwards compatibility (optional)
  startingScore?: number;
}
