import { Throw } from './throw';

export interface Turn {
  userId: string;
  isValid?: boolean;
  throws: Throw[];
}
