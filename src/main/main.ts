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
import dayjs, { Dayjs } from 'dayjs';
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
} from './constants';
import { resolveHtmlPath, getAssetPath } from './util';
import {
  ITaskIPC,
  TaskScheduleTypeEnum,
  TaskCompletionStatusEnum,
  DaysInAWeek,
  ChannelsEnum,
} from '../renderer/types';
import {
  getTodayStart,
  getTodayEnd,
  getDaysForSpecificDaysInAWeekTasks,
  getDaysForDailyTasks,
} from './helpers';

// const prisma = new PrismaClient();
import { prisma, runPrismaCommand } from './prisma';

import { SpaceService } from './services/SpaceService';
import { UserService } from './services/UserService';
import { TaskService } from './services/TaskService';
import { RepetitiveTaskTemplateService } from './services/RepetitiveTaskTemplateService';
// eslint-disable-next-line import/no-relative-packages
import { RepetitiveTaskTemplate } from '../generated/client';
import { startOAuthFlow } from './oAuth';

const KEYCHAIN_SERVICE = 'com.blocks-tracker.app';
const KEYCHAIN_ACCESS_TOKEN_ACCOUNT = 'currentUserAccessToken';
const KEYCHAIN_REFRESH_TOKEN_ACCOUNT = 'currentUserRefreshToken';

let session: {
  accessToken: string | null;
  user: { id: string; email: string } | null;
} = { accessToken: null, user: null };

const spaceService = new SpaceService();
const userService = new UserService();
const taskService = new TaskService();
const repetitiveTaskTemplateService = new RepetitiveTaskTemplateService();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

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

  mainWindow = new BrowserWindow({
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

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    log.info('Window closed');
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
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
const generateDueRepetitiveTasks = async () => {
  const todayStart = dayjs().startOf('day');
  const todayStartAsString = todayStart.toISOString();

  const dueRepetitiveTasks = await prisma.repetitiveTaskTemplate.findMany({
    where: {
      isActive: true,
      OR: [
        { lastDateOfTaskGeneration: { lt: todayStartAsString } },
        { lastDateOfTaskGeneration: null },
      ],
    },
    include: {
      tags: true,
    },
  });

  await Promise.all(
    dueRepetitiveTasks.map(async (repetitiveTask) => {
      const {
        id: templateId,
        title,
        description,
        schedule,
        shouldBeScored,
        createdAt,
        timeOfDay,
        tags,
        spaceId,
      } = repetitiveTask;

      let lastDateOfTaskGeneration: Dayjs | Date | null;
      // eslint-disable-next-line prettier/prettier
      lastDateOfTaskGeneration = repetitiveTask.lastDateOfTaskGeneration;

      if (!lastDateOfTaskGeneration) {
        const taskCreationDate = dayjs(createdAt).startOf('day').toISOString();
        if (taskCreationDate === todayStart.toISOString())
          lastDateOfTaskGeneration = todayStart.subtract(1, 'day');
        else lastDateOfTaskGeneration = createdAt;
      }

      const daysSinceLastTaskGeneration = dayjs()
        .startOf('day')
        .diff(dayjs(lastDateOfTaskGeneration).startOf('day'), 'day');

      const dayArray = Array.from(
        { length: daysSinceLastTaskGeneration },
        (_, i) => i + 1,
      );

      await Promise.all(
        dayArray.map(async (day) => {
          let dueDate: Dayjs | string = dayjs(lastDateOfTaskGeneration).add(
            day,
            'day',
          );
          const dayOfWeekLowercase = dueDate.format('dddd').toLowerCase();

          if (repetitiveTask[dayOfWeekLowercase as DaysInAWeek]) {
            dueDate = dueDate.toISOString();

            await prisma.task.upsert({
              where: {
                repetitiveTaskTemplateId_dueDate: {
                  repetitiveTaskTemplateId: templateId,
                  dueDate,
                },
              },
              create: {
                repetitiveTaskTemplateId: templateId,
                dueDate,
                title,
                description,
                schedule,
                shouldBeScored,
                timeOfDay,
                // tags: {
                //   connect: tags.map((tag) => ({ id: tag.id })),
                // },
                spaceId,
              },
              update: {},
            });

            await prisma.repetitiveTaskTemplate.update({
              where: {
                id: templateId,
              },
              data: {
                lastDateOfTaskGeneration: dueDate,
              },
            });
          }
        }),
      );
    }),
  );
};

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
ipcMain.on(ChannelsEnum.REQUEST_TASKS_TODAY, async (event) => {
  await generateDueRepetitiveTasks();
  const userId = session.user ? session.user.id : null;
  const tasksForToday = await taskService.getTasksForToday(userId);

  event.reply(ChannelsEnum.RESPONSE_TASKS_TODAY, tasksForToday);
});

/**
 * todo: add error handling
 */
ipcMain.on(ChannelsEnum.REQUEST_TASKS_OVERDUE, async (event) => {
  const userId = session.user ? session.user.id : null;
  const tasksOverdue = await taskService.getOverdueTasks(userId);

  event.reply(ChannelsEnum.RESPONSE_TASKS_OVERDUE, tasksOverdue);
});

ipcMain.handle(
  ChannelsEnum.REQUEST_TOGGLE_TASK_COMPLETION_STATUS,
  async (event, { id, checked, score }) => {
    // todo: need to make the one-off task in active
    const userId = session.user ? session.user.id : null;
    try {
      await taskService.toggleTaskCompletionStatus(id, checked, score, userId);
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
  ChannelsEnum.REQUEST_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;
    try {
      const tasks = await taskService.getActiveUnscheduledTasksWithSpaceId(
        spaceId,
        userId,
      );
      event.reply(
        ChannelsEnum.RESPONSE_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID,
        tasks,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;

    try {
      const tasks = await taskService.getActiveOnceTasksWithSpaceId(
        spaceId,
        userId,
      );
      event.reply(
        ChannelsEnum.RESPONSE_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID,
        tasks,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_DAILY_ACTIVE_TASKS_WITH_SPACE_ID,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;
    try {
      const templates =
        await repetitiveTaskTemplateService.getActiveDailyTemplatesWithSpaceId(
          spaceId,
          userId,
        );
      event.reply(
        ChannelsEnum.RESPONSE_DAILY_ACTIVE_TASKS_WITH_SPACE_ID,
        templates,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID,
  async (event, spaceId: string) => {
    const userId = session.user ? session.user.id : null;

    try {
      const templates =
        await repetitiveTaskTemplateService.getActiveSpecificDaysInAWeekTemplatesWithSpaceId(
          spaceId,
          userId,
        );
      event.reply(
        ChannelsEnum.RESPONSE_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID,
        templates,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_UNSCHEDULED_ACTIVE_TASKS_WITHOUT_SPACE,
  async (event) => {
    const userId = session.user ? session.user.id : null;
    try {
      const tasks =
        await taskService.getActiveUnscheduledTasksWithoutSpace(userId);
      event.reply(
        ChannelsEnum.RESPONSE_UNSCHEDULED_ACTIVE_TASKS_WITH_SPACE_ID,
        tasks,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_ONE_OFF_ACTIVE_TASKS_WITHOUT_SPACE,
  async (event) => {
    const userId = session.user ? session.user.id : null;
    try {
      const tasks = await taskService.getActiveOnceTasksWithoutSpace(userId);
      event.reply(
        ChannelsEnum.RESPONSE_ONE_OFF_ACTIVE_TASKS_WITH_SPACE_ID,
        tasks,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_DAILY_ACTIVE_TASKS_WITHOUT_SPACE,
  async (event) => {
    const userId = session.user ? session.user.id : null;
    try {
      const templates =
        await repetitiveTaskTemplateService.getActiveDailyTemplatesWithoutSpace(
          userId,
        );

      event.reply(
        ChannelsEnum.RESPONSE_DAILY_ACTIVE_TASKS_WITH_SPACE_ID,
        templates,
      );
    } catch (err: any) {
      log.error(err?.message);
      throw err;
    }
  },
);

ipcMain.on(
  ChannelsEnum.REQUEST_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITHOUT_SPACE,
  async (event) => {
    const userId = session.user ? session.user.id : null;
    try {
      const templates =
        await repetitiveTaskTemplateService.getActiveSpecificDaysInAWeekTemplatesWithoutSpace(
          userId,
        );
      event.reply(
        ChannelsEnum.RESPONSE_SPECIFIC_DAYS_IN_A_WEEK_ACTIVE_TASKS_WITH_SPACE_ID,
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
    if (mainWindow) {
      mainWindow.focus();
    }
  }
});

ipcMain.handle(ChannelsEnum.REQUEST_SIGN_OUT, async () => {
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
    log.info('User signed out successfully.');
    return { success: true };
  } catch (err: any) {
    log.error('Sign out failed:', err.message);
    return {
      success: false,
      error: `Failed to sign out: ${err.message}`,
    };
  }
});

ipcMain.handle(ChannelsEnum.REQUEST_INITIAL_AUTH_STATUS, async () => {
  return await attemptAutoSignIn();
});

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
    createWindow();
    app.on('activate', () => {
      log.info('app activated');
      if (mainWindow === null) createWindow();
    });
  })
  .catch((err) => {
    if (isDebug) {
      console.log(err);
    } else {
      log.error(err);
    }
  });
