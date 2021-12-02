import { User } from '~/models/user';
import { Turn } from '~/models/turn';

export interface Game {
  id: string;
  players: Omit<User, 'friends'>[];
  turns: Turn[];
  started: Date;
  finished: Date;
  startingScore: number;
}
