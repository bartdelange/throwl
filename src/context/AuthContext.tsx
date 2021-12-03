import auth from '@react-native-firebase/auth';
import React, {
  createContext,
  PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import { User } from '~/models/user';
import { UserService } from '~/services/user_service';

interface AuthContext {
  user?: User;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

// @ts-ignore Don't want to implement on creation as it is done below immediately
export const AuthContext = createContext<AuthContext>({});
export const AuthProvider: React.FC<PropsWithChildren<any>> = ({
  children,
}) => {
  const [user, setUser] = useState<User>();
  const [initializing, setInitializing] = useState(true);

  async function onAuthStateChanged(user: any) {
    if (user?.uid) {
      setUser(await UserService.getById(user.uid));
    }
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    if (user) {
      return UserService.listenToUserChanges(user.id, data => {
        if (JSON.stringify(user) !== JSON.stringify(data)) setUser(data);
      });
    }
  }, [user]);

  useEffect(() => {
    return auth().onAuthStateChanged(onAuthStateChanged); // unsubscribe on unmount
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        login: async (email: string, password: string) => {
          await auth().signInWithEmailAndPassword(email, password);
        },
        register: async (email: string, password: string, name: string) => {
          const userCredential = await auth().createUserWithEmailAndPassword(
            email,
            password
          );
          await auth().signInWithEmailAndPassword(email, password);
          setUser(
            await UserService.create(userCredential.user.uid, email, name)
          );
        },
        logout: async () => {
          await auth().signOut();
          setUser(undefined);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
};
