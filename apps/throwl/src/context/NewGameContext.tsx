import * as React from 'react';
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { GameMode, GameOptions } from '@throwl/shared-domain-models';

export type NewGameState = {
  mode?: GameMode;
  options?: GameOptions;
  players?: string[];
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
  initialState?: NewGameState;
}) {
  const [state, setState] = useState<NewGameState>(
    initialState ?? {
      mode: 'x01',
      options: { mode: 'x01', startingScore: 501 },
      players: [],
    },
  );
  return (
    <NewGameContext.Provider value={{ state, setState }}>
      {children}
    </NewGameContext.Provider>
  );
}
