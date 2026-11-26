import { act, renderHook, waitFor } from '@testing-library/react-native';
import { DartboardScoreType, Game, Turn } from '@throwl/shared-domain-models';
import { GameService } from './game_service';
import { useTeamGameSave } from './use-team-game-save';

jest.mock('./game_service', () => ({
  GameService: {
    writeNewGame: jest.fn(),
    writeGameUpdate: jest.fn(),
    getById: jest.fn(),
  },
}));

const players = [
  { type: 'user' as const, id: 'jan', name: 'Jan', email: 'jan@example.test' },
  ...['Klaas', 'Piet', 'Bart'].map((name) => ({
    type: 'guest_user' as const,
    name,
  })),
];
const teams = [{ members: ['jan', 'Piet'] }, { members: ['Klaas', 'Bart'] }];
const options = { mode: 'x01' as const, startingScore: 501 };
const visit: Turn = {
  userId: 'jan',
  throws: [{ type: DartboardScoreType.Double, score: 20 }],
  isValid: true,
};
const saved: Game = {
  id: 'game',
  players,
  teams,
  options,
  turns: [],
  started: new Date(),
  teamGameplayRevision: 2,
};

beforeEach(() => jest.resetAllMocks());

it('serializes a first winning save and its immediate undo on one document', async () => {
  let finishCreate: (id: string) => void = () => undefined;
  jest.mocked(GameService.writeNewGame).mockReturnValue(
    new Promise((resolve) => {
      finishCreate = resolve;
    }),
  );
  jest.mocked(GameService.writeGameUpdate).mockResolvedValue(undefined);
  const { result } = renderHook(() =>
    useTeamGameSave(undefined, teams, players, options),
  );

  act(() => {
    void result.current.save([visit], true);
  });
  act(() => {
    void result.current.save([], false);
  });
  expect(GameService.writeNewGame).toHaveBeenCalledTimes(1);
  expect(GameService.writeGameUpdate).not.toHaveBeenCalled();

  await act(async () => {
    finishCreate('game');
  });
  expect(GameService.writeGameUpdate).toHaveBeenCalledWith({
    id: 'game',
    teamGameplayRevision: 0,
    turns: [],
    finished: undefined,
  });
  expect(result.current.status).toBe('idle');
  expect(result.current.id).toBe('game');
});

it('retains a failed save for retry and stops writing on a revision conflict', async () => {
  jest
    .mocked(GameService.writeGameUpdate)
    .mockRejectedValue(new Error('Write failed'));
  jest
    .mocked(GameService.getById)
    .mockResolvedValueOnce(saved)
    .mockResolvedValueOnce({ ...saved, teamGameplayRevision: 3 });
  const { result } = renderHook(() =>
    useTeamGameSave(saved, teams, players, options),
  );
  await act(async () => {
    await result.current.save([visit], false);
  });
  expect(result.current.status).toBe('failed');
  await act(async () => {
    await result.current.retry();
  });
  expect(GameService.writeGameUpdate).toHaveBeenNthCalledWith(2, {
    id: 'game',
    teamGameplayRevision: 2,
    turns: [visit],
    finished: undefined,
  });
  expect(result.current.status).toBe('conflict');
  await act(async () => {
    await result.current.retry();
  });
  await waitFor(() =>
    expect(GameService.writeGameUpdate).toHaveBeenCalledTimes(2),
  );
});
