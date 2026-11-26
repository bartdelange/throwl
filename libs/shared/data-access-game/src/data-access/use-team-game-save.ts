import { useRef, useState } from 'react';
import {
  Game,
  GameOptions,
  GuestUser,
  TeamRoster,
  Turn,
  User,
} from '@throwl/shared-domain-models';
import { GameService } from './game_service';

type Snapshot = { turns: Turn[]; finished: boolean };

export function useTeamGameSave(
  activeGame: Game | undefined,
  teams: TeamRoster | undefined,
  players: (User | GuestUser)[],
  options: GameOptions,
) {
  const id = useRef(activeGame?.id);
  const revision = useRef(activeGame?.teamGameplayRevision ?? 0);
  const pending = useRef<Snapshot | undefined>(undefined);
  const writing = useRef(false);
  const conflict = useRef(false);
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'failed' | 'conflict'
  >('idle');

  const flush = async () => {
    if (!teams || writing.current || conflict.current) return;
    writing.current = true;
    setStatus('saving');
    try {
      while (pending.current) {
        const snapshot = pending.current;
        if (id.current) {
          await GameService.writeGameUpdate({
            id: id.current,
            teamGameplayRevision: revision.current,
            turns: snapshot.turns,
            finished: snapshot.finished ? new Date() : undefined,
          });
          revision.current++;
        } else {
          id.current = await GameService.writeNewGame({
            players,
            teams,
            options,
            started: new Date(),
            turns: snapshot.turns,
            finished: snapshot.finished ? new Date() : undefined,
          });
        }
        if (pending.current === snapshot) pending.current = undefined;
      }
      setStatus('idle');
    } catch {
      const latest = id.current
        ? await GameService.getById(id.current).catch(() => undefined)
        : undefined;
      conflict.current =
        latest?.teamGameplayRevision !== undefined &&
        latest.teamGameplayRevision !== revision.current;
      setStatus(conflict.current ? 'conflict' : 'failed');
    } finally {
      writing.current = false;
    }
  };

  const save = (turns: Turn[], finished: boolean) => {
    pending.current = { turns, finished };
    return flush();
  };

  return { id: id.current, status, save, retry: flush };
}
