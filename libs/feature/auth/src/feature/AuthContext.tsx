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

type RegistrationProvisioning = {
  result: Promise<User | undefined>;
  finish: (user: User | undefined) => void;
};

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
  const registrationProvisioning = useRef<RegistrationProvisioning | undefined>(
    undefined,
  );

  const invalidateSession = useCallback(async () => {
    setUser(undefined);
    await signOut(getAuth()).catch(() => undefined);
  }, []);

  const _onAuthStateChanged = useCallback(
    async <T extends { uid: string }>(firebaseUser?: T | null) => {
      try {
        if (!firebaseUser?.uid) {
          setUser(undefined);
        } else if (registrationProvisioning.current) {
          const provisionedUser = await registrationProvisioning.current.result;
          if (provisionedUser?.id === firebaseUser.uid) {
            setUser(provisionedUser);
          }
        } else {
          setUser(await UserService.getById(firebaseUser.uid));
        }
      } catch {
        await invalidateSession();
      } finally {
        setInitializing(false);
      }
    },
    [invalidateSession],
  );

  useEffect(() => {
    if (user) {
      return UserService.listenToUserChanges(
        user.id,
        (data) => {
          if (JSON.stringify(user) !== JSON.stringify(data)) setUser(data);
        },
        () => void invalidateSession(),
      );
    }
    return;
  }, [invalidateSession, user]);

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
          let finishProvisioning: (user: User | undefined) => void = () =>
            undefined;
          const result = new Promise<User | undefined>((resolve) => {
            finishProvisioning = resolve;
          });
          const provisioning = {
            result,
            finish: finishProvisioning,
          };
          registrationProvisioning.current = provisioning;
          try {
            const userCredential = await createUserWithEmailAndPassword(
              getAuth(),
              email,
              password,
            );
            const applicationUser = await UserService.create(
              userCredential.user.uid,
              email,
              name,
            );
            setUser(applicationUser);
            provisioning.finish(applicationUser);
          } catch (error) {
            // Do not leave a partially provisioned Auth account active in the
            // app when its Firestore registration batch failed.
            provisioning.finish(undefined);
            await invalidateSession();
            throw error;
          } finally {
            if (registrationProvisioning.current === provisioning) {
              registrationProvisioning.current = undefined;
            }
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
