import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import {
  GameMode,
  GameOptions,
  X01Options,
} from '@throwl/shared-domain-models';

export type NewGameState = {
  mode: GameMode;
  options: GameOptions;
  players: string[];
};

const DEFAULT_X01_OPTIONS: X01Options = {
  mode: 'x01',
  startingScore: 501,
};

export const getDefaultOptions = (mode: GameMode): GameOptions =>
  mode === 'doubles'
    ? {
        mode: 'doubles',
        quickMatch: false,
        endOnInvalid: false,
        skipBull: false,
      }
    : DEFAULT_X01_OPTIONS;

const getInitialState = (
  initialState?: Partial<NewGameState>,
): NewGameState => {
  const mode = initialState?.mode ?? initialState?.options?.mode ?? 'x01';

  return {
    mode,
    options:
      initialState?.options?.mode === mode
        ? initialState.options
        : getDefaultOptions(mode),
    players: initialState?.players ?? [],
  };
};

type Ctx = {
  state: NewGameState;
  setState: Dispatch<SetStateAction<NewGameState>>;
};

const NewGameContext = createContext<Ctx | null>(null);

export function useNewGame() {
  const ctx = useContext(NewGameContext);
  if (!ctx) throw new Error('useNewGame must be used within <NewGameProvider>');
  return ctx;
}

export function NewGameProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<NewGameState>;
}) {
  const [state, setState] = useState<NewGameState>(() =>
    getInitialState(initialState),
  );
  return (
    <NewGameContext.Provider value={{ state, setState }}>
      {children}
    </NewGameContext.Provider>
  );
}
