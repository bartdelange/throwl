export interface Friend {
  requester?: string;
  confirmed: boolean;
  user: Omit<User, 'friends'>;
}

export interface User {
  type: 'user';
  id: string;
  email: string;
  name: string;
  friends?: Friend[];
}

export interface GuestUser {
  type: 'guest_user';
  name: string;
}
