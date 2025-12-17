import { app } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import log from 'electron-log';

const APP_NAME = 'BlocksTracker'; // Use your app's actual name
const DESKTOP_FILE_NAME = `${APP_NAME}.desktop`;

async function getAutostartDir(): Promise<string> {
  const homeDir = os.homedir();
  return path.join(homeDir, '.config', 'autostart');
}

async function createDesktopFile(enable: boolean): Promise<boolean> {
  const autostartDir = await getAutostartDir();
  const desktopFilePath = path.join(autostartDir, DESKTOP_FILE_NAME);

  if (enable) {
    try {
      await fs.mkdir(autostartDir, { recursive: true });

      // Use the APPIMAGE path if it exists (for AppImage), otherwise fall back to getPath('exe').
      // This is crucial for making autostart work with portable AppImage files.
      const appExecutablePath = process.env.APPIMAGE || app.getPath('exe');

      const desktopFileContent = `[Desktop Entry]
Type=Application
Name=${APP_NAME}
Exec=${appExecutablePath}${enable ? ' --hidden' : ''}
Terminal=false
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
`;
      await fs.writeFile(desktopFilePath, desktopFileContent);
      log.info(`[LinuxStartup] Created .desktop file at: ${desktopFilePath}`);
      return true;
    } catch (error) {
      log.error(`[LinuxStartup] Failed to create .desktop file: ${error}`);
      return false;
    }
  } else {
    try {
      await fs.unlink(desktopFilePath);
      log.info(`[LinuxStartup] Deleted .desktop file at: ${desktopFilePath}`);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        log.info(
          `[LinuxStartup] .desktop file not found, no need to delete: ${desktopFilePath}`,
        );
        return true; // Already gone, so success
      }
      log.error(`[LinuxStartup] Failed to delete .desktop file: ${error}`);
      return false;
    }
  }
}

async function isDesktopFilePresent(): Promise<boolean> {
  const autostartDir = await getAutostartDir();
  const desktopFilePath = path.join(autostartDir, DESKTOP_FILE_NAME);
  try {
    await fs.access(desktopFilePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export async function setLinuxLaunchOnStartup(
  enable: boolean,
): Promise<boolean> {
  return createDesktopFile(enable);
}

export async function getLinuxLaunchOnStartupStatus(): Promise<boolean> {
  return isDesktopFilePresent();
}
