import { Throw } from './throw';

export interface Turn {
  userId: string;
  username?: string;
  isValid?: boolean;
  throws: Throw[];
}
