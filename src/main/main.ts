/*
 * Blocks Tracker - Todoing and habit tracking in one place.
 * Copyright (C) 2025 Chowdhury Md Sami Al Muntahi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import 'dotenv/config';
import axios from 'axios';
import MenuBuilder from './menu';
import keytar from 'keytar';
import { jwtDecode } from 'jwt-decode';
import {
  dbPath,
  dbUrl,
  latestMigration,
  Migration,
  API_BASE_URL,
  KEYCHAIN_SERVICE,
  KEYCHAIN_ACCESS_TOKEN_ACCOUNT,
  KEYCHAIN_REFRESH_TOKEN_ACCOUNT,
} from './constants';
import { resolveHtmlPath, getAssetPath } from './util';
import {
  ITaskIPC,
  TaskScheduleTypeEnum,
  ChannelsEnum,
} from '../renderer/types';

// const prisma = new PrismaClient();
import { prisma, runPrismaCommand } from './prisma';

import { SpaceService } from './services/SpaceService';
import { UserService } from './services/UserService';
import { TaskService } from './services/TaskService';
import { RepetitiveTaskTemplateService } from './services/RepetitiveTaskTemplateService';
import { startOAuthFlow } from './oAuth';
import apiClient, {
  registerAuthFailureHandler,
  registerTokenRefreshHandler,
  setInMemoryToken,
} from './apiClient';
import { SettingsService } from './services/SettingsService';
import { syncService } from './services/SyncService';
import { deviceSettingsService } from './services/DeviceSettingsService';
import { sendToMainWindow, setMainWindow } from './windowManager';

let session: {
  accessToken: string | null;
  user: { id: string; email: string } | null;
} = { accessToken: null, user: null };

const spaceService = new SpaceService();
const userService = new UserService();
const taskService = new TaskService();
const repetitiveTaskTemplateService = new RepetitiveTaskTemplateService();
const settingsService = new SettingsService();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}
let localMainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  let needsMigration;
  const dbExists = fs.existsSync(dbPath);
  if (!dbExists) {
    needsMigration = true;
    // prisma for whatever reason has trouble if the database file does not exist yet.
    // So just touch it here
    fs.closeSync(fs.openSync(dbPath, 'w'));
  } else {
    try {
      const latest: Migration[] =
        await prisma.$queryRaw`select * from _prisma_migrations order by finished_at`;
      needsMigration =
        latest[latest.length - 1]?.migration_name !== latestMigration;
    } catch (e) {
      log.error(e);
      needsMigration = true;
    }
  }

  if (needsMigration) {
    try {
      const schemaPath = path.join(
        app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
        'prisma',
        'schema.prisma',
      );
      log.info(
        `Needs a migration. Running prisma migrate with schema path ${schemaPath}`,
      );

      // first create or migrate the database! If you were deploying prisma to a cloud service, this migrate deploy
      // command you would run as part of your CI/CD deployment. Since this is an electron app, it just needs
      // to run every time the production app is started. That way if the user updates the app and the schema has
      // changed, it will transparently migrate their DB.
      await runPrismaCommand({
        command: ['migrate', 'deploy', '--schema', schemaPath],
        dbUrl,
      });
      log.info('Migration done.');

      // seed
      // log.info("Seeding...");
      // await seed(prisma);
    } catch (e) {
      log.error(e);
      process.exit(1);
    }
  } else {
    log.info('Does not need migration');
  }

  if (isDebug) {
    await installExtensions();
  }

  localMainWindow = new BrowserWindow({
    show: false,
    width: 1500,
    height: 928,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  setMainWindow(localMainWindow);

  localMainWindow.loadURL(resolveHtmlPath('index.html'));

  localMainWindow.on('ready-to-show', () => {
    if (!localMainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      localMainWindow.minimize();
    } else {
      localMainWindow.show();
    }
  });

  localMainWindow.on('closed', () => {
    log.info('Window closed');
    setMainWindow(null);
  });

  const menuBuilder = new MenuBuilder(localMainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  localMainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * todo for ipc events
 * 1. Error handling
 * 2. DB calls should be moved to a separate service
 */

/**
 * DBs
 */
// The generateDueRepetitiveTasks function has been moved to RepetitiveTaskTemplateRepository
// and is now called via repetitiveTaskTemplateService.generateDueTasks.

ipcMain.handle(
  ChannelsEnum.REQUEST_CREATE_TASK,
  async (event, task: ITaskIPC) => {
    const { schedule } = task;
    const userId = session.user ? session.user.id : null;

    try {
      if (
        schedule === TaskScheduleTypeEnum.Once ||
        schedule === TaskScheduleTypeEnum.Unscheduled
      ) {
        await taskService.createTask(task, userId);
      } else {
        await repetitiveTaskTemplateService.createRepetitiveTaskTemplate(
          task,
          userId,
        );
      }
      event.sender.send(ChannelsEnum.RESPONSE_CREATE_OR_UPDATE_TASK);
    } catch (err) {
      log.error(err);
      throw err;
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_UPDATE_TASK,
  async (event, task: ITaskIPC) => {
    const userId = session.user ? session.user.id : null;

    try {
      await taskService.updateTask(task, userId);
      event.sender.send(ChannelsEnum.RESPONSE_CREATE_OR_UPDATE_TASK);
    } catch (err) {
      log.error(err);
      throw err;
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_UPDATE_REPETITIVE_TASK,
  async (event, task: ITaskIPC) => {
    const userId = session.user ? session.user.id : null;

    try {
      await repetitiveTaskTemplateService.updateRepetitiveTaskTemplate(
        task,
        userId,
      );
      event.sender.send(ChannelsEnum.RESPONSE_CREATE_OR_UPDATE_TASK);
    } catch (err) {
      log.error(err);
      throw err;
    }
  },
);

/**
 * todo: add error handling
 */
ipcMain.on(ChannelsEnum.REQUEST_TASKS_FOR_DATE, async (event, date) => {
  const userId = session.user ? session.user.id : null;
  try {
    await repetitiveTaskTemplateService.generateDueTasks(userId);
    const tasksForToday = await taskService.getTasksForDate(userId, date);
    event.reply(ChannelsEnum.RESPONSE_TASKS_FOR_DATE, tasksForToday);
  } catch (err: any) {
    log.error(err?.message);
    // As per previous discussion, for 'on' events, we log and don't throw/reply with error directly.
    // Consider adding a specific error reply if the renderer needs to react to this.
  }
});

/**
 * todo: add error handling
 */
ipcMain.on(ChannelsEnum.REQUEST_TASKS_OVERDUE, async (event) => {
  const userId = session.user ? session.user.id : null;
  const tasksOverdue = await taskService.getOverdueTasks(userId);

  event.reply(ChannelsEnum.RESPONSE_TASKS_OVERDUE, tasksOverdue);
});

/**
 * todo: add error handling
 */
ipcMain.on(ChannelsEnum.REQUEST_COUNT_OF_TASKS_OVERDUE, async (event) => {
  const userId = session.user ? session.user.id : null;
  const count = await taskService.getCountOfTasksOverdue(userId);

  event.reply(ChannelsEnum.RESPONSE_COUNT_OF_TASKS_OVERDUE, count);
});

ipcMain.handle(
  ChannelsEnum.REQUEST_TOGGLE_TASK_COMPLETION_STATUS,
  async (event, { id, status, score }) => {
    // todo: need to make the one-off task in active
    const userId = session.user ? session.user.id : null;
    try {
      await taskService.toggleTaskCompletionStatus(id, status, score, userId);
    } catch (err) {
      log.error(err);
      throw err;
    }
  },
);

ipcMain.handle(ChannelsEnum.REQUEST_TASK_FAILURE, async (event, { id }) => {
  try {
    const userId = session.user ? session.user.id : null;
    await taskService.failTask(id, userId);
  } catch (err) {
    log.error(err);
    throw err;
  }
});

ipcMain.on(ChannelsEnum.REQUEST_ALL_ONE_OFF_ACTIVE_TASKS, async (event) => {
  const userId = session.user ? session.user.id : null;
  try {
    const tasks = await taskService.getAllActiveOnceTasks(userId);
    event.reply(ChannelsEnum.RESPONSE_ALL_ONE_OFF_ACTIVE_TASKS, tasks);
  } catch {
    event.reply(ChannelsEnum.ERROR_ALL_ONE_OFF_ACTIVE_TASKS);
  }
});

ipcMain.on(ChannelsEnum.REQUEST_ALL_UNSCHEDULED_ACTIVE_TASKS, async (event) => {
  const userId = session.user ? session.user.id : null;
  try {
    const tasks = await taskService.getAllActiveUnscheduledTasks(userId);
    event.reply(ChannelsEnum.RESPONSE_ALL_UNSCHEDULED_ACTIVE_TASKS, tasks);
  } catch {
    event.reply(ChannelsEnum.ERROR_ALL_UNSCHEDULED_ACTIVE_TASKS);
  }
});

ipcMain.on(ChannelsEnum.REQUEST_ALL_DAILY_ACTIVE_TASKS, async (event) => {
  const userId = session.user ? session.user.id : null;
  try {
    const tasks =
      await repetitiveTaskTemplateService.getAllActiveDailyTemplates(userId);

    event.reply(ChannelsEnum.RESPONSE_ALL_DAILY_ACTIVE_TASKS, tasks);
  } catch {
    event.reply(ChannelsEnum.ERROR_ALL_DAILY_ACTIVE_TASKS);
  }
});

ipcMain.on(
  ChannelsEnum.REQUEST_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
  async (event) => {
    const userId = session.user ? session.user.id : null;
    try {
      const tasks =
        await repetitiveTaskTemplateService.getAllActiveSpecificDaysInAWeekTemplates(
          userId,
        );
      event.reply(
        ChannelsEnum.RESPONSE_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS,
        tasks,
      );
    } catch {
      event.reply(ChannelsEnum.ERROR_ALL_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS);
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_TASK_RESCHEDULE,
  async (_event, { id, dueDate }) => {
    const userId = session.user ? session.user.id : null;

    try {
      await taskService.rescheduleTask(id, dueDate, userId);
    } catch (err: any) {
      log.error(err.message);
      throw err;
    }
  },
);

ipcMain.handle(ChannelsEnum.REQUEST_DAILY_TASKS_MONTHLY_REPORT, async () => {
  const userId = session.user ? session.user.id : null;

  try {
    return await repetitiveTaskTemplateService.getDailyTasksMonthlyReport(
      userId,
    );
  } catch (err: any) {
    log.error(err?.message);
    throw err;
  }
});

ipcMain.handle(
  ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_TASKS_MONTHLY_REPORT,
  async () => {
    const userId = session.user ? session.user.id : null;

    try {
      return await repetitiveTaskTemplateService.getSpecificDaysInAWeekTasksMonthlyReport(
        userId,
      );
    } catch (err: any) {
      // we do something here
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_BULK_TASK_FAILURE,
  async (_event, tasks: string[]) => {
    const userId = session.user ? session.user.id : null;

    try {
      return await taskService.bulkFailTasks(tasks, userId);
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_TASK_DETAILS,
  async (_event, taskId: string) => {
    const userId = session.user ? session.user.id : null;

    try {
      return await taskService.getTaskDetails(taskId, userId);
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_REPETITIVE_TASK_DETAILS,
  async (_event, templateId: string) => {
    const userId = session.user ? session.user.id : null;
    try {
      return await repetitiveTaskTemplateService.getRepetitiveTaskTemplateDetails(
        templateId,
        userId,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_STOP_REPETITIVE_TASK,
  async (event, templateId: string) => {
    const userId = session.user ? session.user.id : null;

    try {
      await repetitiveTaskTemplateService.stopRepetitiveTaskTemplate(
        templateId,
        userId,
      );

      event.sender.send(ChannelsEnum.RESPONSE_CREATE_OR_UPDATE_TASK);
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.handle(
  ChannelsEnum.REQUEST_CREATE_TAG,
  async (_event, tagName: string) => {
    try {
      return await prisma.tag.create({
        data: {
          name: tagName,
        },
      });
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.handle(ChannelsEnum.REQUEST_ALL_TAGS, async () => {
  try {
    return await prisma.tag.findMany();
  } catch (err: any) {
    log.error(err?.message);
    throw err;
  }
});

ipcMain.handle(
  ChannelsEnum.REQUEST_CREATE_SPACE,
  async (_event, spaceName: string) => {
    const userId = session.user ? session.user.id : null;
    try {
      return await spaceService.createSpace(spaceName, userId);
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.handle(ChannelsEnum.REQUEST_ALL_SPACES, async () => {
  const userId = session.user ? session.user.id : null;
  try {
    return await spaceService.getAllSpaces(userId);
  } catch (err: any) {
    log.error(err?.message);
    throw err;
  }
});

ipcMain.on(
  ChannelsEnum.REQUEST_UNSCHEDULED_ACTIVE_TASKS_FOR_SPACE,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;
    try {
      const tasks = await taskService.getActiveUnscheduledTasksWithSpaceId(
        spaceId,
        userId,
      );
      event.reply(
        ChannelsEnum.RESPONSE_UNSCHEDULED_ACTIVE_TASKS_FOR_SPACE,
        tasks,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_ONE_OFF_ACTIVE_TASKS_FOR_SPACE,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;

    try {
      const tasks = await taskService.getActiveOnceTasksWithSpaceId(
        spaceId,
        userId,
      );
      event.reply(ChannelsEnum.RESPONSE_ONE_OFF_ACTIVE_TASKS_FOR_SPACE, tasks);
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_DAILY_ACTIVE_TEMPLATES_FOR_SPACE,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;
    try {
      const templates =
        await repetitiveTaskTemplateService.getActiveDailyTemplatesWithSpaceId(
          spaceId,
          userId,
        );
      event.reply(
        ChannelsEnum.RESPONSE_DAILY_ACTIVE_TEMPLATES_FOR_SPACE,
        templates,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TEMPLATES_FOR_SPACE,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;

    try {
      const templates =
        await repetitiveTaskTemplateService.getActiveSpecificDaysInAWeekTemplatesWithSpaceId(
          spaceId,
          userId,
        );
      event.reply(
        ChannelsEnum.RESPONSE_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TEMPLATES_FOR_SPACE,
        templates,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

interface DecodedToken {
  user_id: string;
  email: string;
}

async function handleSuccessfulSignIn(
  accessToken: string,
  refreshToken: string,
) {
  if (!accessToken || !refreshToken) {
    throw new Error('Tokens not found in backend response.');
  }

  const decodedToken: DecodedToken = jwtDecode(accessToken);
  const { email, user_id } = decodedToken;

  if (!email) {
    throw new Error('Email not found in token.');
  }

  await userService.saveUserLocally(user_id, email);

  await keytar.setPassword(
    KEYCHAIN_SERVICE,
    KEYCHAIN_ACCESS_TOKEN_ACCOUNT,
    accessToken,
  );
  await keytar.setPassword(
    KEYCHAIN_SERVICE,
    KEYCHAIN_REFRESH_TOKEN_ACCOUNT,
    refreshToken,
  );

  session.accessToken = accessToken;
  const user = { email, id: user_id };
  session.user = user;
  setInMemoryToken(accessToken);
  return user;
}

async function attemptAutoSignIn() {
  try {
    const accessToken = await keytar.getPassword(
      KEYCHAIN_SERVICE,
      KEYCHAIN_ACCESS_TOKEN_ACCOUNT,
    );
    const refreshToken = await keytar.getPassword(
      KEYCHAIN_SERVICE,
      KEYCHAIN_REFRESH_TOKEN_ACCOUNT,
    );

    if (accessToken && refreshToken) {
      log.info('Tokens found in keychain, attempting auto sign-in.');
      return await handleSuccessfulSignIn(accessToken, refreshToken);
    }
    log.info('No stored tokens found. Skipping auto sign-in.');
    return null;
  } catch (err: any) {
    log.error('Failed to retrieve tokens on startup:', err.message);
    return null;
  }
}

ipcMain.handle(ChannelsEnum.REQUEST_GOOGLE_AUTH_START, async () => {
  try {
    const { code, redirectUri, codeVerifier } = await startOAuthFlow();

    const response = await axios.post(
      `${API_BASE_URL}/auth/google/desktop`,
      { code, redirectUri, codeVerifier },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const { accessToken, refreshToken } = response.data.result.data;
    const user = await handleSuccessfulSignIn(accessToken, refreshToken);

    return {
      success: true,
      data: { user },
    };
  } catch (err: any) {
    const errorMessage =
      axios.isAxiosError(err) && err.response
        ? err.response.data?.result?.error_message ||
          `Backend sign-in failed: ${err.response.status}`
        : err.message;
    log.error('Google Auth Error:', errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    if (localMainWindow) {
      localMainWindow.focus();
    }
  }
});

ipcMain.handle(ChannelsEnum.REQUEST_SIGN_OUT, async () => {
  try {
    await apiClient.post('/auth/signout');
    log.info('Successfully invalidated tokens on the backend.');
  } catch (apiError: any) {
    log.error(
      'Backend sign-out failed, proceeding with local sign-out:',
      apiError.message,
    );
  } finally {
    try {
      await keytar.deletePassword(
        KEYCHAIN_SERVICE,
        KEYCHAIN_ACCESS_TOKEN_ACCOUNT,
      );
      await keytar.deletePassword(
        KEYCHAIN_SERVICE,
        KEYCHAIN_REFRESH_TOKEN_ACCOUNT,
      );
      session.accessToken = null;
      session.user = null;
      setInMemoryToken(null);
      log.info('Local user session and tokens cleared successfully.');
    } catch (keytarError: any) {
      log.error(
        'Failed to clear local tokens from keychain:',
        keytarError.message,
      );
    }
  }
  return { success: true };
});

ipcMain.handle(ChannelsEnum.REQUEST_INITIAL_AUTH_STATUS, async () => {
  return await attemptAutoSignIn();
});

ipcMain.handle(ChannelsEnum.REQUEST_SYNC_START, async () => {
  if (!session.user) {
    throw new Error('User not authenticated');
  }
  return await syncService.runSync(session.user.id);
});

ipcMain.handle(ChannelsEnum.REQUEST_LAST_SYNC, async () => {
  if (!session.user) {
    throw new Error('User not authenticated');
  }
  return settingsService.getLastSync(session.user.id);
});

ipcMain.handle(ChannelsEnum.REQUEST_DEVICE_SETTINGS, async () => {
  return deviceSettingsService.getSettings();
});

ipcMain.handle(
  ChannelsEnum.REQUEST_SET_DEVICE_SETTINGS,
  async (_event, data) => {
    return deviceSettingsService.setSettings(data);
  },
);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    registerTokenRefreshHandler(handleSuccessfulSignIn);
    registerAuthFailureHandler(() => {
      sendToMainWindow(ChannelsEnum.RESPONSE_TOKEN_REFRESHING_FAILED);
    });

    createWindow().then(() => {
      app.on('activate', () => {
        log.info('app activated');
        const localMainWindow = BrowserWindow.getAllWindows()[0];
        if (!localMainWindow) {
          createWindow();
        } else {
          localMainWindow.show();
        }
      });
    });
  })
  .catch((err) => {
    if (isDebug) {
      console.log(err);
    } else {
      log.error(err);
    }
  });
