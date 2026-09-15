import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@react-native-firebase/auth';
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { User } from '@throwl/shared-domain-models';
import { UserService } from '@throwl/shared-data-access-user';

interface AuthContextProps {
  user?: User;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

// @ts-expect-error Don't want to implement on creation as it is done below immediately
export const AuthContext = createContext<AuthContextProps>({});
export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User>();
  const [initializing, setInitializing] = useState(true);
  const registrationInProgress = useRef(false);

  const _onAuthStateChanged = useCallback(
    async <T extends { uid: string }>(firebaseUser?: T | null) => {
      try {
        if (!firebaseUser?.uid) {
          setUser(undefined);
        } else if (!registrationInProgress.current) {
          setUser(await UserService.getById(firebaseUser.uid));
        }
      } catch {
        // Auth accounts without an application user document are not a valid
        // signed-in application session. Keep listener failures contained;
        // interactive login/registration calls surface their own errors.
        setUser(undefined);
      } finally {
        setInitializing(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (user) {
      return UserService.listenToUserChanges(user.id, (data) => {
        if (JSON.stringify(user) !== JSON.stringify(data)) setUser(data);
      });
    }
    return;
  }, [user]);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), _onAuthStateChanged); // unsubscribe on unmount
  }, [_onAuthStateChanged]);

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        login: async (email: string, password: string) => {
          await signInWithEmailAndPassword(getAuth(), email, password);
        },
        register: async (email: string, password: string, name: string) => {
          registrationInProgress.current = true;
          try {
            const userCredential = await createUserWithEmailAndPassword(
              getAuth(),
              email,
              password,
            );
            setUser(
              await UserService.create(userCredential.user.uid, email, name),
            );
          } catch (error) {
            // Do not leave a partially provisioned Auth account active in the
            // app when its Firestore registration batch failed.
            await signOut(getAuth()).catch(() => undefined);
            throw error;
          } finally {
            registrationInProgress.current = false;
          }
        },
        logout: async () => {
          await signOut(getAuth());
          setUser(undefined);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
