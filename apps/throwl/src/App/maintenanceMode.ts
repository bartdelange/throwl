import {
  activate,
  fetchAndActivate,
  getBoolean,
  getRemoteConfig,
  onConfigUpdate,
  type RemoteConfig,
  type Unsubscribe,
} from '@react-native-firebase/remote-config';

export const MAINTENANCE_MODE_KEY = 'maintenance_mode';
export const MAINTENANCE_MODE_DEFAULTS = {
  [MAINTENANCE_MODE_KEY]: false,
} as const;

export async function initializeMaintenanceMode(
  onChange: (enabled: boolean) => void,
  remoteConfig: RemoteConfig = getRemoteConfig(),
): Promise<Unsubscribe> {
  remoteConfig.defaultConfig = MAINTENANCE_MODE_DEFAULTS;

  const readValue = () => getBoolean(remoteConfig, MAINTENANCE_MODE_KEY);
  onChange(readValue());

  try {
    await fetchAndActivate(remoteConfig);
    onChange(readValue());
  } catch {
    // Keep using the already activated value, or the bundled false default.
  }

  return onConfigUpdate(remoteConfig, {
    next: (update) => {
      if (!update.getUpdatedKeys().has(MAINTENANCE_MODE_KEY)) {
        return;
      }

      void activate(remoteConfig)
        .then(() => onChange(readValue()))
        .catch(() => undefined);
    },
    error: () => undefined,
    complete: () => undefined,
  });
}
