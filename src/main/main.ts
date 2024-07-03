/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  ITaskIPC,
  TaskScheduleTypeEnum,
  TaskCompletionStatusEnum,
  DaysInAWeek,
} from '../renderer/types';
import { flattenTasksForToday } from './helpers';

const prisma = new PrismaClient();

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
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

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
 * Add event listeners...
 */

ipcMain.on('create-task', async (_event, task: ITaskIPC) => {
  const { title, schedule, dueDate, days, shouldBeScored } = task;
  let monday;
  let tuesday;
  let wednesday;
  let thursday;
  let friday;
  let saturday;
  let sunday;

  if (schedule === TaskScheduleTypeEnum.Daily) {
    monday = true;
    tuesday = true;
    wednesday = true;
    thursday = true;
    friday = true;
    saturday = true;
    sunday = true;
  }

  if (schedule === TaskScheduleTypeEnum.SpecificDaysInAWeek) {
    days?.forEach((day) => {
      switch (day) {
        case 'monday':
          monday = true;
          break;
        case 'tuesday':
          tuesday = true;
          break;
        case 'wednesday':
          wednesday = true;
          break;
        case 'thursday':
          thursday = true;
          break;
        case 'friday':
          friday = true;
          break;
        case 'saturday':
          saturday = true;
          break;
        case 'sunday':
          sunday = true;
          break;
        default:
          break;
      }
    });
  }

  try {
    const taskInDB = await prisma.task.create({
      data: {
        title,
        schedule,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        shouldBeScored,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
        // lastEntryUpdateDate: new Date(),
      },
    });

    if (schedule === TaskScheduleTypeEnum.Once && dueDate) {
      await prisma.dailyTaskEntry.create({
        data: {
          taskId: taskInDB.id,
          completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
          dueDate: new Date(dueDate),
          createdAt: new Date(),
          lastModifiedAt: new Date(),
        },
      });

      await prisma.task.update({
        where: {
          id: taskInDB.id,
        },
        data: {
          lastEntryUpdateDate: new Date(),
        },
      });
    }
  } catch (err) {
    console.log(err);
  }
});

ipcMain.on('request-tasks-today', async (event) => {
  let today: number | DaysInAWeek = new Date().getDay();
  today = Object.values(DaysInAWeek)[today];

  const dateToday = new Date();
  const todayStart = new Date(dateToday.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(dateToday.setHours(23, 59, 59, 999)).toISOString();

  const repetitiveTaskQuery: { [key: string | DaysInAWeek]: boolean } = {
    isActive: true,
  };
  repetitiveTaskQuery[today] = true;

  try {
    // first create task entries for repetitive tasks
    const todaysRepetitiveTasks = await prisma.task.findMany({
      where: repetitiveTaskQuery,
    });

    await Promise.all(
      todaysRepetitiveTasks.map(async (task) => {
        await prisma.dailyTaskEntry.upsert({
          where: {
            taskId_dueDate: {
              taskId: task.id,
              dueDate: todayStart,
            },
          },
          create: {
            taskId: task.id,
            completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
            dueDate: todayStart,
            createdAt: new Date(),
            lastModifiedAt: new Date(),
          },
          update: {},
        });
      }),
    );

    const tasksForToday = await prisma.dailyTaskEntry.findMany({
      where: {
        dueDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        id: true,
        dueDate: true,
        completionStatus: true,
        score: true,
        task: {
          select: {
            title: true,
            shouldBeScored: true,
            schedule: true,
          },
        },
      },
    });

    const flattenedTasksForToday = flattenTasksForToday(tasksForToday);

    event.reply('response-tasks-today', flattenedTasksForToday);
  } catch (err) {
    console.log(err);
  }
});

ipcMain.on('request-tasks-overdue', async (event) => {
  const dateToday = new Date();
  const todayStart = new Date(dateToday.setHours(0, 0, 0, 0)).toISOString();

  const tasksOverdue = await prisma.dailyTaskEntry.findMany({
    where: {
      dueDate: {
        lt: todayStart,
      },
      completionStatus: TaskCompletionStatusEnum.INCOMPLETE,
    },
    select: {
      id: true,
      dueDate: true,
      completionStatus: true,
      score: true,
      task: {
        select: {
          title: true,
          shouldBeScored: true,
          schedule: true,
        },
      },
    },
  });

  const flattenedTasksOverdue = flattenTasksForToday(tasksOverdue);

  event.reply('response-tasks-overdue', flattenedTasksOverdue);
});

ipcMain.on(
  'request-toggle-task-completion-status',
  async (event, { id, checked, score }) => {
    // todo: need to make the one-off task in active
    await prisma.dailyTaskEntry.update({
      where: {
        id,
      },
      data: {
        completionStatus: checked
          ? TaskCompletionStatusEnum.COMPLETE
          : TaskCompletionStatusEnum.INCOMPLETE,
        score,
      },
    });
  },
);

ipcMain.on('request-monthly-report', async (event, { monthIndex }) => {
  const startOfMonth = dayjs().month(monthIndex).startOf('month').toDate();
  const endOfMonth = dayjs().month(monthIndex).endOf('month').toDate();

  const tasks = await prisma.task.findMany({
    where: {
      isActive: true,
      schedule: {
        in: [
          TaskScheduleTypeEnum.Daily,
          TaskScheduleTypeEnum.SpecificDaysInAWeek,
        ],
      },
    },
    include: {
      DailyTaskEntry: {
        orderBy: {
          dueDate: 'asc',
        },
        select: {
          id: true,
          completionStatus: true,
          dueDate: true,
          score: true,
        },
        where: {
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      },
    },
  });

  event.reply('response-monthly-report', tasks);
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
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
