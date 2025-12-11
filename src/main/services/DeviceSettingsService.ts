import ElectronStore from 'electron-store';

/**
 * Defines the structure of the settings that are physically stored on disk.
 */
interface StoredDeviceSettings {
  notificationsEnabled: boolean;
}

/**
 * Defines the structure of the settings object returned by the service.
 * It includes derived settings that are not stored directly.
 */
export interface DeviceSettings {
  notificationsEnabled: boolean;
  launchOnStartup: boolean;
}

const defaults: StoredDeviceSettings = {
  notificationsEnabled: true,
};

const store = new ElectronStore<StoredDeviceSettings>({ defaults });

class DeviceSettingsService {
  /**
   * Retrieves all device-specific settings, including derived ones.
   * @returns An object containing all current device settings.
   */
  getSettings(): DeviceSettings {
    const notificationsEnabled = store.get('notificationsEnabled');
    return {
      notificationsEnabled,
      launchOnStartup: notificationsEnabled,
    };
  }

  setSettings(settings: Partial<StoredDeviceSettings>): void {
    store.set(settings);
  }
}

export const deviceSettingsService = new DeviceSettingsService();
