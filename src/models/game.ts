import { Turn } from '~/models/turn';
import { User } from '~/models/user';

export interface Game {
  id: string;
  players: Omit<User, 'friends'>[];
  turns: Turn[];
  started: Date;
  finished: Date;
  startingScore: number;
}
