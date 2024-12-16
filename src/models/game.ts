import { Turn } from '~/models/turn';
import { GuestUser, User } from '~/models/user';

export interface Game {
    id: string;
    players: (Omit<User, 'friends'> | GuestUser)[];
    turns: Turn[];
    started: Date;
    finished: Date;
    startingScore: number;
}
