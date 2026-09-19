import {
  activate,
  fetchAndActivate,
  getBoolean,
  onConfigUpdate,
  type RemoteConfig,
} from '@react-native-firebase/remote-config';
import {
  initializeMaintenanceMode,
  MAINTENANCE_MODE_DEFAULTS,
} from './maintenanceMode';

jest.mock('@react-native-firebase/remote-config', () => ({
  activate: jest.fn(),
  fetchAndActivate: jest.fn(),
  getBoolean: jest.fn(),
  getRemoteConfig: jest.fn(),
  onConfigUpdate: jest.fn(() => jest.fn()),
}));

const mockActivate = jest.mocked(activate);
const mockFetchAndActivate = jest.mocked(fetchAndActivate);
const mockGetBoolean = jest.mocked(getBoolean);
const mockOnConfigUpdate = jest.mocked(onConfigUpdate);

describe('maintenance mode Remote Config', () => {
  const remoteConfig = {} as RemoteConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActivate.mockResolvedValue(true);
    mockFetchAndActivate.mockResolvedValue(true);
    mockOnConfigUpdate.mockReturnValue(jest.fn());
  });

  it('bundles a false default', () => {
    expect(MAINTENANCE_MODE_DEFAULTS).toEqual({ maintenance_mode: false });
  });

  it('uses a fetched false value', async () => {
    mockGetBoolean.mockReturnValue(false);
    const onChange = jest.fn();

    await initializeMaintenanceMode(onChange, remoteConfig);

    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(mockFetchAndActivate).toHaveBeenCalledWith(remoteConfig);
  });

  it('uses a fetched true value', async () => {
    mockGetBoolean.mockReturnValueOnce(false).mockReturnValueOnce(true);
    const onChange = jest.fn();

    await initializeMaintenanceMode(onChange, remoteConfig);

    expect(onChange).toHaveBeenNthCalledWith(1, false);
    expect(onChange).toHaveBeenNthCalledWith(2, true);
  });

  it('keeps the existing value when fetching fails', async () => {
    mockGetBoolean.mockReturnValue(true);
    mockFetchAndActivate.mockRejectedValue(new Error('offline'));
    const onChange = jest.fn();

    await initializeMaintenanceMode(onChange, remoteConfig);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
